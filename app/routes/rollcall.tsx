import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/rollcall";
import { getAllMembers } from "~/db/database.server";

export function meta({ }: Route.MetaArgs) {
    return [{ title: "Liste d'appel - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
    // Pas d'authentification requise — accessible aux huissiers sans connexion
    const members = await getAllMembers();
    const categories = ["tous", "hommes", "femmes", "jeunes", "enfants"];
    return { categories, totalMembers: members.length };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberRow {
    id: number;
    nom: string;
    prenom: string;
    categorie: string;
    presenceId: number | null;
    present: boolean | null; // null = pas encore enregistré
}

interface RollCallData {
    members: MemberRow[];
    totalPresent: number;
    total: number;
    date: string;
    culteId: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today(): string {
    return new Date().toISOString().split("T")[0];
}

const CATEGORIE_LABELS: Record<string, string> = {
    tous: "Tous",
    hommes: "Hommes",
    femmes: "Femmes",
    jeunes: "Jeunes",
    enfants: "Enfants",
};

const CATEGORIE_COLORS: Record<string, string> = {
    hommes: "bg-blue-100 text-blue-800",
    femmes: "bg-pink-100 text-pink-800",
    jeunes: "bg-amber-100 text-amber-800",
    enfants: "bg-green-100 text-green-800",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function RollCallPage({ loaderData }: Route.ComponentProps) {
    const navigate = useNavigate();
    const { categories } = loaderData;

    const [date, setDate] = useState(today());
    const [culteId, setCulteId] = useState(1);
    const [categorie, setCategorie] = useState("tous");
    const [search, setSearch] = useState("");
    const [data, setData] = useState<RollCallData | null>(null);
    const [loading, setLoading] = useState(false);
    const [toggling, setToggling] = useState<Set<number>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // ── Fetch members + presence status ──────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ date, culteId: String(culteId), categorie });
            const res = await fetch(`/api/rollcall?${params}`);
            if (!res.ok) throw new Error("Erreur serveur");
            const json: RollCallData = await res.json();
            setData(json);
        } catch (e) {
            setError("Impossible de charger les données.");
        } finally {
            setLoading(false);
        }
    }, [date, culteId, categorie]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Toggle presence ───────────────────────────────────────────────────────

    const togglePresence = async (member: MemberRow) => {
        const newPresent = member.present !== true; // null → true, false → true, true → false
        setToggling((prev) => new Set(prev).add(member.id));

        // Optimistic update
        setData((prev) => {
            if (!prev) return prev;
            const updated = prev.members.map((m) =>
                m.id === member.id ? { ...m, present: newPresent } : m
            );
            const totalPresent = updated.filter((m) => m.present === true).length;
            return { ...prev, members: updated, totalPresent };
        });

        try {
            const res = await fetch("/api/rollcall", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberId: member.id, culteId, date, present: newPresent }),
            });
            if (!res.ok) throw new Error("Erreur toggle");
            const json = await res.json();

            // Mettre à jour le presenceId si nouvellement créé
            setData((prev) => {
                if (!prev) return prev;
                const updated = prev.members.map((m) =>
                    m.id === member.id
                        ? { ...m, presenceId: json.presenceId ?? m.presenceId, present: json.present }
                        : m
                );
                const totalPresent = updated.filter((m) => m.present === true).length;
                return { ...prev, members: updated, totalPresent };
            });

            setLastSaved(`${member.prenom} ${member.nom} — ${newPresent ? "Présent ✓" : "Absent ✗"}`);
            setTimeout(() => setLastSaved(null), 2500);
        } catch {
            // Rollback on error
            setData((prev) => {
                if (!prev) return prev;
                const rolled = prev.members.map((m) =>
                    m.id === member.id ? { ...m, present: member.present } : m
                );
                const totalPresent = rolled.filter((m) => m.present === true).length;
                return { ...prev, members: rolled, totalPresent };
            });
            setError("Erreur lors de l'enregistrement.");
        } finally {
            setToggling((prev) => {
                const s = new Set(prev);
                s.delete(member.id);
                return s;
            });
        }
    };

    // ── Filtered list ─────────────────────────────────────────────────────────

    const filtered = (data?.members ?? []).filter((m) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            m.nom.toLowerCase().includes(q) ||
            m.prenom.toLowerCase().includes(q)
        );
    });

    const totalPresent = data?.totalPresent ?? 0;
    const total = data?.total ?? 0;
    const pct = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => {
                                if (window.history?.length > 1) {
                                    navigate(-1);
                                } else {
                                    navigate("/");
                                }
                            }}
                            className="text-[#4a2b87] hover:text-[#3a1b77] text-sm font-medium shrink-0 flex items-center gap-1 cursor-pointer"
                        >
                            ← Retour
                        </button>
                        <span className="text-gray-300 hidden sm:block">|</span>
                        <h1 className="text-[#4a2b87] font-bold text-base sm:text-lg truncate hidden sm:block">
                            Liste d'appel
                        </h1>
                    </div>

                    {/* Compteur */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                            <p className="text-xs text-gray-500 leading-none">Présents</p>
                            <p className="font-bold text-[#4a2b87] text-lg leading-tight">
                                {totalPresent}
                                <span className="text-gray-400 font-normal text-sm"> / {total}</span>
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{
                                background: `conic-gradient(#4a2b87 ${pct}%, #e5e7eb ${pct}%)`,
                            }}
                        >
                            <span className="bg-white rounded-full w-7 h-7 flex items-center justify-center text-[10px] text-[#4a2b87] font-bold">
                                {pct}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filters row */}
                <div className="max-w-4xl mx-auto px-4 pb-3 flex flex-wrap gap-2 items-center">


                    {/* Catégorie tabs */}
                    <div className="flex gap-1 flex-wrap">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                id={`rollcall-cat-${cat}`}
                                onClick={() => setCategorie(cat)}
                                disabled={loading}
                                className={`px-3 py-1 flex items-center gap-1.5 rounded-full text-xs font-semibold transition-all ${categorie === cat
                                    ? "bg-[#4a2b87] text-white shadow"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    } ${loading ? "opacity-70 cursor-wait" : ""}`}
                            >
                                {categorie === cat && loading && (
                                    <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                )}
                                {CATEGORIE_LABELS[cat]}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Toast overlay */}
            {lastSaved && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#4a2b87] text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-fadeIn">
                    {lastSaved}
                </div>
            )}

            {/* Dashboard Card (Search & Status) */}
            <div className="max-w-4xl mx-auto w-full px-4 pt-4">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-[#4a2b87]/5 p-4 sm:p-5 flex flex-col gap-4 transition-all">
                    {/* Search */}
                    <input
                        id="rollcall-search"
                        type="search"
                        placeholder="Rechercher un membre…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-white/60 hover:bg-white focus:bg-white focus:ring-2 focus:ring-[#4a2b87]/20 focus:border-[#4a2b87] outline-none shadow-sm transition-colors"
                    />

                    {/* Progress bar */}
                    <div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#4a2b87] to-[#8b5cf6] rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                            <span className="text-[#4a2b87]">{totalPresent} présent{totalPresent > 1 ? "s" : ""}</span>
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span>{total - totalPresent} non enregistré{total - totalPresent > 1 ? "s" : ""}</span>
                            {search && (
                                <>
                                    <span className="mx-1.5 text-gray-300">·</span>
                                    <span>{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2 flex justify-between items-center">
                            {error}
                            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 ml-4 font-bold">✕</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Member list */}
            <main className="max-w-4xl mx-auto w-full px-4 pt-6 pb-24 flex-1 flex flex-col gap-3">
                {/* Member list container */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-[#4a2b87]/5 p-4 sm:p-6 mb-2 flex flex-col gap-4 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center px-1 gap-3">
                        <span className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                            Liste des membres
                        </span>

                        <div className="flex items-center gap-2">
                            {/* Date */}
                            <input
                                id="rollcall-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                disabled={loading}
                                className="border border-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#4a2b87]/20 focus:border-[#4a2b87] outline-none bg-white/50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                            />

                            {/* Culte */}
                            <select
                                id="rollcall-culte"
                                value={culteId}
                                onChange={(e) => setCulteId(Number(e.target.value))}
                                disabled={loading}
                                className="border border-gray-100 rounded-lg px-2.5 py-1.5 text-sm focus:ring-2 focus:ring-[#4a2b87]/20 focus:border-[#4a2b87] outline-none bg-white/50 hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                            >
                                <option value={1}>1er culte</option>
                                <option value={2}>2ème culte</option>
                                <option value={3}>3ème culte</option>
                            </select>
                        </div>
                    </div>
                    
                    {loading && (!data || data.members.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <div className="w-8 h-8 border-3 border-[#4a2b87]/30 border-t-[#4a2b87] rounded-full animate-spin" />
                            <p className="text-gray-400 text-sm">Chargement…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-sm">
                            Aucun membre trouvé
                        </div>
                    ) : (
                        <div className={`flex flex-col gap-3 transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                            {filtered.map((member) => {
                                const isToggling = toggling.has(member.id);
                                const isPresent = member.present === true;

                                return (
                                    <button
                                        key={member.id}
                                        id={`rollcall-member-${member.id}`}
                                        onClick={() => !isToggling && togglePresence(member)}
                                        disabled={isToggling || loading}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left group shadow-sm ${isPresent
                                            ? "bg-green-50 border-green-200 hover:bg-green-100/50"
                                            : "bg-white/60 border-gray-100 hover:bg-white hover:border-purple-200"
                                            } ${isToggling ? "opacity-60 cursor-wait" : "cursor-pointer"}`}
                                    >
                                        {/* Toggle indicator */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${isPresent
                                            ? "bg-green-500 text-white"
                                            : "bg-gray-100 text-gray-300 group-hover:bg-purple-100 group-hover:text-purple-400"
                                            }`}>
                                            {isToggling ? (
                                                <span className="block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            ) : isPresent ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm truncate ${isPresent ? "text-green-800" : "text-gray-800"}`}>
                                                {member.prenom} {member.nom}
                                            </p>
                                            <p className={`text-xs ${isPresent ? "text-green-600" : "text-gray-400"}`}>
                                                {isPresent ? "Présent" : "Absent"}
                                            </p>
                                        </div>

                                        {/* Category badge */}
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${CATEGORIE_COLORS[member.categorie] || "bg-gray-100 text-gray-500"}`}>
                                            {CATEGORIE_LABELS[member.categorie] || member.categorie}
                                        </span>

                                        {/* Arrow hint */}
                                        <span className={`text-sm shrink-0 transition-opacity ${isPresent ? "opacity-0" : "opacity-30 group-hover:opacity-60"}`}>
                                            →
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Sticky footer summary */}
            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white z-20 shadow-[0_-4px_20px_-10px_rgba(74,43,135,0.1)]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                            <span className="text-gray-700 font-semibold">{totalPresent}</span>
                            <span className="text-gray-400 hidden sm:inline">présent{totalPresent > 1 ? "s" : ""}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />
                            <span className="text-gray-700 font-semibold">
                                {total - totalPresent}
                            </span>
                            <span className="text-gray-400 hidden sm:inline">absent{total - totalPresent > 1 ? "s" : ""}</span>
                        </span>
                    </div>
                    <button
                        id="rollcall-refresh"
                        onClick={fetchData}
                        disabled={loading}
                        className="text-xs flex items-center justify-center min-w-[95px] text-[#4a2b87] hover:text-[#3a1b77] font-medium border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {loading ? (
                            <span className="inline-block w-3.5 h-3.5 border-2 border-[#4a2b87]/30 border-t-[#4a2b87] rounded-full animate-spin mr-1.5" />
                        ) : (
                            <span className="mr-1.5">↻</span>
                        )}
                        {loading ? "Chargement" : "Rafraîchir"}
                    </button>
                </div>
            </footer>
        </div>
    );
}
