import { getAllMembers, addPresence, updatePresence } from "~/db/database.server";
import { getDb } from "~/db/database.server";

// Récupérer l'état de présence d'un membre pour un culte/date donné
async function getPresenceByMemberCulteDate(
    memberId: number,
    culteId: number,
    date: string
): Promise<{ id: number; presence: number } | null> {
    const db = getDb();
    const result = await db.execute({
        sql: "SELECT id, presence FROM presence WHERE member = ? AND culte = ? AND date = ?",
        args: [memberId, culteId, date],
    });
    if (result.rows.length === 0) return null;
    return { id: Number(result.rows[0].id), presence: Number(result.rows[0].presence) };
}

// GET /api/rollcall?date=YYYY-MM-DD&culteId=1&categorie=tous
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    const culteId = parseInt(url.searchParams.get("culteId") || "1");
    const categorie = url.searchParams.get("categorie") || "tous";

    if (isNaN(culteId)) {
        return Response.json({ error: "culteId invalide" }, { status: 400 });
    }

    const allMembers = await getAllMembers();
    const filtered = categorie === "tous"
        ? allMembers
        : allMembers.filter((m) => m.categorie === categorie);

    const db = getDb();
    // Récupérer toutes les présences de ce culte/date en une seule requête
    const presResult = await db.execute({
        sql: "SELECT member, id, presence FROM presence WHERE culte = ? AND date = ?",
        args: [culteId, date],
    });

    const presenceMap = new Map<number, { id: number; present: boolean }>();
    for (const row of presResult.rows as any[]) {
        presenceMap.set(Number(row.member), { id: Number(row.id), present: row.presence === 1 });
    }

    const members = filtered.map((m) => {
        const p = presenceMap.get(m.id);
        return {
            id: m.id,
            nom: m.nom,
            prenom: m.prenom,
            categorie: m.categorie,
            presenceId: p?.id ?? null,
            present: p?.present ?? null, // null = non encore enregistré
        };
    });

    const totalPresent = members.filter((m) => m.present === true).length;

    return Response.json({ members, totalPresent, total: members.length, date, culteId });
}

// POST /api/rollcall — toggle la présence d'un membre
export async function action({ request }: { request: Request }) {
    if (request.method !== "POST") {
        return Response.json({ error: "Méthode non autorisée" }, { status: 405 });
    }

    const body = await request.json();
    const { memberId, culteId, date, present } = body as {
        memberId: number;
        culteId: number;
        date: string;
        present: boolean;
    };

    if (!memberId || !culteId || !date || typeof present !== "boolean") {
        return Response.json({ error: "Données invalides" }, { status: 400 });
    }

    const existing = await getPresenceByMemberCulteDate(memberId, culteId, date);

    if (existing) {
        // Mettre à jour la présence existante
        const ok = await updatePresence(existing.id, present, culteId, null);
        if (!ok) return Response.json({ error: "Erreur mise à jour" }, { status: 500 });
        return Response.json({ success: true, presenceId: existing.id, present });
    } else {
        // Créer une nouvelle entrée
        const ok = await addPresence(memberId, culteId, present, date, null);
        if (!ok) return Response.json({ error: "Erreur insertion" }, { status: 500 });

        // Récupérer l'id nouvellement créé
        const created = await getPresenceByMemberCulteDate(memberId, culteId, date);
        return Response.json({ success: true, presenceId: created?.id ?? null, present });
    }
}
