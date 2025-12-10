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
    const success = deletePresence(presenceId);
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

    if (isNaN(culteId)) {
      return Response.json(
        { error: "Culte invalide" },
        { status: 400 }
      );
    }

    const success = updatePresence(presenceId, presence, culteId);
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

