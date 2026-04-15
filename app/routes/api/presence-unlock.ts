import { getPresenceCode, getSessionExpiry } from "~/db/database.server";
import type { Route } from "./+types/presence-unlock";

// Rate limiting : 5 tentatives par IP par fenêtre de 60 secondes
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// POST /api/presence-unlock
export async function action({ request }: Route.ActionArgs) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const code = (formData.get("code") as string)?.trim();

  if (!code) {
    return Response.json({ error: "Le code est requis" }, { status: 400 });
  }

  // Vérifier l'expiration de la séance
  const expiresAt = await getSessionExpiry();
  if (expiresAt !== null && Date.now() > expiresAt) {
    return Response.json(
      { error: "La séance est terminée. Contactez l'administrateur." },
      { status: 403 }
    );
  }

  const storedCode = await getPresenceCode();

  if (code === storedCode) {
    attempts.delete(ip);
    return Response.json({ success: true });
  } else {
    return Response.json(
      { error: "Code incorrect. Veuillez réessayer." },
      { status: 401 }
    );
  }
}
