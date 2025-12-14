import { useState, useEffect } from "react";
import { Link, useFetcher } from "react-router";
import type { Route } from "./+types/home";
import { getAllMembers } from "~/db/database.server";
import type { Member } from "~/db/database.server";
import Header from "~/components/Header";
import SearchableSelect from "~/components/ui/SearchableSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Présence Culte - Accueil" },
    { name: "description", content: "Gestion des présences au culte" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const members = getAllMembers();
  return { members };
}

export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { members: initialMembers } = loaderData;
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [showPresence, setShowPresence] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const memberFetcher = useFetcher();
  const presenceFetcher = useFetcher();

  // Recharger les membres après ajout
  useEffect(() => {
    if (memberFetcher.data?.success) {
      // Recharger la liste des membres
      fetch("/api/members")
        .then((res) => res.json())
        .then((data) => {
          setMembers(data.members);
          setShowPresence(true);
        });
    }
    if (memberFetcher.data?.exists) {
      alert("Ce membre existe déjà. Vous êtes déjà enregistré !");
      setShowPresence(true);
    }
  }, [memberFetcher.data]);

  useEffect(() => {
    if (presenceFetcher.data?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
    if (presenceFetcher.data?.duplicate) {
      alert("Vous avez déjà enregistré votre présence pour ce culte aujourd'hui !");
    }
  }, [presenceFetcher.data]);

  return (
    <section className="flex justify-center items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="relative flex flex-col gap-9 z-10 w-full max-w-lg p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden mobile-fixed-card">
        <Header />
        <div className="mobile-scroll-content flex-1 min-h-0 overflow-y-auto flex flex-col">
          {showPresence ? (
            <PresenceForm
              members={members}
              fetcher={presenceFetcher}
              onSwitchToRegister={() => setShowPresence(false)}
            />
          ) : (
            <MemberForm
              fetcher={memberFetcher}
              onSwitchToPresence={() => setShowPresence(true)}
            />
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-lg font-medium">Présence enregistrée !</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


// Member Form Component
function MemberForm({
  fetcher,
  onSwitchToPresence,
}: {
  fetcher: ReturnType<typeof useFetcher>;
  onSwitchToPresence: () => void;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      alert("Remplis le nom.");
      return;
    }
    if (!prenom.trim()) {
      alert("Remplis le prénom.");
      return;
    }
    if (!phone.trim()) {
      alert("Remplis le numéro de téléphone.");
      return;
    }

    const formData = new FormData();
    formData.append("nom", nom.trim());
    formData.append("prenom", prenom.trim());
    formData.append("numero", phone.trim());
    formData.append("dateDeNaissance", "");

    fetcher.submit(formData, { method: "post", action: "/api/members" });
    setNom("");
    setPrenom("");
    setPhone("");
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-4">
      <div className="flex flex-col h-full justify-around">
        <div>
        <h1 className="text-center text-gray-800 text-lg sm:text-xl my-2 font-semibold">
          Enregistrement de nouveau membre
        </h1>

        <p className="text-center text-gray-500 text-sm mb-5">
          Bienvenue ! Remplissez ce formulaire pour vous inscrire.
        </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">
              Nom
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom de famille"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">
              Prénom
            </label>
            <input
              type="text"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Votre prénom"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mt-6 space-y-3">
          <button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {fetcher.state !== "idle" ? "Enregistrement..." : "Enregistrer"}
          </button>

          <button
            type="button"
            onClick={onSwitchToPresence}
            className="w-full border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm hover:shadow-md"
          >
            Déjà inscrit ? Aller à la présence
          </button>
        </div>

        <p className="mt-5 italic text-[#4a2b87] text-center text-sm bg-[#ede7f6] p-3 rounded-lg">
          "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
        </p>
      </div>
    </form>
  );
}

// Presence Form Component
function PresenceForm({
  members,
  fetcher,
  onSwitchToRegister,
}: {
  members: Member[];
  fetcher: ReturnType<typeof useFetcher>;
  onSwitchToRegister: () => void;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [selectedPhone, setSelectedPhone] = useState("");
  const [presence, setPresence] = useState<"Présent" | "Absent" | "">("");
  const [culte, setCulte] = useState("");
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [raisonAbsence, setRaisonAbsence] = useState("");

  const sortedMembers = [...members].sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`.trim();
    const nameB = `${b.nom} ${b.prenom}`.trim();
    return nameA.localeCompare(nameB, "fr", { sensitivity: "base" });
  });

  const filteredMembers = sortedMembers.filter((m) =>
    `${m.nom} ${m.prenom}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMember = members.find(
    (m) => m.id.toString() === selectedMemberId
  );

  useEffect(() => {
    if (selectedMember) {
      setSelectedPhone(selectedMember.numero || "Aucun contact enregistré");
    } else {
      setSelectedPhone("");
    }
  }, [selectedMember]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      alert("Choisis un nom.");
      return;
    }
    if (!presence) {
      alert("Choisis Présent ou Absent.");
      return;
    }
    if (!culte) {
      alert("Choisis le culte.");
      return;
    }

    // Vérifier la raison si absent
    if (presence === "Absent" && !raisonAbsence.trim()) {
      alert("Veuillez indiquer la raison de votre absence.");
      return;
    }

    const culteId = culte === "1er culte" ? 1 : culte === "2ème culte" ? 2 : 1;
    const formData = new FormData();
    formData.append("memberId", selectedMemberId);
    formData.append("culteId", culteId.toString());
    formData.append("presence", (presence === "Présent").toString());
    formData.append("date", new Date().toLocaleDateString());
    if (presence === "Absent" && raisonAbsence.trim()) {
      formData.append("pkabsence", raisonAbsence.trim());
    }

    fetcher.submit(formData, { method: "post", action: "/api/presences" });
    setSelectedMemberId("");
    setSelectedPhone("");
    setPresence("");
    setCulte("");
    setSearch("");
    setRaisonAbsence("");
  };

  const handleSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find((m) => m.id.toString() === memberId);
    if (member) {
      setSearch(`${member.nom} ${member.prenom}`);
    }
    setIsDropdownOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-4">
      
      <div className={`flex flex-col h-full ${presence !== "Absent" ? "justify-around" : ""}`}>

          <div className="">
            <h1 className="text-center text-gray-800 text-lg sm:text-xl my-2 font-semibold">
              Gestion des présences au culte
            </h1>

            <p className="text-center text-gray-500 text-sm mb-5">
              Marquez votre présence pour le culte d'aujourd'hui.
            </p>
          </div>
        <div className="space-y-4">
          <div className="">
          {/* <div className="flex gap-1 items-end"> */}

            <SearchableSelect
              label="Sélectionnez votre nom"
              value={selectedMemberId}
              options={sortedMembers.map((member) => ({
                value: member.id.toString(),
                label: `${member.nom} ${member.prenom}`,
              }))}
              onChange={(value) =>handleSelect(value)}
              placeholder="Tapez pour rechercher..."
              className="flex-1"
            />
            {/* Searchable Select */}
            
          {selectedPhone && (
              <div className="bg-[#ede7f6]  p-1.5 px-3 rounded-lg border-0 mt-1 border-[#4a2b87] animate-fadeIn ">
                <p className="flex items-center gap-2 text-[#4a2b87] text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="font-medium">{selectedPhone}</span>
                </p>
              </div>
            )}

            {/* {selectedPhone && (
              <div className="bg-[#ede7f6]  h-12  p-3 py-3.5 rounded-lg border-0 border-[#4a2b87] animate-fadeIn ">
                <p className="flex items-center gap-2 text-[#4a2b87] text-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span className="font-medium">{selectedPhone}</span>
                </p>
              </div>
            )}
            {selectedPhone && (
              <button
                type="button"
                className="ml-0 h-12 w-10 flex items-center justify-center bg-[#ede7f6] text-[#5f3bad] text-xs rounded-lg hover:bg-[#5f3bad]/30 transition-colors"
                onClick={() => setSelectedMemberId('')}
            >
                <FontAwesomeIcon icon={faX} className="w-4 h-4" />
              </button>
            )} */}
          </div>
          {/* Presence Status */}
          <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">
              Sélectionnez le Culte
            </label>
            <select
              value={culte}
              onChange={(e) => setCulte(e.target.value)}
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
            >
              <option value="">Choisissez le culte</option>
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
            <div>
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                Statut de présence
              </label>
              <div className="grid grid-cols-2 gap-1">
                <label
                  className={`flex items-center justify-center gap-2 p-3 py-3.5 sm:py-[16.5px] rounded-lg border cursor-pointer transition-all ${presence === "Présent"
                      ? "border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="presence"
                    value="Présent"
                    checked={presence === "Présent"}
                    onChange={(e) =>
                      setPresence(e.target.value as "Présent" | "Absent")
                    }
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Présent</span>
                </label>
                <label
                  className={`flex items-center justify-center gap-2 p-3 py-3.5 sm:py-[16.5px] rounded-lg border cursor-pointer transition-all ${presence === "Absent"
                      ? "border-[#c62828] bg-[#ffebee] text-[#c62828]"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                >
                  <input
                    type="radio"
                    name="presence"
                    value="Absent"
                    checked={presence === "Absent"}
                    onChange={(e) =>
                      setPresence(e.target.value as "Présent" | "Absent")
                    }
                    className="sr-only"
                  />
                  <span className="font-medium text-sm">Absent</span>
                </label>
              </div>
            </div>
            
          </div>

          {/* Raison d'absence - affiché uniquement si Absent est sélectionné */}
          {presence === "Absent" && (
            <div className="animate-fadeIn">
              <label className="block mb-1.5 text-gray-700 font-medium text-sm">
                Raison de l'absence <span className="text-[#c62828]">*</span>
              </label>
              <textarea
                value={raisonAbsence}
                onChange={(e) => setRaisonAbsence(e.target.value)}
                placeholder="Indiquez la raison de votre absence..."
                rows={3}
                className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm sm:text-base transition-all duration-200 focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20 focus:outline-none resize-none"
              />
            </div>
          )}
          {presence !== "Absent" && (
            <div className="h-20"	/>
          )}

          {/* Culte Select */}
        
        </div>
        
      {/* <div className="h-10"/> */}
      </div>


      <div>
        <div className="mt-6 space-y-3">
          <button
            type="submit"
            disabled={fetcher.state !== "idle"}
            className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md disabled:opacity-50"
          >
            {fetcher.state !== "idle"
              ? "Enregistrement..."
              : "Enregistrer ma présence"}
          </button>

          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm hover:shadow-md"
          >
            Nouveau ? S'inscrire
          </button>
        </div>

        <p className="mt-5 italic text-[#4a2b87] text-center text-sm bg-[#ede7f6] p-3 rounded-lg">
          "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
        </p>
      </div>
    </form>
  );
}
