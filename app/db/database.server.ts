import { createClient, type Client } from "@libsql/client";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import type { ReportPerson, DailyReport } from "~/utils/report";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashedHex] = stored.split(":");
  if (!salt || !hashedHex) return false;
  const hashedBuf = Buffer.from(hashedHex, "hex");
  const inputBuf = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, inputBuf);
}

// Types
export interface Member {
  id: number;
  nom: string;
  prenom: string;
  numero: string | null;
  dateEnregistrement: string | null;
  residence: string | null;
  categorie: string;
  photo: string | null;
}

export interface Presence {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  presence: string;
  culte: string;
  date: string;
  pkabsence?: string | null;
  categorie?: string;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
}

export interface Visiteur {
  id: number;
  nom: string;
  prenom: string;
  telephone: string | null;
  culte: string;
  culteId: number;
  date: string;
  categorie: string;
  residence: string | null;
  provenance: string | null;
}

// Singleton database instance
let db: Client | null = null;
let dbReady: Promise<void> | null = null;

export function getDb(): Client {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("TURSO_DATABASE_URL is not defined");
    }

    db = createClient({
      url,
      authToken,
    });

    // Initialize tables (store promise to await in CRUD functions)
    dbReady = initTables();
  }
  return db;
}

async function ensureDb(): Promise<Client> {
  const database = getDb();
  if (dbReady) await dbReady;
  return database;
}

async function initTables(): Promise<void> {
  const database = getDb();

  // Créer les tables
  await database.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "membre" (
      "id" INTEGER NOT NULL UNIQUE,
      "nom" TEXT NOT NULL,
      "prenom" TEXT NOT NULL,
      "numero" TEXT UNIQUE,
      "dateDeNaissance" TEXT,
      "residence" TEXT,
      "dateEnregistrement" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    );

    CREATE TABLE IF NOT EXISTS "culte" (
      "id" INTEGER NOT NULL UNIQUE,
      "nom" TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );

    CREATE TABLE IF NOT EXISTS "admin" (
      "id" INTEGER NOT NULL UNIQUE,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    );

    CREATE TABLE IF NOT EXISTS "presence" (
      "id" INTEGER NOT NULL UNIQUE,
      "culte" INTEGER NOT NULL,
      "presence" INTEGER NOT NULL,
      "date" TEXT NOT NULL,
      "member" INTEGER NOT NULL,
      "pkabsence" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT),
      FOREIGN KEY("culte") REFERENCES "culte"("id"),
      FOREIGN KEY("member") REFERENCES "membre"("id")
    );

    CREATE TABLE IF NOT EXISTS "config" (
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      PRIMARY KEY("key")
    );

    CREATE TABLE IF NOT EXISTS "visiteur" (
      "id" INTEGER NOT NULL UNIQUE,
      "nom" TEXT NOT NULL,
      "prenom" TEXT NOT NULL,
      "telephone" TEXT,
      "culte" INTEGER NOT NULL,
      "date" TEXT NOT NULL,
      "categorie" TEXT DEFAULT 'hommes',
      "dateDeNaissance" TEXT,
      "residence" TEXT,
      "provenance" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT),
      FOREIGN KEY("culte") REFERENCES "culte"("id")
    );

    CREATE INDEX IF NOT EXISTS "idx_presence_member" ON "presence" ("member");
    CREATE INDEX IF NOT EXISTS "idx_presences_date" ON "presence" ("date");
  `);

  // Migrations : ajouter les colonnes si elles n'existent pas encore
  const migrations = [
    `ALTER TABLE membre ADD COLUMN categorie TEXT DEFAULT 'hommes'`,
    `ALTER TABLE membre ADD COLUMN photo TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_presence_unique ON presence(member, culte, date)`,
    `ALTER TABLE visiteur ADD COLUMN dateDeNaissance TEXT`,
    `ALTER TABLE membre ADD COLUMN residence TEXT`,
    `ALTER TABLE visiteur ADD COLUMN residence TEXT`,
    // Date d'enregistrement du membre (jour de l'inscription, pas la date de naissance)
    `ALTER TABLE membre ADD COLUMN dateEnregistrement TEXT`,
  ];
  for (const sql of migrations) {
    try {
      await database.execute(sql);
    } catch {
      // La colonne existe déjà — ignorer l'erreur
    }
  }

  // Créer l'admin par défaut s'il n'existe pas
  const adminCount = await database.execute("SELECT COUNT(*) as count FROM admin");
  const count = (adminCount.rows[0] as any)?.count || 0;
  if (count === 0) {
    const defaultUser = process.env.ADMIN_USERNAME?.trim() || "Culte";
    const defaultPass = process.env.ADMIN_PASSWORD || "Culte@Pr0t3ction";
    if (!process.env.ADMIN_PASSWORD) {
      console.warn(
        "[SÉCURITÉ] Aucun ADMIN_PASSWORD défini — l'admin est créé avec le mot de passe par défaut. " +
        "Définissez ADMIN_PASSWORD (et ADMIN_USERNAME) puis changez-le immédiatement."
      );
    }
    const hashed = await hashPassword(defaultPass);
    await database.execute({
      sql: "INSERT INTO admin (username, password) VALUES (?, ?)",
      args: [defaultUser, hashed],
    });
    console.log("Admin par défaut créé");
  } else {
    // Migrer les mots de passe en clair vers le hachage scrypt
    const admins = await database.execute("SELECT id, password FROM admin");
    for (const row of admins.rows as any[]) {
      if (!String(row.password).includes(":")) {
        const hashed = await hashPassword(row.password);
        await database.execute({
          sql: "UPDATE admin SET password = ? WHERE id = ?",
          args: [hashed, row.id],
        });
      }
    }
  }

  // Insérer les configs par défaut
  await database.execute({
    sql: "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)",
    args: ["presence_code", "1234"],
  });
  await database.execute({
    sql: "INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)",
    args: ["presence_code_expires_at", ""],
  });
}

// Libellé d'un culte à partir de son identifiant (1 = 1er, 2 = 2ème, 3 = Autre)
function culteLabel(culteId: number): string {
  if (culteId === 1) return "1er culte";
  if (culteId === 2) return "2ème culte";
  if (culteId === 3) return "Autre";
  return `Culte ${culteId}`;
}

// === MEMBRES ===

export async function getAllMembers(): Promise<Member[]> {
  const database = await ensureDb();
  const result = await database.execute(
    "SELECT id, nom, prenom, numero, dateEnregistrement, residence, COALESCE(categorie, 'hommes') as categorie, photo FROM membre WHERE nom IS NOT NULL AND prenom IS NOT NULL"
  );
  return result.rows as unknown as Member[];
}

export async function addMember(
  nom: string,
  prenom: string,
  numero: string | null,
  residence: string | null = null,
  categorie: string = "hommes",
  photo: string | null = null
): Promise<number | null> {
  const database = await ensureDb();
  // Date d'enregistrement = jour de l'inscription (côté serveur)
  const dateEnregistrement = new Date().toISOString().split("T")[0];
  try {
    const result = await database.execute({
      // dateDeNaissance est une colonne héritée NOT NULL sur les bases existantes :
      // on y insère "" pour satisfaire la contrainte, la vraie info est dateEnregistrement.
      sql: "INSERT INTO membre (nom, prenom, numero, dateDeNaissance, dateEnregistrement, residence, categorie, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [nom.trim(), prenom.trim(), numero || null, "", dateEnregistrement, residence || null, categorie, photo || null],
    });
    console.log("Nouveau membre ajouté avec ID:", result.lastInsertRowid);
    return Number(result.lastInsertRowid);
  } catch (e) {
    console.error("Erreur lors de l'ajout du membre:", e);
    return null;
  }
}

export async function updateMember(
  memberId: number,
  nom: string,
  prenom: string,
  numero: string | null,
  residence: string | null,
  categorie?: string,
  photo?: string | null
): Promise<boolean> {
  const database = await ensureDb();
  try {
    // On ne touche une colonne optionnelle que si elle est explicitement fournie.
    // photo === undefined  -> on garde la photo existante
    // photo === null / ""  -> on efface la photo
    const fields = ["nom = ?", "prenom = ?", "numero = ?", "residence = ?"];
    const args: (string | number | null)[] = [
      nom.trim(), prenom.trim(), numero || null, residence || null,
    ];
    if (categorie !== undefined) {
      fields.push("categorie = ?");
      args.push(categorie);
    }
    if (photo !== undefined) {
      fields.push("photo = ?");
      args.push(photo || null);
    }
    args.push(memberId);
    await database.execute({
      sql: `UPDATE membre SET ${fields.join(", ")} WHERE id = ?`,
      args,
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification du membre:", e);
    return false;
  }
}

export async function deleteMember(memberId: number): Promise<boolean> {
  const database = await ensureDb();
  try {
    // Supprimer d'abord les présences liées (clé étrangère), puis le membre.
    await database.execute({
      sql: "DELETE FROM presence WHERE member = ?",
      args: [memberId],
    });
    await database.execute({
      sql: "DELETE FROM membre WHERE id = ?",
      args: [memberId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression du membre:", e);
    return false;
  }
}

export async function getMemberByNameAndPrenom(
  nom: string,
  prenom: string
): Promise<Member | null> {
  const database = await ensureDb();
  const result = await database.execute({
    sql: "SELECT * FROM membre WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)",
    args: [nom, prenom],
  });
  return (result.rows[0] as unknown as Member) || null;
}

// === PRESENCES ===

export async function getAllPresences(): Promise<Presence[]> {
  const database = await ensureDb();
  const result = await database.execute(`
    SELECT
      p.id,
      p.member,
      p.culte as culteId,
      p.presence,
      p.date,
      p.pkabsence,
      m.nom,
      m.prenom,
      m.numero,
      COALESCE(m.categorie, 'hommes') as categorie
    FROM presence p
    JOIN membre m ON p.member = m.id
    ORDER BY p.date DESC, m.nom, m.prenom
  `);

  return result.rows.map((row: any) => {
    return {
      id: row.id,
      nom: row.nom || "Inconnu",
      prenom: row.prenom || "Inconnu",
      telephone: row.numero || "N/A",
      presence: row.presence === 1 ? "Présent" : "Absent",
      culte: culteLabel(row.culteId),
      date: row.date || new Date().toLocaleDateString(),
      pkabsence: row.pkabsence || null,
      categorie: row.categorie || "hommes",
    };
  });
}

export async function checkPresenceExists(
  memberId: number,
  culteId: number,
  date: string
): Promise<boolean> {
  const database = await ensureDb();
  const result = await database.execute({
    sql: "SELECT COUNT(*) as count FROM presence WHERE member = ? AND culte = ? AND date = ?",
    args: [memberId, culteId, date],
  });
  return ((result.rows[0] as any)?.count || 0) > 0;
}

export async function addPresence(
  memberId: number,
  culteId: number,
  presence: boolean,
  date: string,
  pkabsence: string | null = null
): Promise<boolean> {
  const database = await ensureDb();

  if (await checkPresenceExists(memberId, culteId, date)) {
    console.log("Présence déjà enregistrée pour ce membre/culte/date");
    return false;
  }

  try {
    await database.execute({
      sql: "INSERT INTO presence (member, culte, presence, date, pkabsence) VALUES (?, ?, ?, ?, ?)",
      args: [memberId, culteId, presence ? 1 : 0, date, pkabsence || null],
    });
    console.log("Présence ajoutée:", { memberId, culteId, presence, date });
    return true;
  } catch (e) {
    console.error("Erreur lors de l'ajout de la présence:", e);
    return false;
  }
}

export async function updatePresence(
  presenceId: number,
  presence: boolean,
  culteId: number,
  pkabsence: string | null = null
): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "UPDATE presence SET presence = ?, culte = ?, pkabsence = ? WHERE id = ?",
      args: [presence ? 1 : 0, culteId, pkabsence, presenceId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification de la présence:", e);
    return false;
  }
}

export async function deletePresence(presenceId: number): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "DELETE FROM presence WHERE id = ?",
      args: [presenceId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression de la présence:", e);
    return false;
  }
}

// === VISITEURS ===

export async function getAllVisiteurs(): Promise<Visiteur[]> {
  const database = await ensureDb();
  const result = await database.execute(`
    SELECT
      v.id,
      v.nom,
      v.prenom,
      v.telephone,
      v.culte as culteId,
      v.date,
      COALESCE(v.categorie, 'hommes') as categorie,
      v.residence,
      v.provenance
    FROM visiteur v
    ORDER BY v.date DESC, v.nom, v.prenom
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    nom: row.nom || "",
    prenom: row.prenom || "",
    telephone: row.telephone || null,
    culteId: row.culteId,
    culte: culteLabel(row.culteId),
    date: row.date || "",
    categorie: row.categorie || "hommes",
    residence: row.residence || null,
    provenance: row.provenance || null,
  }));
}

export async function addVisiteur(
  nom: string,
  prenom: string,
  telephone: string | null,
  culteId: number,
  date: string,
  categorie: string,
  residence: string | null,
  provenance: string | null
): Promise<number | null> {
  const database = await ensureDb();
  try {
    const result = await database.execute({
      sql: "INSERT INTO visiteur (nom, prenom, telephone, culte, date, categorie, residence, provenance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [nom.trim(), prenom.trim(), telephone || null, culteId, date, categorie, residence || null, provenance || null],
    });
    return Number(result.lastInsertRowid);
  } catch (e) {
    console.error("Erreur lors de l'ajout du visiteur:", e);
    return null;
  }
}

export async function updateVisiteur(
  visiteurId: number,
  nom: string,
  prenom: string,
  telephone: string | null,
  culteId: number,
  categorie: string,
  residence: string | null,
  provenance: string | null
): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "UPDATE visiteur SET nom = ?, prenom = ?, telephone = ?, culte = ?, categorie = ?, residence = ?, provenance = ? WHERE id = ?",
      args: [nom.trim(), prenom.trim(), telephone || null, culteId, categorie, residence || null, provenance || null, visiteurId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification du visiteur:", e);
    return false;
  }
}

export async function deleteVisiteur(visiteurId: number): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "DELETE FROM visiteur WHERE id = ?",
      args: [visiteurId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression du visiteur:", e);
    return false;
  }
}

// === CONFIG ===

export async function getPresenceCode(): Promise<string> {
  const database = await ensureDb();
  try {
    const result = await database.execute({
      sql: "SELECT value FROM config WHERE key = ?",
      args: ["presence_code"],
    });
    return (result.rows[0] as any)?.value || "1234";
  } catch {
    return "1234";
  }
}

export async function setPresenceCode(code: string): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
      args: ["presence_code", code],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la mise à jour du code:", e);
    return false;
  }
}

// Retourne le timestamp d'expiration (ms) ou null si pas de session active
export async function getSessionExpiry(): Promise<number | null> {
  const database = await ensureDb();
  try {
    const result = await database.execute({
      sql: "SELECT value FROM config WHERE key = ?",
      args: ["presence_code_expires_at"],
    });
    const val = (result.rows[0] as any)?.value;
    if (!val) return null;
    const ts = parseInt(val);
    return isNaN(ts) ? null : ts;
  } catch {
    return null;
  }
}

// Démarre une séance : génère un code aléatoire + expiry
export async function startCulteSession(durationHours: number): Promise<string | null> {
  const database = await ensureDb();
  try {
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 chiffres
    const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
    await database.execute({
      sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
      args: ["presence_code", code],
    });
    await database.execute({
      sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
      args: ["presence_code_expires_at", String(expiresAt)],
    });
    return code;
  } catch (e) {
    console.error("Erreur lors du démarrage de séance:", e);
    return null;
  }
}

// Arrête la séance en cours (expiry = passé)
export async function stopCulteSession(): Promise<boolean> {
  const database = await ensureDb();
  try {
    await database.execute({
      sql: "INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)",
      args: ["presence_code_expires_at", ""],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de l'arrêt de séance:", e);
    return false;
  }
}

// Vérifie si la séance est active (code existant + non expiré)
export async function isSessionActive(): Promise<boolean> {
  const expiry = await getSessionExpiry();
  if (!expiry) return false;
  return Date.now() < expiry;
}

// === ADMIN ===

export async function loginAdmin(
  username: string,
  password: string
): Promise<Admin | null> {
  const database = await ensureDb();
  try {
    const result = await database.execute({
      sql: "SELECT * FROM admin WHERE username = ?",
      args: [username.trim()],
    });
    const admin = result.rows[0] as unknown as Admin | undefined;
    if (!admin) return null;
    const valid = await verifyPassword(password, admin.password);
    return valid ? admin : null;
  } catch (e) {
    console.error("Erreur lors de la connexion:", e);
    return null;
  }
}

export async function checkAdminExists(username: string): Promise<boolean> {
  const database = await ensureDb();
  try {
    const result = await database.execute({
      sql: "SELECT id FROM admin WHERE username = ?",
      args: [username.trim()],
    });
    return result.rows.length > 0;
  } catch (e) {
    console.error("Erreur lors de la vérification de l'admin:", e);
    return false;
  }
}

// === RAPPORT JOURNALIER ===

// Tri alphabétique français par nom puis prénom
function sortByName(a: ReportPerson, b: ReportPerson): number {
  return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr", { sensitivity: "base" });
}

// Données du rapport journalier pour une date (logique « journalier » :
// présent à AU MOINS un culte du jour => jamais compté absent).
export async function getDailyReportData(date: string): Promise<DailyReport> {
  const database = await ensureDb();

  // Membres présents (présence = 1) au moins une fois ce jour-là, dédoublonnés
  const presRes = await database.execute({
    sql: `SELECT DISTINCT m.id, m.nom, m.prenom, COALESCE(m.categorie, 'hommes') as categorie, m.numero
          FROM presence p JOIN membre m ON p.member = m.id
          WHERE p.date = ? AND p.presence = 1`,
    args: [date],
  });
  const presentIds = new Set<number>();
  const presents: ReportPerson[] = [];
  for (const r of presRes.rows as any[]) {
    presentIds.add(Number(r.id));
    presents.push({ nom: r.nom || "", prenom: r.prenom || "", categorie: r.categorie || "hommes", contact: r.numero || "" });
  }

  // Cultes ayant eu de l'activité ce jour-là
  const cultesRes = await database.execute({
    sql: `SELECT DISTINCT culte FROM presence WHERE date = ? ORDER BY culte`,
    args: [date],
  });
  const cultes = (cultesRes.rows as any[]).map((r) => culteLabel(Number(r.culte)));

  // Absents = tous les membres non présents ce jour-là
  const allMembers = await getAllMembers();
  const absents: ReportPerson[] = allMembers
    .filter((m) => !presentIds.has(m.id))
    .map((m) => ({ nom: m.nom || "", prenom: m.prenom || "", categorie: m.categorie || "hommes", contact: m.numero || "" }));

  // Invités présents ce jour-là
  const visRes = await database.execute({
    sql: `SELECT nom, prenom, COALESCE(categorie, 'hommes') as categorie, telephone FROM visiteur WHERE date = ?`,
    args: [date],
  });
  const invites: ReportPerson[] = (visRes.rows as any[]).map((v) => ({
    nom: v.nom || "", prenom: v.prenom || "", categorie: v.categorie || "hommes", contact: v.telephone || "",
  }));

  presents.sort(sortByName);
  absents.sort(sortByName);
  invites.sort(sortByName);

  return {
    date,
    cultes,
    presents,
    invites,
    absents,
    counts: { presents: presents.length + invites.length, absents: absents.length, invites: invites.length },
  };
}
