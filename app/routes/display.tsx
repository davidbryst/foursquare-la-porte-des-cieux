import { useState, useEffect } from "react";
import { useRevalidator, Link } from "react-router";
import type { Route } from "./+types/display";
import { requireUser } from "~/utils/session.server";
import { getPresenceCode, getSessionExpiry } from "~/db/database.server";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Code de séance - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const [code, expiresAt] = await Promise.all([
    getPresenceCode(),
    getSessionExpiry(),
  ]);
  return { code, expiresAt };
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function DisplayPage({ loaderData }: Route.ComponentProps) {
  const { code, expiresAt } = loaderData;
  const [remaining, setRemaining] = useState<number>(
    expiresAt ? Math.max(0, expiresAt - Date.now()) : 0
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const revalidator = useRevalidator();

  // Décompte chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      const left = expiresAt ? Math.max(0, expiresAt - Date.now()) : 0;
      setRemaining(left);
      // Rafraîchir les données serveur quand la session expire
      if (left === 0 && expiresAt) revalidator.revalidate();
    }, 1_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  // Rafraîchir toutes les 5 minutes pour rester synchronisé
  useEffect(() => {
    const interval = setInterval(() => revalidator.revalidate(), 5 * 60_000);
    return () => clearInterval(interval);
  }, []);

  const isActive = expiresAt ? Date.now() < expiresAt : false;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0e2e] flex flex-col items-center justify-center select-none">
      {/* Bouton retour + rollcall + plein écran */}
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <Link
          to="/dashboard"
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
        >
          ← Dashboard
        </Link>
        <Link
          to="/rollcall?from=display"
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
        >
          <span className="hidden sm:inline">📋</span>
          <span>Liste d'appel</span>
          {/* <span className="hidden sm:inline">Liste d'appel</span> */}
        </Link>
        <button
          onClick={toggleFullscreen}
          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
        >
          {isFullscreen ? "Quitter plein écran" : "Plein écran"}
        </button>
      </div>

      {/* Logo / Titre église */}
      <p className="text-white/40 text-sm uppercase tracking-widest mb-8 font-medium">
        Assemblée La Porte des Cieux
      </p>

      {isActive ? (
        <>
          {/* Titre */}
          <p className="text-white/60 text-xl sm:text-2xl mb-4 font-light">
            Code de présence
          </p>

          {/* Code en grand */}
          <div className="bg-white/10 border border-white/20 rounded-3xl px-12 py-8 mb-6">
            <span className="text-[#c4a8ff] font-mono font-bold tracking-[0.35em]"
              style={{ fontSize: "clamp(4rem, 15vw, 10rem)" }}>
              {code}
            </span>
          </div>

          {/* Décompte */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-white/40 text-sm uppercase tracking-wider">
              Temps restant
            </p>
            <p className={`font-mono font-semibold tabular-nums ${remaining < 5 * 60_000
              ? "text-red-400"
              : remaining < 15 * 60_000
                ? "text-yellow-400"
                : "text-white/80"
              }`}
              style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}>
              {formatCountdown(remaining)}
            </p>
          </div>

          {/* Instruction */}
          <p className="mt-10 text-white/30 text-base sm:text-lg text-center max-w-md px-4">
            Saisissez ce code sur votre téléphone pour enregistrer votre présence
          </p>
        </>
      ) : (
        /* Séance inactive */
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-4xl">🔒</span>
          </div>
          <p className="text-white/50 text-2xl font-light text-center">
            Aucune séance active
          </p>
          <p className="text-white/30 text-base text-center max-w-sm">
            Démarrez une séance depuis le dashboard pour afficher le code.
          </p>
          <a
            href="/dashboard"
            className="mt-4 px-6 py-3 bg-[#4a2b87] hover:bg-[#5a3b97] text-white rounded-xl transition-colors font-medium"
          >
            Aller au dashboard
          </a>
        </div>
      )}
    </div>
  );
}
