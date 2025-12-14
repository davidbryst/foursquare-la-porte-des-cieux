import { updatePresence, deletePresence } from "~/db/database.server";
import type { Route } from "./+types/presences-id";

// PUT /api/presences/:id - Modifier une présence
// DELETE /api/presences/:id - Supprimer une présence
export async function action({ request, params }: Route.ActionArgs) {
  const presenceId = parseInt(params.id);
  
  if (isNaN(presenceId)) {
    return Response.json({ error: "ID invalide" }, { status: 400 });
  }

  if (request.method === "DELETE") {
    const success = await deletePresence(presenceId);
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
    const presence = formData.get("presence") === "true";
    const culteId = parseInt(formData.get("culteId") as string);
    const pkabsence = formData.get("pkabsence") as string | null;

    if (isNaN(culteId)) {
      return Response.json(
        { error: "Culte invalide" },
        { status: 400 }
      );
    }

    // Si absent et pas de raison, retourner une erreur
    if (!presence && !pkabsence) {
      return Response.json(
        { error: "La raison d'absence est requise" },
        { status: 400 }
      );
    }

    const success = await updatePresence(presenceId, presence, culteId, presence ? null : pkabsence);
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
