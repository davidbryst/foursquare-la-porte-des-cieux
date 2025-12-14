import { getAllPresences, addPresence } from "~/db/database.server";
import type { Route } from "./+types/presences";

// GET - Récupérer toutes les présences
export async function loader({ request }: Route.LoaderArgs) {
  const presences = getAllPresences();
  return Response.json({ presences });
}

// POST - Ajouter une présence
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  
  const memberId = parseInt(formData.get("memberId") as string);
  const culteId = parseInt(formData.get("culteId") as string);
  const presence = formData.get("presence") === "true";
  const date = formData.get("date") as string;
  const pkabsence = formData.get("pkabsence") as string | null;

  if (isNaN(memberId) || isNaN(culteId) || !date) {
    return Response.json(
      { error: "Données invalides" },
      { status: 400 }
    );
  }

  const success = addPresence(memberId, culteId, presence, date, pkabsence || null);

  if (success) {
    return Response.json({ success: true });
  } else {
    return Response.json(
      { error: "Présence déjà enregistrée pour ce membre/culte/date", duplicate: true },
      { status: 400 }
    );
  }
}


