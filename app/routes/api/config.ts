import {
  getPresenceCode,
  setPresenceCode,
  getSessionExpiry,
  startCulteSession,
  stopCulteSession,
} from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/config";

// GET /api/config - Récupérer la config (admin requis)
export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const [presenceCode, expiresAt] = await Promise.all([
    getPresenceCode(),
    getSessionExpiry(),
  ]);
  return Response.json({
    presenceCode,
    expiresAt,
    isActive: expiresAt ? Date.now() < expiresAt : false,
  });
}

// PUT /api/config - Mettre à jour le code manuellement (admin requis)
// POST /api/config - Démarrer / Arrêter une séance (admin requis)
export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // Démarrer une séance avec code aléatoire
  if (intent === "start") {
    const durationHours = parseFloat(formData.get("durationHours") as string) || 2;
    const code = await startCulteSession(durationHours);
    if (code) {
      return Response.json({ success: true, code });
    }
    return Response.json({ error: "Impossible de démarrer la séance" }, { status: 500 });
  }

  // Arrêter la séance en cours
  if (intent === "stop") {
    const success = await stopCulteSession();
    return Response.json({ success });
  }

  // Modifier le code manuellement
  const newCode = (formData.get("presenceCode") as string)?.trim();
  if (!newCode || newCode.length < 4) {
    return Response.json(
      { error: "Le code doit contenir au moins 4 caractères" },
      { status: 400 }
    );
  }
  const success = await setPresenceCode(newCode);
  if (success) {
    return Response.json({ success: true });
  }
  return Response.json({ error: "Erreur lors de la mise à jour du code" }, { status: 500 });
}
