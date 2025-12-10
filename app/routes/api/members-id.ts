import { updateMember, deleteMember } from "~/db/database.server";
import type { Route } from "./+types/members-id";

// PUT /api/members/:id - Modifier un membre
// DELETE /api/members/:id - Supprimer un membre
export async function action({ request, params }: Route.ActionArgs) {
  const memberId = parseInt(params.id);
  
  if (isNaN(memberId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const success = deleteMember(memberId);
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
    const numero = formData.get("numero") as string | null;
    const dateDeNaissance = (formData.get("dateDeNaissance") as string) || "";

    if (!nom || !prenom) {
      return Response.json(
        { error: "Le nom et le prénom sont obligatoires" },
        { status: 400 }
      );
    }

    const success = updateMember(memberId, nom, prenom, numero, dateDeNaissance);
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

