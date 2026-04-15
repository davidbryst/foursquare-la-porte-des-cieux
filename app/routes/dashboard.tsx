import { useState, useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard";
import { getAllMembers, getAllPresences, getAllVisiteurs, getPresenceCode, getSessionExpiry } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Member, Presence, Visiteur } from "~/db/database.server";
import { useToast } from "~/context/ToastContext";
import { useModal } from "~/context/ModalContext";
import { Spinner } from "~/components/ui/Toast";
import Header from "~/components/Header";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const [members, presences, visiteurs, presenceCode, sessionExpiry] = await Promise.all([
    getAllMembers(),
    getAllPresences(),
    getAllVisiteurs(),
    getPresenceCode(),
    getSessionExpiry(),
  ]);
  return { members, presences, visiteurs, presenceCode, sessionExpiry };
}

type DashTab = "presences" | "members" | "visitors" | "reports" | "settings";

const CATEGORY_LABELS: Record<string, string> = {
  enfants: "Enfants",
  jeunes: "Jeunes",
  femmes: "Femmes",
  hommes: "Hommes",
};

function downloadBlob(data: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Presence Table ────────────────────────────────────────────────────────────
function PresenceTable({ presences }: { presences: Presence[] }) {
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const revalidator = useRevalidator();

  const filtered = presences.filter((p) => {
    const matchCat = catFilter === "all" || p.categorie === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || p.nom.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleDelete = (id: number) => {
    if (!confirm("Supprimer cette présence ?")) return;
    const fd = new FormData();
    fd.append("_method", "DELETE");
    fetcher.submit(fd, { method: "delete", action: `/api/presences/${id}` });
    showToast("Présence supprimée", "success");
    setTimeout(() => revalidator.revalidate(), 400);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} résultat(s)</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
        <table className="w-full text-sm">
          <thead className="bg-[#f3eeff] text-[#4a2b87]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nom</th>
              <th className="px-4 py-3 text-left font-semibold">Prénom</th>
              <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold">Culte</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Statut</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  Aucune présence trouvée
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-[#f0ebff] hover:bg-[#faf8ff] transition-colors">
                  <td className="px-4 py-3 font-medium">{p.nom}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#ede7f6] text-[#4a2b87]">
                      {CATEGORY_LABELS[p.categorie || "hommes"] || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{p.culte}</td>
                  <td className="px-4 py-3 text-gray-600">{p.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.presence === "Présent"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {p.presence}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Member Table ───────────────────────────────────────────────────────────────
function MemberTable({ members }: { members: Member[] }) {
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const { openMemberModal, setMemberSaveHandler } = useModal();
  const revalidator = useRevalidator();

  const filtered = members.filter((m) => {
    const matchCat = catFilter === "all" || m.categorie === catFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.nom.toLowerCase().includes(q) ||
      m.prenom.toLowerCase().includes(q) ||
      (m.numero || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Supprimer le membre "${name}" ?`)) return;
    fetcher.submit(null, { method: "delete", action: `/api/members/${id}` });
    showToast("Membre supprimé", "success");
    setTimeout(() => revalidator.revalidate(), 400);
  };

  const handleEdit = (member: Member) => {
    setMemberSaveHandler(async (payload) => {
      const fd = new FormData();
      fd.append("nom", payload.nom);
      fd.append("prenom", payload.prenom);
      fd.append("numero", payload.numero || "");
      fd.append("categorie", payload.categorie || "hommes");
      if ((payload as any).photo) fd.append("photo", (payload as any).photo);
      const res = await fetch(`/api/members/${payload.id}`, { method: "PUT", body: fd });
      const data = await res.json();
      if (data.success) {
        showToast("Membre modifié avec succès", "success");
        revalidator.revalidate();
      } else {
        showToast(data.error || "Erreur lors de la modification", "error");
      }
    });
    openMemberModal(member);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} membre(s)</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
        <table className="w-full text-sm">
          <thead className="bg-[#f3eeff] text-[#4a2b87]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Photo</th>
              <th className="px-4 py-3 text-left font-semibold">Nom</th>
              <th className="px-4 py-3 text-left font-semibold">Prénom</th>
              <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold">Téléphone</th>
              <th className="px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Aucun membre trouvé
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-t border-[#f0ebff] hover:bg-[#faf8ff] transition-colors">
                  <td className="px-4 py-3">
                    {m.photo ? (
                      <img
                        src={m.photo}
                        alt={`${m.nom} ${m.prenom}`}
                        className="w-8 h-8 rounded-full object-cover border-2 border-[#ede7f6]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#ede7f6] flex items-center justify-center text-[#4a2b87] text-xs font-bold">
                        {m.nom[0]}{m.prenom[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{m.nom}</td>
                  <td className="px-4 py-3">{m.prenom}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#ede7f6] text-[#4a2b87]">
                      {CATEGORY_LABELS[m.categorie || "hommes"] || "Hommes"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.numero || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(m)}
                        className="text-[#4a2b87] hover:text-[#5a3b97] text-xs px-2 py-1 rounded hover:bg-[#ede7f6] transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, `${m.nom} ${m.prenom}`)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Visitor Table ──────────────────────────────────────────────────────────────
function VisitorTable({ visiteurs }: { visiteurs: Visiteur[] }) {
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const fetcher = useFetcher();
  const { showToast } = useToast();
  const { openVisitorModal, setVisitorSaveHandler } = useModal();
  const revalidator = useRevalidator();

  const filtered = visiteurs.filter((v) => {
    const matchCat = catFilter === "all" || v.categorie === catFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      v.nom.toLowerCase().includes(q) ||
      v.prenom.toLowerCase().includes(q) ||
      (v.provenance || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Supprimer le visiteur "${name}" ?`)) return;
    fetcher.submit(null, { method: "delete", action: `/api/visitors/${id}` });
    showToast("Visiteur supprimé", "success");
    setTimeout(() => revalidator.revalidate(), 400);
  };

  const handleEdit = (v: Visiteur) => {
    setVisitorSaveHandler(async (payload) => {
      const fd = new FormData();
      fd.append("nom", payload.nom);
      fd.append("prenom", payload.prenom);
      fd.append("telephone", payload.telephone || "");
      fd.append("culteId", String(payload.culteId));
      fd.append("categorie", payload.categorie);
      fd.append("age", payload.age !== undefined && payload.age !== null ? String(payload.age) : "");
      fd.append("provenance", payload.provenance || "");
      const res = await fetch(`/api/visitors/${payload.id}`, { method: "PUT", body: fd });
      const data = await res.json();
      if (data.success) {
        showToast("Visiteur modifié avec succès", "success");
        revalidator.revalidate();
      } else {
        showToast(data.error || "Erreur lors de la modification", "error");
      }
    });
    openVisitorModal(v);
  };

  const handleDownloadCSV = () => {
    const headers = ["Nom", "Prénom", "Téléphone", "Catégorie", "Âge", "Culte", "Date", "Provenance"];
    const rows = visiteurs.map((v) => [
      v.nom, v.prenom, v.telephone || "", CATEGORY_LABELS[v.categorie] || v.categorie,
      v.age ?? "", v.culte, v.date, v.provenance || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visiteurs_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="border border-[#c7b8ea] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
        >
          <option value="all">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          onClick={handleDownloadCSV}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
        >
          Télécharger CSV
        </button>
        <span className="text-sm text-gray-500">{filtered.length} visiteur(s)</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
        <table className="w-full text-sm">
          <thead className="bg-[#f3eeff] text-[#4a2b87]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nom</th>
              <th className="px-4 py-3 text-left font-semibold">Prénom</th>
              <th className="px-4 py-3 text-left font-semibold">Téléphone</th>
              <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold">Âge</th>
              <th className="px-4 py-3 text-left font-semibold">Culte</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Provenance</th>
              <th className="px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">
                  Aucun visiteur trouvé
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-t border-[#f0ebff] hover:bg-[#faf8ff] transition-colors">
                  <td className="px-4 py-3 font-medium">{v.nom}</td>
                  <td className="px-4 py-3">{v.prenom}</td>
                  <td className="px-4 py-3 text-gray-600">{v.telephone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#ede7f6] text-[#4a2b87]">
                      {CATEGORY_LABELS[v.categorie] || v.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.age ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{v.culte}</td>
                  <td className="px-4 py-3 text-gray-600">{v.date}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{v.provenance || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(v)}
                        className="text-[#4a2b87] hover:text-[#5a3b97] text-xs px-2 py-1 rounded hover:bg-[#ede7f6] transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, `${v.nom} ${v.prenom}`)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reports Tab ────────────────────────────────────────────────────────────────
function ReportsTab({ presences, visiteurs }: { presences: Presence[]; visiteurs: Visiteur[] }) {
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const totalPresents = presences.filter((p) => p.presence === "Présent").length;
  const totalAbsents = presences.filter((p) => p.presence !== "Présent").length;
  const totalVisiteurs = visiteurs.length;

  const byCategory = ["enfants", "jeunes", "femmes", "hommes"].map((cat) => {
    const catPresences = presences.filter((p) => p.categorie === cat);
    return {
      cat,
      label: CATEGORY_LABELS[cat],
      presents: catPresences.filter((p) => p.presence === "Présent").length,
      absents: catPresences.filter((p) => p.presence !== "Présent").length,
      total: catPresences.length,
    };
  });

  const byCulte = Array.from(new Set(presences.map((p) => p.culte))).map((culte) => {
    const cp = presences.filter((p) => p.culte === culte);
    return {
      culte,
      presents: cp.filter((p) => p.presence === "Présent").length,
      absents: cp.filter((p) => p.presence !== "Présent").length,
      total: cp.length,
    };
  });

  const byDate = Array.from(new Set(presences.map((p) => p.date)))
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 10)
    .map((date) => {
      const dp = presences.filter((p) => p.date === date);
      return {
        date,
        presents: dp.filter((p) => p.presence === "Présent").length,
        absents: dp.filter((p) => p.presence !== "Présent").length,
        total: dp.length,
      };
    });

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/report");
      if (!res.ok) throw new Error("Erreur lors de l'export");
      const buffer = await res.arrayBuffer();
      downloadBlob(
        buffer,
        `rapport_presences_${new Date().toLocaleDateString("fr-FR").replace(/\//g, "-")}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      showToast("Rapport Excel téléchargé", "success");
    } catch {
      showToast("Erreur lors de l'export Excel", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4a2b87] text-white text-sm font-medium rounded-xl hover:bg-[#5a3b97] transition-colors disabled:opacity-60"
        >
          {isExporting ? <Spinner className="border-white/30 border-t-white" /> : null}
          Exporter Excel (.xlsx)
        </button>
      </div>

      {/* Global Stats */}
      <div>
        <h3 className="text-base font-semibold text-[#4a2b87] mb-3">Résumé global</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total présences", value: totalPresents, color: "bg-green-50 text-green-700 border-green-200" },
            { label: "Total absences", value: totalAbsents, color: "bg-red-50 text-red-600 border-red-200" },
            { label: "Total visiteurs", value: totalVisiteurs, color: "bg-blue-50 text-blue-700 border-blue-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Category */}
      <div>
        <h3 className="text-base font-semibold text-[#4a2b87] mb-3">Par catégorie</h3>
        <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
          <table className="w-full text-sm">
            <thead className="bg-[#f3eeff] text-[#4a2b87]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                <th className="px-4 py-3 text-center font-semibold">Présents</th>
                <th className="px-4 py-3 text-center font-semibold">Absents</th>
                <th className="px-4 py-3 text-center font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {byCategory.map((row) => (
                <tr key={row.cat} className="border-t border-[#f0ebff]">
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3 text-center text-green-700">{row.presents}</td>
                  <td className="px-4 py-3 text-center text-red-500">{row.absents}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Culte */}
      <div>
        <h3 className="text-base font-semibold text-[#4a2b87] mb-3">Par culte</h3>
        <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
          <table className="w-full text-sm">
            <thead className="bg-[#f3eeff] text-[#4a2b87]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Culte</th>
                <th className="px-4 py-3 text-center font-semibold">Présents</th>
                <th className="px-4 py-3 text-center font-semibold">Absents</th>
                <th className="px-4 py-3 text-center font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {byCulte.map((row) => (
                <tr key={row.culte} className="border-t border-[#f0ebff]">
                  <td className="px-4 py-3 font-medium">{row.culte}</td>
                  <td className="px-4 py-3 text-center text-green-700">{row.presents}</td>
                  <td className="px-4 py-3 text-center text-red-500">{row.absents}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Date */}
      <div>
        <h3 className="text-base font-semibold text-[#4a2b87] mb-3">Par date (10 dernières)</h3>
        <div className="overflow-x-auto rounded-xl border border-[#ede7f6]">
          <table className="w-full text-sm">
            <thead className="bg-[#f3eeff] text-[#4a2b87]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-center font-semibold">Présents</th>
                <th className="px-4 py-3 text-center font-semibold">Absents</th>
                <th className="px-4 py-3 text-center font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {byDate.map((row) => (
                <tr key={row.date} className="border-t border-[#f0ebff]">
                  <td className="px-4 py-3 font-medium">{row.date}</td>
                  <td className="px-4 py-3 text-center text-green-700">{row.presents}</td>
                  <td className="px-4 py-3 text-center text-red-500">{row.absents}</td>
                  <td className="px-4 py-3 text-center font-semibold">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Settings Tab ───────────────────────────────────────────────────────────────
function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expirée";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function SettingsTab({
  presenceCode,
  sessionExpiry,
}: {
  presenceCode: string;
  sessionExpiry: number | null;
}) {
  const [duration, setDuration] = useState("2");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [remaining, setRemaining] = useState<number>(
    sessionExpiry ? Math.max(0, sessionExpiry - Date.now()) : 0
  );
  const [currentCode, setCurrentCode] = useState(presenceCode);
  const [currentExpiry, setCurrentExpiry] = useState(sessionExpiry);
  const { showToast } = useToast();
  const revalidator = useRevalidator();

  const isActive = currentExpiry ? Date.now() < currentExpiry : false;

  // Décompte chaque seconde
  useEffect(() => {
    const interval = setInterval(() => {
      const left = currentExpiry ? Math.max(0, currentExpiry - Date.now()) : 0;
      setRemaining(left);
    }, 1_000);
    return () => clearInterval(interval);
  }, [currentExpiry]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const fd = new FormData();
      fd.append("intent", "start");
      fd.append("durationHours", duration);
      const res = await fetch("/api/config", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setCurrentCode(data.code);
        setCurrentExpiry(Date.now() + parseFloat(duration) * 3_600_000);
        showToast(`Séance démarrée ! Code : ${data.code}`, "success");
        revalidator.revalidate();
      } else {
        showToast(data.error || "Erreur lors du démarrage", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    if (!confirm("Arrêter la séance en cours ?")) return;
    setIsStopping(true);
    try {
      const fd = new FormData();
      fd.append("intent", "stop");
      const res = await fetch("/api/config", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setCurrentExpiry(null);
        setRemaining(0);
        showToast("Séance arrêtée", "success");
        revalidator.revalidate();
      } else {
        showToast("Erreur lors de l'arrêt", "error");
      }
    } catch {
      showToast("Erreur réseau", "error");
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">

      {/* Statut séance actuelle */}
      <div className={`rounded-2xl border p-5 ${isActive ? "bg-green-50 border-green-200" : "bg-[#f3eeff] border-[#ede7f6]"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-[#4a2b87]">Séance en cours</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Code actif :</span>
              <span className="font-mono font-bold text-xl tracking-widest text-[#4a2b87]">
                {currentCode}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Temps restant :</span>
              <span className={`font-mono font-semibold text-lg ${remaining < 5 * 60_000 ? "text-red-500" : remaining < 15 * 60_000 ? "text-yellow-600" : "text-green-700"}`}>
                {formatCountdown(remaining)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <a
                href="/display"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 bg-[#4a2b87] text-white text-sm font-medium rounded-xl hover:bg-[#5a3b97] transition-colors"
              >
                Afficher sur vidéoprojecteur →
              </a>
              <button
                onClick={handleStop}
                disabled={isStopping}
                className="px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60 border border-red-200"
              >
                {isStopping ? <Spinner className="border-red-200 border-t-red-600" /> : "Arrêter"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Aucune séance active. Démarrez une séance pour générer un code.
          </p>
        )}
      </div>

      {/* Démarrer une nouvelle séance */}
      <div className="rounded-2xl border border-[#ede7f6] p-5 space-y-4">
        <h3 className="text-base font-semibold text-[#4a2b87]">
          {isActive ? "Nouvelle séance (remplace l'actuelle)" : "Démarrer une séance"}
        </h3>
        <p className="text-sm text-gray-500">
          Un code à 6 chiffres sera généré automatiquement et affiché sur le vidéoprojecteur.
          Seules les personnes présentes en salle pourront le voir.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1.5">Durée de la séance</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-[#c7b8ea] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4a2b87]/30"
            >
              <option value="1">1 heure</option>
              <option value="2">2 heures</option>
              <option value="3">3 heures</option>
              <option value="4">4 heures</option>
            </select>
          </div>
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4a2b87] text-white text-sm font-medium rounded-xl hover:bg-[#5a3b97] transition-colors disabled:opacity-60"
          >
            {isStarting ? <Spinner className="border-white/30 border-t-white" /> : null}
            {isStarting ? "Démarrage..." : "Démarrer"}
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { members, presences, visiteurs, presenceCode, sessionExpiry } = loaderData;
  const [activeTab, setActiveTab] = useState<DashTab>("presences");

  const tabs: { id: DashTab; label: string; count?: number }[] = [
    { id: "presences", label: "Présences", count: presences.length },
    { id: "members", label: "Membres", count: members.length },
    { id: "visitors", label: "Visiteurs", count: visiteurs.length },
    { id: "reports", label: "Rapports" },
    { id: "settings", label: "Paramètres" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f5ff]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-[#ede7f6]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#4a2b87] text-white shadow"
                  : "text-[#4a2b87] hover:bg-[#f3eeff]"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-[#ede7f6] text-[#4a2b87]"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#ede7f6] p-6">
          {activeTab === "presences" && <PresenceTable presences={presences} />}
          {activeTab === "members" && <MemberTable members={members} />}
          {activeTab === "visitors" && <VisitorTable visiteurs={visiteurs} />}
          {activeTab === "reports" && <ReportsTab presences={presences} visiteurs={visiteurs} />}
          {activeTab === "settings" && <SettingsTab presenceCode={presenceCode} sessionExpiry={sessionExpiry} />}
        </div>
      </main>
    </div>
  );
}
