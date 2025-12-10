import { useState, useEffect } from "react";
import { Link, useFetcher, useRevalidator } from "react-router";
import type { Route } from "./+types/dashboard";
import { getAllMembers, getAllPresences } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Member, Presence } from "~/db/database.server";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons';

// Components
import Header from "~/components/Header";
import Input from "~/components/ui/Input";
import Select from "~/components/ui/Select";
import Button from "~/components/ui/Button";
import Tabs from "~/components/ui/Tabs";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const members = getAllMembers();
  const presences = getAllPresences();
  return { members, presences };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { members, presences } = loaderData;
  const [activeTab, setActiveTab] = useState<"presences" | "members">("presences");
  const revalidator = useRevalidator();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  const tabs = [
    { id: "presences", label: "Présences" },
    { id: "members", label: "Membres" },
  ];

  return (
    <div className="h-screen bg-gray-50 flex justify-center items-center">
      <div className="max-w-7xl w-full h-[90vh] mx-auto my-auto flex justify-center items-center">
        <div className="flex flex-col relative z-10 w-full h-full p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden container">
          <Header showLogout onLogout={handleLogout} />

          <div className="flex flex-col h-full min-h-0">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as "presences" | "members")}
            />

            <div className="flex-1 min-h-0">
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
      csvContent += `${member.nom || ""},${member.prenom || ""},${member.numero || "N/A"}\n`;
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
      <div className="mb-3 flex-shrink-0">
        <Input
          type="text"
          value={searchMember}
          onChange={(e) => setSearchMember(e.target.value)}
          placeholder="Rechercher un membre..."
          className="!py-2"
        />
      </div>

      <div className="mb-2 ml-2 text-xs text-gray-700 flex-shrink-0">
        {filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""} trouvé{filteredMembers.length > 1 ? "s" : ""}
      </div>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white w-full h-full sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-lg sm:shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#4a2b87] to-[#5a3b97] text-white p-6 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Modifier le membre</h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <Input label="Nom" value={editNom} onChange={(e) => setEditNom(e.target.value)} />
              <Input label="Prénom" value={editPrenom} onChange={(e) => setEditPrenom(e.target.value)} />
              <Input label="Numéro de téléphone" value={editNumero} onChange={(e) => setEditNumero(e.target.value)} />
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <Button onClick={handleSaveEdit} className="flex-1">Enregistrer</Button>
              <Button variant="secondary" onClick={() => setEditingMember(null)} className="flex-1">Annuler</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Desktop */}
      <div className="hidden md:flex flex-col flex-1 min-h-0 table-container bg-white">
        <div className="overflow-auto flex-1">
          <table className="table">
            <thead className="sticky top-0 z-10 !bg-[#4a2b87] text-violet-50 table-header">
              <tr>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Téléphone</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body h-full">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 px-4 text-center text-gray-400">
                    {searchMember ? "Aucun membre trouvé" : "Aucun membre enregistré"}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.nom || "N/A"}</td>
                    <td>{member.prenom || "N/A"}</td>
                    <td className="font-mono text-sm">{member.numero || "N/A"}</td>
                    <td>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEditClick(member)} className="btn-icon btn-icon--primary" title="Modifier">
                          <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(member.id)} className="btn-icon btn-icon--danger" title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className={filteredMembers.length === 0 ? "hidden" : ""}>
              <tr>
                <td colSpan={4} className="sticky bottom-0 !bg-[#4a2b87] text-violet-50 border-t border-violet-700 backdrop-blur py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{filteredMembers.length} membre{filteredMembers.length > 1 ? "s" : ""}</div>
                    <div>
                      {/* <Button onClick={downloadCSV} variant="secondary" className="ml-2">Télécharger CSV</Button> */}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden flex-1 min-h-0 overflow-auto space-y-3 pr-1">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            {searchMember ? "Aucun membre trouvé" : "Aucun membre enregistré"}
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="mobile-card bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="mobile-card__title text-base font-semibold">{member.nom} {member.prenom}</h3>
                  <p className="mobile-card__subtitle !text-xs  !text-[#4a2b87]">{member.numero || "N/A"}</p>
                </div>
                <div className="mobile-card__actions h-full flex flex-row flex-1 items-center justify-between gap-2">
                  <button onClick={() => handleEditClick(member)} className="btn-icon btn-icon--primary p-2">
                    <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(member.id)} className="btn-icon btn-icon--danger p-2">
                    <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button onClick={downloadCSV} fullWidth className="mt-4 flex-shrink-0">
        Télécharger la liste des membres
      </Button>
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
  const [editPresenceStatus, setEditPresenceStatus] = useState<"Présent" | "Absent">("Présent");
  const [editCulte, setEditCulte] = useState("");

  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  useEffect(() => {
    if (deleteFetcher.data?.success || editFetcher.data?.success) {
      onDataChange();
      setEditingPresence(null);
    }
  }, [deleteFetcher.data, editFetcher.data]);

  const cultes = [
    ...new Set(entries.map((e) => e.culte).filter((c) => c && c !== "Non spécifié")),
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
  };

  const handleSaveEdit = () => {
    if (!editingPresence) return;
    const culteId = editCulte === "1er culte" ? 1 : editCulte === "2ème culte" ? 2 : 1;

    const formData = new FormData();
    formData.append("presence", (editPresenceStatus === "Présent").toString());
    formData.append("culteId", culteId.toString());

    editFetcher.submit(formData, {
      method: "put",
      action: `/api/presences/${editingPresence.id}`,
    });
  };

  const handleDeletePresence = (presenceId: number) => {
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

  const getPresenceBadge = (presence: string) => {
    if (presence === "Présent") {
      return <span className="badge badge--success">Présent</span>;
    }
    return <span className="badge badge--error">Absent</span>;
  };

  return (
    <div className="animate-fadeIn flex flex-col justify-between h-full min-h-0">
      <div className="grid grid-cols-2 gap-3 mb-3 flex-shrink-0">
        <Input
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="Rechercher un nom..."
        />
        <Select value={filterCulte} onChange={(e) => setFilterCulte(e.target.value)}>
          <option value="">Tous les cultes</option>
          {cultes.map((culte) => (
            <option key={culte} value={culte}>{culte}</option>
          ))}
        </Select>
      </div>

      <div className="mb-2 ml-2 text-sm text-gray-600 flex-shrink-0">
        {filteredEntries.length} présence{filteredEntries.length > 1 ? "s" : ""} trouvée{filteredEntries.length > 1 ? "s" : ""}
      </div>

      {/* Edit Modal */}
      {editingPresence && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white w-full h-full sm:h-auto sm:w-full sm:max-w-2xl sm:rounded-lg sm:shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#4a2b87] to-[#5a3b97] text-white p-6 flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Modifier la présence</h2>
              <button
                onClick={() => setEditingPresence(null)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600">Membre: <span className="font-semibold text-gray-800">{editingPresence.nom}</span></p>
                <p className="text-sm text-gray-600 mt-2">Date: <span className="font-semibold text-gray-800">{editingPresence.date}</span></p>
              </div>

              <div>
                <label className="form-label text-sm font-semibold text-gray-700 mb-3 block">Statut de présence</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${editPresenceStatus === "Présent" ? "border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="editPresence" value="Présent" checked={editPresenceStatus === "Présent"} onChange={() => setEditPresenceStatus("Présent")} className="sr-only" />
                    <span className="font-medium">Présent</span>
                  </label>
                  <label className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${editPresenceStatus === "Absent" ? "border-[#c62828] bg-[#ffebee] text-[#c62828]" : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" name="editPresence" value="Absent" checked={editPresenceStatus === "Absent"} onChange={() => setEditPresenceStatus("Absent")} className="sr-only" />
                    <span className="font-medium">Absent</span>
                  </label>
                </div>
              </div>

              <div>
                <Select label="Culte" value={editCulte} onChange={(e) => setEditCulte(e.target.value)}>
                  <option value="1er culte">1er culte</option>
                  <option value="2ème culte">2ème culte</option>
                </Select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <Button onClick={handleSaveEdit} className="flex-1">Enregistrer</Button>
              <Button variant="secondary" onClick={() => setEditingPresence(null)} className="flex-1">Annuler</Button>
            </div>
          </div>
        </div>
      )}

      {/* Table Desktop */}
      <div className="hidden lg:flex flex-col flex-1 min-h-0 table-container overflow-hidden">
        <div className="overflow-auto flex-1">
          <table className="table">
            <thead className="sticky top-0 z-10  table-header">
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th className="text-center">Présence</th>
                <th className="text-center">Culte</th>
                <th className="text-center">Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-gray-400">
                    {searchName || filterCulte ? "Aucune présence trouvée" : "Aucune présence enregistrée"}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.nom || "N/A"}</td>
                    <td className="font-mono text-sm">{e.telephone || "N/A"}</td>
                    <td className="text-center">{getPresenceBadge(e.presence)}</td>
                    <td className="text-center"><span className="badge badge--primary">{e.culte || "N/A"}</span></td>
                    <td className="text-center text-gray-500 text-sm">{e.date || "N/A"}</td>
                    <td>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleEditClick(e)} className="btn-icon btn-icon--primary" title="Modifier">
                          <FontAwesomeIcon icon={faPencil} className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeletePresence(e.id)} className="btn-icon btn-icon--danger" title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="sticky bottom-0 !bg-[#4a2b87] text-violet-50 border-t border-violet-700 backdrop-blur py-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{filteredEntries.length} présence{filteredEntries.length > 1 ? "s" : ""}</div>
                    <div>
                      {/* <Button onClick={downloadCSV} variant="secondary" className="ml-2">Télécharger CSV</Button> */}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden flex-1 min-h-0 overflow-auto space-y-3 pr-1">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 border border-gray-200">
            {searchName || filterCulte ? "Aucune présence trouvée" : "Aucune présence enregistrée"}
          </div>
        ) : (
          filteredEntries.map((e) => (
            <div key={e.id} className="mobile-card bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="mobile-card__title text-xs sm:text-sm">{e.nom}</h3>
                  <p className="mobile-card__subtitle text-xs sm:text-sm">{e.date} • <span>{e.telephone}</span></p>
                  <div className="flex gap-2 mt-2">
                    {getPresenceBadge(e.presence)}
                    <span className="badge badge--primary">{e.culte}</span>
                  </div>
                </div>
                <div className="mobile-card__actions h-full flex flex-col justify-between gap-2">
                  <button onClick={() => handleEditClick(e)} className="btn-icon btn-icon--primary p-2">
                    <FontAwesomeIcon icon={faPencil} className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDeletePresence(e.id)} className="btn-icon btn-icon--danger p-2">
                    <FontAwesomeIcon icon={faTrash} className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button onClick={downloadCSV} fullWidth className="mt-4 flex-shrink-0">
        Télécharger les présences
      </Button>
    </div>
  );
}
