import { createClient, type Client } from "@libsql/client";

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
let db: Client | null = null;

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

    // Initialize tables
    initTables();
  }
  return db;
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
  const adminCount = await database.execute("SELECT COUNT(*) as count FROM admin");
  const count = (adminCount.rows[0] as any)?.count || 0;

  if (count === 0) {
    await database.execute({
      sql: "INSERT INTO admin (username, password) VALUES (?, ?)",
      args: ["Culte", "Culte@Pr0t3ction"],
    });
    console.log("Admin par défaut créé");
  }
}

// === MEMBRES ===

export async function getAllMembers(): Promise<Member[]> {
  const database = getDb();
  const result = await database.execute(
    "SELECT id, nom, prenom, numero, dateDeNaissance FROM membre WHERE nom IS NOT NULL AND prenom IS NOT NULL"
  );
  return result.rows as unknown as Member[];
}

export async function addMember(
  nom: string,
  prenom: string,
  numero: string | null,
  dateDeNaissance: string
): Promise<number | null> {
  const database = getDb();
  try {
    const result = await database.execute({
      sql: "INSERT INTO membre (nom, prenom, numero, dateDeNaissance) VALUES (?, ?, ?, ?)",
      args: [nom.trim(), prenom.trim(), numero || null, dateDeNaissance],
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
  dateDeNaissance: string
): Promise<boolean> {
  const database = getDb();
  try {
    await database.execute({
      sql: "UPDATE membre SET nom = ?, prenom = ?, numero = ?, dateDeNaissance = ? WHERE id = ?",
      args: [nom.trim(), prenom.trim(), numero || null, dateDeNaissance, memberId],
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de la modification du membre:", e);
    return false;
  }
}

// === HELPER: Reset SQLite sequence after deletion ===
async function resetTableSequence(tableName: string, nb: number = 1): Promise<void> {
  const database = getDb();
  try {
    await database.execute({
      sql: `UPDATE sqlite_sequence SET seq = CAST(CASE WHEN seq > (? - 1) THEN seq - ? ELSE 0 END AS INTEGER) WHERE name = ?`,
      args: [Math.floor(nb), Math.floor(nb), tableName],
    });
  } catch (e) {
    console.warn(`Warning: Could not reset sequence for table ${tableName}:`, e);
  }
}

export async function deleteMember(memberId: number): Promise<boolean> {
  const database = getDb();
  try {
    // Compter les présences AVANT de les supprimer
    const presenceCountResult = await database.execute({
      sql: "SELECT COUNT(*) as count FROM presence WHERE member = ?",
      args: [memberId],
    });
    const nbPresences = (presenceCountResult.rows[0] as any)?.count || 0;

    // Supprimer les présences associées
    await database.execute({
      sql: "DELETE FROM presence WHERE member = ?",
      args: [memberId],
    });

    // Supprimer le membre
    await database.execute({
      sql: "DELETE FROM membre WHERE id = ?",
      args: [memberId],
    });

    // Reset les séquences
    await resetTableSequence("membre", 1);
    if (nbPresences > 0) {
      await resetTableSequence("presence", nbPresences);
    }

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
  const database = getDb();
  const result = await database.execute({
    sql: "SELECT * FROM membre WHERE LOWER(nom) = LOWER(?) AND LOWER(prenom) = LOWER(?)",
    args: [nom, prenom],
  });
  return (result.rows[0] as unknown as Member) || null;
}

// === PRESENCES ===

export async function getAllPresences(): Promise<Presence[]> {
  const database = getDb();
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
      m.numero
    FROM presence p
    JOIN membre m ON p.member = m.id
    ORDER BY p.date DESC, m.nom, m.prenom
  `);

  return result.rows.map((row: any) => {
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

export async function checkPresenceExists(
  memberId: number,
  culteId: number,
  date: string
): Promise<boolean> {
  const database = getDb();
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
  const database = getDb();

  // Vérifier si une présence existe déjà
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
  const database = getDb();
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
  const database = getDb();
  try {
    await database.execute({
      sql: "DELETE FROM presence WHERE id = ?",
      args: [presenceId],
    });
    // Reset the sqlite_sequence for presence table
    await resetTableSequence("presence");
    return true;
  } catch (e) {
    console.error("Erreur lors de la suppression de la présence:", e);
    return false;
  }
}

// === ADMIN ===

export async function loginAdmin(
  username: string,
  password: string
): Promise<Admin | null> {
  const database = getDb();
  try {
    const result = await database.execute({
      sql: "SELECT * FROM admin WHERE username = ? AND password = ?",
      args: [username.trim(), password],
    });
    return (result.rows[0] as unknown as Admin) || null;
  } catch (e) {
    console.error("Erreur lors de la connexion:", e);
    return null;
  }
}

export async function checkAdminExists(username: string): Promise<boolean> {
  const database = getDb();
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
