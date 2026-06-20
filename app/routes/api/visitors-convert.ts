import { addMember, getMemberByNameAndPrenom, deleteVisiteur } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/visitors-convert";

// POST /api/visitors-convert
// Convertit un invité récurrent en membre permanent puis retire ses lignes invité.
// body: { nom, prenom, telephone, categorie, residence, ids: number[] }
export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  if (request.method !== "POST") {
    return Response.json({ error: "Méthode non autorisée" }, { status: 405 });
  }

  const body = await request.json();
  const nom = (body.nom || "").trim();
  const prenom = (body.prenom || "").trim();
  const telephone = (body.telephone || "").trim() || null;
  const categorie = body.categorie || "hommes";
  const residence = (body.residence || "").trim() || null;
  const ids: number[] = Array.isArray(body.ids)
    ? body.ids.map((n: any) => Number(n)).filter((n: number) => !isNaN(n))
    : [];

  if (!nom || !prenom) {
    return Response.json({ error: "Nom et prénom requis" }, { status: 400 });
  }

  // Ne pas créer de doublon si la personne est déjà membre
  const existing = await getMemberByNameAndPrenom(nom, prenom);
  let created = false;
  if (!existing) {
    const memberId = await addMember(nom, prenom, telephone, residence, categorie, null);
    if (!memberId) {
      return Response.json(
        { error: "Impossible de créer le membre (numéro de téléphone déjà utilisé ?)" },
        { status: 500 }
      );
    }
    created = true;
  }

  // Retirer toutes les lignes invité de cette personne
  for (const id of ids) {
    await deleteVisiteur(id);
  }

  return Response.json({ success: true, alreadyMember: !created });
}
