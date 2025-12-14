import { useState, useEffect } from "react";
import { Link, useFetcher, useLoaderData, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard";
import { getAllMembers, getAllPresences } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Member, Presence } from "~/db/database.server";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Dashboard - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const members = await getAllMembers();
  const presences = await getAllPresences();

  return { members, presences };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { members, presences } = loaderData;
  const [activeTab, setActiveTab] = useState<"presences" | "members">("presences");
  const revalidator = useRevalidator();

  return (
    <div className="min-h-screen p-2 sm:p-4 flex items-center justify-center">
      <div className="max-w-7xl w-full mx-auto h-full sm:h-auto">
        <div className="relative z-10 w-full h-[85vh] p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden flex flex-col mobile-fixed-card">
          {/* Header */}
          <header className="relative mb-4 flex items-start justify-between flex-shrink-0">
            <div className="w-24">
              <Link
                to="/"
                className="inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-[#4a2b87] text-white no-underline rounded-lg transition-all hover:bg-[#3a2070] shadow-sm items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden sm:inline">Accueil</span>
              </Link>
            </div>

            <img
              className="w-14 sm:w-16 md:w-20"
              src="https://image2url.com/images/1764243038241-9886220a-7dd9-4dc5-a8e7-8ded2d536163.png"
              alt="Logo"
            />

            <div className="w-24 flex justify-end">
              <Link
                to="/api/auth/logout"
                className="inline-flex px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-[#d32f2f] text-white rounded-lg transition-all hover:bg-[#b71c1c] shadow-sm items-center gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Déconnexion</span>
              </Link>
            </div>
          </header>

          {/* Tabs */}
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex border-b border-gray-200 overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab("presences")}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "presences"
                    ? "text-[#4a2b87] border-b-2 border-[#4a2b87]"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Présences
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "members"
                    ? "text-[#4a2b87] border-b-2 border-[#4a2b87]"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Membres
              </button>
            </div>

            <div className="flex-1 min-h-0 pt-4 overflow-auto mobile-scroll-content">
              {activeTab === "presences" ? (
                <PresenceTable
                  entries={presences}
                  onDataChange={() => revalidator.revalidate()}
                />
              ) : (
                <MemberTable
                  members={members}
                  onDataChange={() => revalidator.revalidate()}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Member Table Component
function MemberTable({
  members,
  onDataChange,
}: {
  members: Member[];
  onDataChange: () => void;
}) {
  const [searchMember, setSearchMember] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editNumero, setEditNumero] = useState("");

  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  useEffect(() => {
    if (deleteFetcher.data?.success || editFetcher.data?.success) {
      onDataChange();
      setEditingMember(null);
    }
  }, [deleteFetcher.data, editFetcher.data]);

  const filteredMembers = members
    .filter((member) => {
      const nomComplet = `${member.nom || ""} ${member.prenom || ""}`
        .trim()
        .toLowerCase();
      return nomComplet.includes(searchMember.toLowerCase());
    })
    .sort((a, b) => {
      const nomA = `${a.nom || ""} ${a.prenom || ""}`.trim();
      const nomB = `${b.nom || ""} ${b.prenom || ""}`.trim();
      return nomA.localeCompare(nomB, "fr", { sensitivity: "base" });
    });

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setEditNom(member.nom || "");
    setEditPrenom(member.prenom || "");
    setEditNumero(member.numero || "");
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;
    if (!editNom.trim() || !editPrenom.trim()) {
      alert("Le nom et le prénom sont obligatoires.");
      return;
    }

    const formData = new FormData();
    formData.append("nom", editNom.trim());
    formData.append("prenom", editPrenom.trim());
    formData.append("numero", editNumero.trim());
    formData.append("dateDeNaissance", "");

    editFetcher.submit(formData, {
      method: "put",
      action: `/api/members/${editingMember.id}`,
    });
  };

  const handleDelete = (memberId: number) => {
    if (confirm("Voulez-vous vraiment supprimer ce membre ?")) {
      deleteFetcher.submit(null, {
        method: "delete",
        action: `/api/members/${memberId}`,
      });
    }
  };

  const downloadCSV = () => {
    if (members.length === 0) {
      alert("Aucun membre à télécharger !");
      return;
    }

    let csvContent = "Nom,Prénom,Numéro de téléphone\n";
    filteredMembers.forEach((member) => {
      csvContent += `${member.nom || ""},${member.prenom || ""},${member.numero || "Aucune donnée "
        }\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "membres.csv";
    a.click();
  };

  return (
    <div className="animate-fadeIn flex flex-col h-full min-h-0">
      {/* Search */}
      <div className="mb-3 flex-shrink-0">
        <input
          type="text"
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
          placeholder="Rechercher un membre..."
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
        />
      </div>

      {/* Counter */}
      <div className="mb-2 ml-2 text-sm text-gray-600 flex-shrink-0">
        {filteredMembers.length} membre
        {filteredMembers.length > 1 ? "s" : ""} trouvé
        {filteredMembers.length > 1 ? "s" : ""}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Modifier le membre
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                  Nom
                </label>
                <input
                  type="text"
                  value={editNom}
                  onChange={(e) => setEditNom(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                  Prénom
                </label>
                <input
                  type="text"
                  value={editPrenom}
                  onChange={(e) => setEditPrenom(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                  Numéro de téléphone
                </label>
                <input
                  type="text"
                  value={editNumero}
                  onChange={(e) => setEditNumero(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleSaveEdit}
                className="flex-1 border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#4a2b87]">
                <th className="py-3 px-4 text-left text-white font-medium text-sm">
                  Nom
                </th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">
                  Prénom
                </th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">
                  Téléphone
                </th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white diAucune donnée -y diAucune donnée -gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-12 px-4 text-center text-gray-400"
                  >
                    {searchMember
                      ? "Aucun membre trouvé"
                      : "Aucun membre enregistré"}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                  >
                    <td className="py-3 px-4 text-gray-800">
                      {member.nom || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {member.prenom || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                      {member.numero || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(member)}
                          className="p-2 rounded-lg text-[#4a2b87] bg-[#4a2b87]/10 hover:bg-[#4a2b87]/20 transition-colors"
                          title="Modifier"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 rounded-lg text-[#d32f2f] bg-[#d32f2f]/10 hover:bg-[#d32f2f]/20 transition-colors"
                          title="Supprimer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.5 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1H17a1 1 0 1 1 0 2h-1.084l-.765 10.372A2 2 0 0 1 13.158 18H6.842a2 2 0 0 1-1.993-1.628L4.084 6H3a1 1 0 1 1 0-2h4.5V3Z"
                              clipRule="evenodd"
                            />
                          </svg>
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

      {/* Mobile Cards */}
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-3 p-1 bg-gray-50 border border-gray-200 rounded-lg">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            {searchMember
              ? "Aucun membre trouvé"
              : "Aucun membre enregistré"}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {member.nom} {member.prenom}
                  </h3>
                  <p className="text-gray-500 font-mono text-sm mt-1">
                    {member.numero || "Aucune donnée "}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditClick(member)}
                    className="p-2 rounded-lg text-[#4a2b87] bg-[#4a2b87]/10 hover:bg-[#4a2b87]/20 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-2 rounded-lg text-[#d32f2f] bg-[#d32f2f]/10 hover:bg-[#d32f2f]/20 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.5 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1H17a1 1 0 1 1 0 2h-1.084l-.765 10.372A2 2 0 0 1 13.158 18H6.842a2 2 0 0 1-1.993-1.628L4.084 6H3a1 1 0 1 1 0-2h4.5V3Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={downloadCSV}
        className="w-full mt-4 flex-shrink-0 border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md"
      >
        Télécharger la liste des membres
      </button>
    </div>
  );
}

// Presence Table Component
function PresenceTable({
  entries,
  onDataChange,
}: {
  entries: Presence[];
  onDataChange: () => void;
}) {
  const [searchName, setSearchName] = useState("");
  const [filterCulte, setFilterCulte] = useState("");
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);
  const [editPresenceStatus, setEditPresenceStatus] = useState<
    "Présent" | "Absent"
  >("Présent");
  const [editCulte, setEditCulte] = useState("");
  const [editRaisonAbsence, setEditRaisonAbsence] = useState("");

  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  useEffect(() => {
    if (deleteFetcher.data?.success || editFetcher.data?.success) {
      onDataChange();
      setEditingPresence(null);
    }
  }, [deleteFetcher.data, editFetcher.data]);

  const cultes = [
    ...new Set(
      entries.map((e) => e.culte).filter((c) => c && c !== "Non spécifié")
    ),
  ].sort((a, b) => {
    if (a.includes("1er")) return -1;
    if (b.includes("1er")) return 1;
    if (a.includes("2ème")) return -1;
    if (b.includes("2ème")) return 1;
    return a.localeCompare(b, "fr");
  });

  const filteredEntries = entries.filter((e) => {
    if (!e || !e.nom) return false;
    const nomMatch = e.nom.toLowerCase().includes(searchName.toLowerCase());
    const culteMatch = filterCulte === "" || e.culte === filterCulte;
    return nomMatch && culteMatch;
  });

  const handleEditClick = (presence: Presence) => {
    setEditingPresence(presence);
    setEditPresenceStatus(presence.presence === "Présent" ? "Présent" : "Absent");
    setEditCulte(presence.culte || "1er culte");
    setEditRaisonAbsence(presence.pkabsence || "");
  };

  const handleSaveEdit = () => {
    if (!editingPresence) return;

    // Vérifier la raison si absent
    if (editPresenceStatus === "Absent" && !editRaisonAbsence.trim()) {
      alert("Veuillez indiquer la raison de l'absence.");
      return;
    }

    const culteId =
      editCulte === "1er culte" ? 1 : editCulte === "2ème culte" ? 2 : 1;

    const formData = new FormData();
    formData.append("presence", (editPresenceStatus === "Présent").toString());
    formData.append("culteId", culteId.toString());
    if (editPresenceStatus === "Absent" && editRaisonAbsence.trim()) {
      formData.append("pkabsence", editRaisonAbsence.trim());
    }

    editFetcher.submit(formData, {
      method: "put",
      action: `/api/presences/${editingPresence.id}`,
    });
  };

  const handleDelete = (presenceId: number) => {
    if (confirm("Voulez-vous vraiment supprimer cette présence ?")) {
      deleteFetcher.submit(null, {
        method: "delete",
        action: `/api/presences/${presenceId}`,
      });
    }
  };

  const downloadCSV = () => {
    if (entries.length === 0) {
      alert("Aucune donnée à télécharger !");
      return;
    }

    let csvContent = "Nom,Numéro,Présence,Culte,Date\n";
    filteredEntries.forEach((e) => {
      csvContent += `${e.nom},${e.telephone},${e.presence},${e.culte},${e.date}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presence.csv";
    a.click();
  };

  const getPresenceBadge = (presence: string, pkabsence?: string | null) => {
    if (presence === "Présent") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#e8f5e9] text-[#2e7d32]">
          Présent
        </span>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#ffebee] text-[#c62828]">
          Absent
        </span>
        {pkabsence && (
          <span className="text-xs text-gray-500 italic max-w-[150px] truncate" title={pkabsence}>
            {pkabsence}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fadeIn flex flex-col h-full min-h-0">
      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-3 flex-shrink-0">
        <input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Rechercher un nom..."
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
        />
        <select
          value={filterCulte}
          onChange={(e) => setFilterCulte(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
        >
          <option value="">Tous les cultes</option>
          {cultes.map((culte) => (
            <option key={culte} value={culte}>
              {culte}
            </option>
          ))}
        </select>
      </div>

      {/* Counter */}
      <div className="mb-2 ml-2 text-sm text-gray-600 flex-shrink-0">
        {filteredEntries.length} présence
        {filteredEntries.length > 1 ? "s" : ""} trouvée
        {filteredEntries.length > 1 ? "s" : ""}
      </div>

      {/* Edit Modal */}
      {editingPresence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Modifier la présence
            </h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Membre:{" "}
                <span className="font-medium text-gray-800">
                  {editingPresence.nom}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Date:{" "}
                <span className="font-medium text-gray-800">
                  {editingPresence.date}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                Statut de présence
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editPresenceStatus === "Présent"
                      ? "border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="editPresence"
                    value="Présent"
                    checked={editPresenceStatus === "Présent"}
                    onChange={() => setEditPresenceStatus("Présent")}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Présent</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${editPresenceStatus === "Absent"
                      ? "border-[#c62828] bg-[#ffebee] text-[#c62828]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="editPresence"
                    value="Absent"
                    checked={editPresenceStatus === "Absent"}
                    onChange={() => setEditPresenceStatus("Absent")}
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Absent</span>
                </label>
              </div>
            </div>

            {/* Raison d'absence - affiché uniquement si Absent est sélectionné */}
            {editPresenceStatus === "Absent" && (
              <div className="mb-4 animate-fadeIn">
                <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                  Raison de l'absence <span className="text-[#c62828]">*</span>
                </label>
                <textarea
                  value={editRaisonAbsence}
                  onChange={(e) => setEditRaisonAbsence(e.target.value)}
                  placeholder="Indiquez la raison de l'absence..."
                  rows={3}
                  className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20 focus:outline-none resize-none"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                Culte
              </label>
              <select
                value={editCulte}
                onChange={(e) => setEditCulte(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
              >
                <option value="1er culte">1er culte</option>
                <option value="2ème culte">2ème culte</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex-1 border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm"
              >
                Enregistrer
              </button>
              <button
                onClick={() => setEditingPresence(null)}
                className="flex-1 border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#4a2b87]">
                <th className="py-3 px-4 text-left text-white font-medium text-sm">
                  Nom
                </th>
                <th className="py-3 px-4 text-left text-white font-medium text-sm">
                  Téléphone
                </th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">
                  Présence
                </th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">
                  Culte
                </th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">
                  Date
                </th>
                <th className="py-3 px-4 text-center text-white font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white diAucune donnée -y diAucune donnée -gray-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-4 text-center text-gray-400"
                  >
                    {searchName || filterCulte
                      ? "Aucune présence trouvée"
                      : "Aucune présence enregistrée"}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, index) => (
                  <tr
                    key={e.id}
                    className={`hover:bg-gray-50 transition-colors ${index % 2 === 1 ? "bg-gray-50/50" : ""
                      }`}
                  >
                    <td className="py-3 px-4 text-gray-800">
                      {e.nom || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-sm">
                      {e.telephone || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getPresenceBadge(e.presence, e.pkabsence)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#ede7f6] text-[#4a2b87]">
                        {e.culte || "Aucune donnée "}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 text-sm">
                      {e.date || "Aucune donnée "}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEditClick(e)}
                          className="p-2 rounded-lg text-[#4a2b87] bg-[#4a2b87]/10 hover:bg-[#4a2b87]/20 transition-colors"
                          title="Modifier"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-2 rounded-lg text-[#d32f2f] bg-[#d32f2f]/10 hover:bg-[#d32f2f]/20 transition-colors"
                          title="Supprimer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.5 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1H17a1 1 0 1 1 0 2h-1.084l-.765 10.372A2 2 0 0 1 13.158 18H6.842a2 2 0 0 1-1.993-1.628L4.084 6H3a1 1 0 1 1 0-2h4.5V3Z"
                              clipRule="evenodd"
                            />
                          </svg>
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

      {/* Mobile Cards */}
      <div className="lg:hidden flex-1 min-h-0 overflow-auto space-y-3 p-1 bg-gray-50 border border-gray-200 rounded-lg">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            {searchName || filterCulte
              ? "Aucune présence trouvée"
              : "Aucune présence enregistrée"}
          </div>
        ) : (
          filteredEntries.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{e.nom}</h3>
                  <p className="text-gray-500 font-mono text-sm">
                    {e.telephone || "Aucune donnée "}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleEditClick(e)}
                      className="p-2 rounded-lg text-[#4a2b87] bg-[#4a2b87]/10 hover:bg-[#4a2b87]/20 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-2 rounded-lg text-[#d32f2f] bg-[#d32f2f]/10 hover:bg-[#d32f2f]/20 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.5 3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1H17a1 1 0 1 1 0 2h-1.084l-.765 10.372A2 2 0 0 1 13.158 18H6.842a2 2 0 0 1-1.993-1.628L4.084 6H3a1 1 0 1 1 0-2h4.5V3Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              {e.presence === "Absent" && e.pkabsence && (
                <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                  <span className="text-gray-400 text-xs">{e.pkabsence}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-gray-100">
                <span className="px-2 py-0.5 rounded bg-[#ede7f6] text-[#4a2b87] font-medium text-xs">
                  {e.culte}
                </span>
                
                {getPresenceBadge(e.presence,null)}
                <span className="text-gray-400 text-xs">{e.date}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={downloadCSV}
        className="w-full mt-4 flex-shrink-0 border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md"
      >
        Télécharger la liste des présences
      </button>
    </div>
  );
}


