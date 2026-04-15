import { updateVisiteur, deleteVisiteur } from "~/db/database.server";
import type { Route } from "./+types/visitors-id";

// PUT /api/visitors/:id - Modifier un visiteur
// DELETE /api/visitors/:id - Supprimer un visiteur
export async function action({ request, params }: Route.ActionArgs) {
  const visiteurId = parseInt(params.id);

  if (isNaN(visiteurId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const success = await deleteVisiteur(visiteurId);
    if (success) {
      return Response.json({ success: true });
    } else {
      return Response.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }
  }

  if (request.method === "PUT") {
    const formData = await request.formData();
    const nom = formData.get("nom") as string;
    const prenom = formData.get("prenom") as string;
    const telephone = formData.get("telephone") as string | null;
    const culteId = parseInt(formData.get("culteId") as string) || 1;
    const categorie = (formData.get("categorie") as string) || "hommes";
    const ageRaw = formData.get("age") as string | null;
    const age = ageRaw ? parseInt(ageRaw) : null;
    const provenance = formData.get("provenance") as string | null;

    if (!nom || !prenom) {
      return Response.json(
        { error: "Le nom et le prénom sont obligatoires" },
        { status: 400 }
      );
    }

    const success = await updateVisiteur(
      visiteurId,
      nom,
      prenom,
      telephone || null,
      culteId,
      categorie,
      age && !isNaN(age) ? age : null,
      provenance || null
    );
    if (success) {
      return Response.json({ success: true });
    } else {
      return Response.json(
        { error: "Erreur lors de la modification" },
        { status: 500 }
      );
    }
  }

  return Response.json({ error: "Méthode non autorisée" }, { status: 405 });
}
