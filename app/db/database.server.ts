import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Types
export interface Member {
  id: number;
  nom: string;
  prenom: string;
  numero: string | null;
  dateDeNaissance: string;
}

export interface Presence {
  id: number;
  nom: string;
  telephone: string;
  presence: string;
  culte: string;
  date: string;
  pkabsence?: string | null;
}

export interface Admin {
  id: number;
  username: string;
  password: string;
}

// Singleton database instance
let db: Database.Database | null = null;

function getDbPath(): string {
  // Créer le dossier data s'il n'existe pas
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, "data.db");
}

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = getDbPath();
    console.log("Ouverture de la base de données:", dbPath);
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initTables();
  }
  return db;
}

function initTables(): void {
  const database = db!;

  // Créer les tables
  database.exec(`
    CREATE TABLE IF NOT EXISTS "membre" (
      "id" INTEGER NOT NULL UNIQUE,
      "nom" TEXT NOT NULL,
      "prenom" TEXT NOT NULL,
      "numero" TEXT UNIQUE,
      "dateDeNaissance" TEXT NOT NULL,
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

    CREATE INDEX IF NOT EXISTS "idx_presence_member" ON "presence" ("member");
    CREATE INDEX IF NOT EXISTS "idx_presences_date" ON "presence" ("date");
  `);

  // Créer l'admin par défaut s'il n'existe pas
  const adminCount = database
    .prepare("SELECT COUNT(*) as count FROM admin")
    .get() as { count: number };

  if (adminCount.count === 0) {
    database
      .prepare("INSERT INTO admin (username, password) VALUES (?, ?)")
      .run("Culte", "Culte@Pr0t3ction");
    console.log("Admin par défaut créé");
  }
}

// === MEMBRES ===

export function getAllMembers(): Member[] {
  const database = getDb();
  return database
    .prepare(
      "SELECT id, nom, prenom, numero, dateDeNaissance FROM membre WHERE nom IS NOT NULL AND prenom IS NOT NULL"
    )
    .all() as Member[];
}

export function addMember(
  nom: string,
  prenom: string,
  numero: string | null,
  dateDeNaissance: string
): number | null {
  const database = getDb();
  try {
    const result = database
      .prepare(
        "INSERT INTO membre (nom, prenom, numero, dateDeNaissance) VALUES (?, ?, ?, ?)"
      )
      .run(nom.trim(), prenom.trim(), numero || null, dateDeNaissance);
    console.log("Nouveau membre ajouté avec ID:", result.lastInsertRowid);
    return Number(result.lastInsertRowid);
  } catch (e) {
    console.error("Erreur lors de l'ajout du membre:", e);
    return null;
  }
}

export function updateMember(
  memberId: number,
  nom: string,
  prenom: string,
  numero: string | null,
  dateDeNaissance: string
): boolean {
  const database = getDb();
  try {
    database
      .prepare(
        "UPDATE membre SET nom = ?, prenom = ?, numero = ?, dateDeNaissance = ? WHERE id = ?"
      )
      .run(nom.trim(), prenom.trim(), numero || null, dateDeNaissance, memberId);
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification du membre:", e);
    return false;
  }
}

// === HELPER: Reset SQLite sequence after deletion ===
function resetTableSequence(tableName: string): void {
  const database = getDb();
  try {
    // Simple strategy: just decrement the current sequence value for this table.
    // On ne laisse pas la valeur devenir négative.
    database
      .prepare("UPDATE sqlite_sequence SET seq = CASE WHEN seq > 0 THEN seq - 1 ELSE 0 END WHERE name = ?")
      .run(tableName);
  } catch (e) {
    console.warn(`Warning: Could not reset sequence for table ${tableName}:`, e);
  }
}

export function deleteMember(memberId: number): boolean {
  const database = getDb();
  try {
    // Supprimer les présences associées
    database.prepare("DELETE FROM presence WHERE member = ?").run(memberId);
    // Supprimer le membre
    database.prepare("DELETE FROM membre WHERE id = ?").run(memberId);
    // Reset the sqlite_sequence for membre table
    resetTableSequence("membre");
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression du membre:", e);
    return false;
  }
}

export function getMemberByNameAndPrenom(
  nom: string,
  prenom: string
): Member | null {
  const database = getDb();
  return (
    (database
      .prepare("SELECT * FROM membre WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)")
      .get(nom, prenom) as Member) || null
  );
}

// === PRESENCES ===

export function getAllPresences(): Presence[] {
  const database = getDb();
  const rows = database
    .prepare(
      `
    SELECT 
      p.id,
      p.member,
      p.culte as culteId,
      p.presence,
      p.date,
      p.pkabsence,
      m.nom,
      m.prenom,
      m.numero
    FROM presence p
    JOIN membre m ON p.member = m.id
    ORDER BY p.date DESC, m.nom, m.prenom
  `
    )
    .all() as any[];

  return rows.map((row) => {
    const nomComplet = `${row.nom || ""} ${row.prenom || ""}`.trim();
    const culteLabel =
      row.culteId === 1
        ? "1er culte"
        : row.culteId === 2
        ? "2ème culte"
        : `Culte ${row.culteId}`;

    return {
      id: row.id,
      nom: nomComplet || "Inconnu",
      telephone: row.numero || "N/A",
      presence: row.presence === 1 ? "Présent" : "Absent",
      culte: culteLabel,
      date: row.date || new Date().toLocaleDateString(),
      pkabsence: row.pkabsence || null,
    };
  });
}

export function checkPresenceExists(
  memberId: number,
  culteId: number,
  date: string
): boolean {
  const database = getDb();
  const result = database
    .prepare(
      "SELECT COUNT(*) as count FROM presence WHERE member = ? AND culte = ? AND date = ?"
    )
    .get(memberId, culteId, date) as { count: number };
  return result.count > 0;
}

export function addPresence(
  memberId: number,
  culteId: number,
  presence: boolean,
  date: string,
  pkabsence: string | null = null
): boolean {
  const database = getDb();

  // Vérifier si une présence existe déjà
  if (checkPresenceExists(memberId, culteId, date)) {
    console.log("Présence déjà enregistrée pour ce membre/culte/date");
    return false;
  }

  try {
    database
      .prepare(
        "INSERT INTO presence (member, culte, presence, date, pkabsence) VALUES (?, ?, ?, ?, ?)"
      )
      .run(memberId, culteId, presence ? 1 : 0, date, pkabsence || null);
    console.log("Présence ajoutée:", { memberId, culteId, presence, date });
    return true;
  } catch (e) {
    console.error("Erreur lors de l'ajout de la présence:", e);
    return false;
  }
}

export function updatePresence(
  presenceId: number,
  presence: boolean,
  culteId: number
): boolean {
  const database = getDb();
  try {
    database
      .prepare("UPDATE presence SET presence = ?, culte = ? WHERE id = ?")
      .run(presence ? 1 : 0, culteId, presenceId);
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification de la présence:", e);
    return false;
  }
}

export function deletePresence(presenceId: number): boolean {
  const database = getDb();
  try {
    database.prepare("DELETE FROM presence WHERE id = ?").run(presenceId);
    // Reset the sqlite_sequence for presence table
    resetTableSequence("presence");
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression de la présence:", e);
    return false;
  }
}

// === ADMIN ===

export function loginAdmin(
  username: string,
  password: string
): Admin | null {
  const database = getDb();
  try {
    const admin = database
      .prepare("SELECT * FROM admin WHERE username = ? AND password = ?")
      .get(username.trim(), password) as Admin | undefined;
    return admin || null;
  } catch (e) {
    console.error("Erreur lors de la connexion:", e);
    return null;
  }
}

export function checkAdminExists(username: string): boolean {
  const database = getDb();
  try {
    const result = database
      .prepare("SELECT id FROM admin WHERE username = ?")
      .get(username.trim());
    return !!result;
  } catch (e) {
    console.error("Erreur lors de la vérification de l'admin:", e);
    return false;
  }
}


