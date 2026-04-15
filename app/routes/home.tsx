import { useState, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/home";
import { getAllMembers } from "~/db/database.server";
import type { Member } from "~/db/database.server";
import Header from "~/components/Header";
import { useToast } from "~/context/ToastContext";
import { Spinner } from "~/components/ui/Toast";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Présence Culte - Accueil" },
    { name: "description", content: "Gestion des présences au culte" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const members = await getAllMembers();
  return { members };
}

const CATEGORIES = [
  { value: "enfants", label: "Enfants" },
  { value: "jeunes", label: "Jeunes" },
  { value: "femmes", label: "Femmes" },
  { value: "hommes", label: "Hommes" },
];

type HomeTab = "inscription" | "presence" | "visiteur";

// ─── Composant principal ────────────────────────────────────────────────────
export default function HomePage({ loaderData }: Route.ComponentProps) {
  const { members: initialMembers } = loaderData;

  // Verrou d'accès (réinitialisé à chaque chargement de page — aucun stockage)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<HomeTab>("inscription");
  const [members, setMembers] = useState<Member[]>(initialMembers);

  const unlockFetcher = useFetcher();
  const memberFetcher = useFetcher();
  const presenceFetcher = useFetcher();
  const visiteurFetcher = useFetcher();
  const { showToast } = useToast();

  // Résultat déverrouillage
  useEffect(() => {
    if (unlockFetcher.data?.success) setIsUnlocked(true);
    if (unlockFetcher.data?.error) showToast(unlockFetcher.data.error, "error");
  }, [unlockFetcher.data]);

  // Résultat ajout membre
  useEffect(() => {
    if (memberFetcher.data?.success) {
      showToast("Membre enregistré avec succès !", "success");
      fetch("/api/members")
        .then((r) => r.json())
        .then((d) => { setMembers(d.members); setActiveTab("presence"); });
    }
    if (memberFetcher.data?.exists) {
      showToast("Ce membre existe déjà. Vous êtes déjà enregistré !", "warning");
      setActiveTab("presence");
    }
    if (memberFetcher.data?.error && !memberFetcher.data?.exists) {
      showToast(memberFetcher.data.error, "error");
    }
  }, [memberFetcher.data]);

  // Résultat ajout présence
  useEffect(() => {
    if (presenceFetcher.data?.success) showToast("Présence enregistrée avec succès !", "success");
    if (presenceFetcher.data?.duplicate) showToast("Vous avez déjà enregistré votre présence pour ce culte aujourd'hui !", "warning");
    if (presenceFetcher.data?.error && !presenceFetcher.data?.duplicate) showToast(presenceFetcher.data.error, "error");
  }, [presenceFetcher.data]);

  // Résultat ajout visiteur
  useEffect(() => {
    if (visiteurFetcher.data?.success) showToast("Visite enregistrée avec succès !", "success");
    if (visiteurFetcher.data?.error) showToast(visiteurFetcher.data.error, "error");
  }, [visiteurFetcher.data]);

  // ── Écran de verrou ──────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <section className="flex justify-center items-center min-h-screen py-4 px-3">
        <div className="relative flex flex-col gap-6 z-10 w-full max-w-sm p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-xl mx-auto mobile-fixed-card-2">
          <Header />
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="w-14 h-14 rounded-full bg-[#ede7f6] flex items-center justify-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#4a2b87]">
                <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800 text-center">Accès sécurisé</h1>
            <p className="text-gray-500 text-sm text-center">Saisissez le code d'accès pour continuer.</p>
          </div>
          <UnlockForm fetcher={unlockFetcher} />
          <p className="italic text-[#4a2b87] text-center text-xs bg-[#ede7f6] p-3 rounded-lg">
            "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
          </p>
        </div>
      </section>
    );
  }

  // ── Application principale ───────────────────────────────────────────────
  return (
    <section className="flex justify-center items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4">
      <div className="relative flex flex-col gap-4 z-10 w-full max-w-lg p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden mobile-fixed-card">
        <Header />

        {/* Onglets */}
        <div className="flex border-b border-gray-200 gap-0 flex-shrink-0">
          {(["inscription", "presence", "visiteur"] as HomeTab[]).map((tab) => {
            const labels: Record<HomeTab, string> = { inscription: "Inscription", presence: "Présence", visiteur: "Visiteur" };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab ? "text-[#4a2b87] border-b-2 border-[#4a2b87]" : "text-gray-500 hover:text-gray-700"
                }`}>
                {labels[tab]}
              </button>
            );
          })}
        </div>

        <div className="mobile-scroll-content flex-1 min-h-0 overflow-y-auto flex flex-col">
          {activeTab === "inscription" && (
            <MemberForm fetcher={memberFetcher} onSwitchToPresence={() => setActiveTab("presence")} />
          )}
          {activeTab === "presence" && (
            <PresenceForm members={members} fetcher={presenceFetcher} onSwitchToRegister={() => setActiveTab("inscription")} />
          )}
          {activeTab === "visiteur" && (
            <VisiteurForm fetcher={visiteurFetcher} />
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Formulaire déverrouillage ───────────────────────────────────────────────
function UnlockForm({ fetcher }: { fetcher: ReturnType<typeof useFetcher> }) {
  const [code, setCode] = useState("");
  const isSubmitting = fetcher.state !== "idle";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const fd = new FormData();
    fd.append("code", code.trim());
    fetcher.submit(fd, { method: "post", action: "/api/presence-unlock" });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block mb-1.5 text-gray-700 font-medium text-sm">Code d'accès</label>
        <input type="password" value={code} onChange={(e) => setCode(e.target.value)}
          placeholder="Entrez le code..." autoFocus
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
      </div>
      <button type="submit" disabled={isSubmitting}
        className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
        {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Vérification...</span></> : "Accéder"}
      </button>
    </form>
  );
}

// ─── Formulaire inscription membre ──────────────────────────────────────────
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
  const [categorie, setCategorie] = useState("hommes");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const isSubmitting = fetcher.state !== "idle";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("La photo ne doit pas dépasser 5 Mo.", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhoto(dataUrl); setPhotoPreview(dataUrl);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { showToast("Veuillez remplir le nom.", "error"); return; }
    if (!prenom.trim()) { showToast("Veuillez remplir le prénom.", "error"); return; }
    if (!phone.trim()) { showToast("Veuillez remplir le numéro de téléphone.", "error"); return; }
    const formData = new FormData();
    formData.append("nom", nom.trim()); formData.append("prenom", prenom.trim());
    formData.append("numero", phone.trim()); formData.append("dateDeNaissance", "");
    formData.append("categorie", categorie);
    if (photo) formData.append("photo", photo);
    fetcher.submit(formData, { method: "post", action: "/api/members" });
    setNom(""); setPrenom(""); setPhone(""); setPhoto(null); setPhotoPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-2">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-center text-gray-800 text-lg sm:text-xl my-1 font-semibold">Enregistrement de nouveau membre</h1>
          <p className="text-center text-gray-500 text-sm mb-2">Bienvenue ! Remplissez ce formulaire pour vous inscrire.</p>
        </div>

        {/* Photo optionnelle */}
        <div className="flex flex-col items-center gap-1">
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Aperçu" className="w-20 h-20 rounded-full object-cover border-4 border-[#ede7f6] shadow" />
              <button type="button"
                onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">✕</button>
            </div>
          ) : (
            <div onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full border-2 border-dashed border-[#c7b8ea] bg-[#faf8ff] flex flex-col items-center justify-center cursor-pointer hover:bg-[#ede7f6] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-[#c7b8ea]">
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] text-[#c7b8ea] mt-0.5">Photo</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <p className="text-xs text-gray-400">(Optionnel) Photo de profil</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Nom</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom de famille"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Prénom</label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Numéro de téléphone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ex: 07 07 90 46 56"
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <button type="submit" disabled={isSubmitting}
          className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Enregistrement...</span></> : "Enregistrer"}
        </button>
        <button type="button" onClick={onSwitchToPresence}
          className="w-full border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm hover:shadow-md">
          Déjà inscrit ? Marquer ma présence
        </button>
        <p className="italic text-[#4a2b87] text-center text-xs sm:text-sm bg-[#ede7f6] p-3 rounded-lg">
          "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
        </p>
      </div>
    </form>
  );
}

// ─── Formulaire présence (recherche sécurisée) ───────────────────────────────
function PresenceForm({
  members,
  fetcher,
  onSwitchToRegister,
}: {
  members: Member[];
  fetcher: ReturnType<typeof useFetcher>;
  onSwitchToRegister: () => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [presence, setPresence] = useState<"Présent" | "Absent" | "">("");
  const [culte, setCulte] = useState("");
  const [raisonAbsence, setRaisonAbsence] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const isSubmitting = fetcher.state !== "idle";

  const sortedMembers = [...members].sort((a, b) =>
    `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr", { sensitivity: "base" })
  );

  // Ne montrer des résultats QUE si l'utilisateur a tapé au moins 2 caractères
  const filteredMembers = search.length >= 2
    ? sortedMembers.filter((m) => `${m.nom} ${m.prenom}`.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const selectedMember = members.find((m) => m.id.toString() === selectedMemberId);

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (member: Member) => {
    setSelectedMemberId(member.id.toString());
    setSearch(`${member.nom} ${member.prenom}`);
    setIsDropdownOpen(false);
  };

  const handleClearSelection = () => { setSelectedMemberId(""); setSearch(""); setIsDropdownOpen(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) { showToast("Veuillez sélectionner votre nom.", "error"); return; }
    if (!presence) { showToast("Veuillez choisir Présent ou Absent.", "error"); return; }
    if (!culte) { showToast("Veuillez choisir le culte.", "error"); return; }
    if (presence === "Absent" && !raisonAbsence.trim()) { showToast("Veuillez indiquer la raison de votre absence.", "error"); return; }

    const culteId = culte === "1er culte" ? 1 : culte === "2ème culte" ? 2 : 1;
    const formData = new FormData();
    formData.append("memberId", selectedMemberId);
    formData.append("culteId", culteId.toString());
    formData.append("presence", (presence === "Présent").toString());
    formData.append("date", new Date().toISOString().split("T")[0]);
    if (presence === "Absent" && raisonAbsence.trim()) formData.append("pkabsence", raisonAbsence.trim());
    fetcher.submit(formData, { method: "post", action: "/api/presences" });
    setSelectedMemberId(""); setSearch(""); setPresence(""); setCulte(""); setRaisonAbsence("");
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-2">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-center text-gray-800 text-lg sm:text-xl my-1 font-semibold">Gestion des présences aux cultes</h1>
          <p className="text-center text-gray-500 text-sm mb-2">Marquez votre présence pour les cultes d'aujourd'hui.</p>
        </div>

        {/* Recherche sécurisée : pas de liste au focus, seulement après 2 caractères */}
        <div ref={containerRef} className="relative">
          <label className="block mb-1.5 text-gray-700 font-medium text-sm">Sélectionnez votre nom</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedMemberId("");
              setIsDropdownOpen(e.target.value.length >= 2);
            }}
            onFocus={() => { if (search.length >= 2) setIsDropdownOpen(true); }}
            placeholder="Tapez votre nom pour rechercher (min. 2 caractères)..."
            className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none"
          />
          {search.length > 0 && search.length < 2 && (
            <p className="text-xs text-gray-400 mt-1 ml-1">Tapez au moins 2 caractères pour rechercher…</p>
          )}

          {isDropdownOpen && filteredMembers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
              {filteredMembers.map((m) => (
                <button key={m.id} type="button" onClick={() => handleSelect(m)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#ede7f6] transition-colors text-left">
                  {m.photo ? (
                    <img src={m.photo} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#ede7f6] flex items-center justify-center flex-shrink-0 text-[#4a2b87] text-xs font-bold">
                      {m.nom.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-800">{m.nom} {m.prenom}</span>
                </button>
              ))}
            </div>
          )}
          {isDropdownOpen && search.length >= 2 && filteredMembers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm text-gray-500 text-center">
              Aucun membre trouvé
            </div>
          )}
        </div>

        {/* Confirmation membre sélectionné */}
        {selectedMember && (
          <div className="flex items-center gap-3 bg-[#ede7f6] rounded-lg p-3 animate-fadeIn">
            {selectedMember.photo ? (
              <img src={selectedMember.photo} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#4a2b87] flex items-center justify-center text-white text-sm font-bold">
                {selectedMember.nom.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#4a2b87] text-sm">{selectedMember.nom} {selectedMember.prenom}</p>
              {selectedMember.numero && <p className="text-xs text-gray-500">{selectedMember.numero}</p>}
            </div>
            <button type="button" onClick={handleClearSelection} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        )}

        {/* Culte + Statut */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Sélectionnez le Culte</label>
            <select value={culte} onChange={(e) => setCulte(e.target.value)}
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none">
              <option value="">Choisissez le culte</option>
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
            </select>
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Statut</label>
            <div className="grid grid-cols-2 gap-1">
              {(["Présent", "Absent"] as const).map((val) => (
                <label key={val} className={`flex items-center justify-center p-3 py-3.5 sm:py-[16.5px] rounded-lg border cursor-pointer transition-all text-xs font-medium ${
                  presence === val
                    ? val === "Présent" ? "border-[#2e7d32] bg-[#e8f5e9] text-[#2e7d32]" : "border-[#c62828] bg-[#ffebee] text-[#c62828]"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}>
                  <input type="radio" name="presence" value={val} checked={presence === val}
                    onChange={(e) => setPresence(e.target.value as "Présent" | "Absent")} className="sr-only" />
                  {val}
                </label>
              ))}
            </div>
          </div>
        </div>

        {presence === "Absent" && (
          <div className="animate-fadeIn">
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">
              Raison de l'absence <span className="text-[#c62828]">*</span>
            </label>
            <textarea value={raisonAbsence} onChange={(e) => setRaisonAbsence(e.target.value)}
              placeholder="Indiquez la raison de votre absence..." rows={3}
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#c62828] focus:ring-2 focus:ring-[#c62828]/20 focus:outline-none resize-none" />
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <button type="submit" disabled={isSubmitting}
          className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Enregistrement...</span></> : "Enregistrer ma présence"}
        </button>
        <button type="button" onClick={onSwitchToRegister}
          className="w-full border border-[#c7b8ea] rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-white text-[#4a2b87] hover:bg-gray-50 shadow-sm hover:shadow-md">
          Nouveau ? S'inscrire
        </button>
        <p className="italic text-[#4a2b87] text-center text-xs sm:text-sm bg-[#ede7f6] p-3 rounded-lg">
          "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
        </p>
      </div>
    </form>
  );
}

// ─── Formulaire visiteur ─────────────────────────────────────────────────────
function VisiteurForm({ fetcher }: { fetcher: ReturnType<typeof useFetcher> }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [age, setAge] = useState("");
  const [categorie, setCategorie] = useState("hommes");
  const [culte, setCulte] = useState("");
  const [provenance, setProvenance] = useState("");
  const { showToast } = useToast();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    const data = fetcher.data as any;
    if (data?.success) {
      setNom(""); setPrenom(""); setTelephone(""); setAge("");
      setCategorie("hommes"); setCulte(""); setProvenance("");
    }
  }, [fetcher.data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { showToast("Veuillez remplir le nom.", "error"); return; }
    if (!prenom.trim()) { showToast("Veuillez remplir le prénom.", "error"); return; }
    if (!culte) { showToast("Veuillez choisir le culte.", "error"); return; }
    const culteId = culte === "1er culte" ? 1 : culte === "2ème culte" ? 2 : 1;
    const fd = new FormData();
    fd.append("nom", nom.trim()); fd.append("prenom", prenom.trim());
    fd.append("telephone", telephone.trim());
    fd.append("culteId", culteId.toString());
    fd.append("date", new Date().toISOString().split("T")[0]);
    fd.append("categorie", categorie);
    if (age) fd.append("age", age);
    fd.append("provenance", provenance.trim());
    fetcher.submit(fd, { method: "post", action: "/api/visitors" });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-2">
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-center text-gray-800 text-lg font-semibold my-1">Enregistrement visiteur</h1>
          <p className="text-center text-gray-500 text-sm mb-2">Bienvenue parmi nous ! Merci de vous enregistrer.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Nom <span className="text-red-500">*</span></label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom"
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Prénom <span className="text-red-500">*</span></label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom"
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Téléphone</label>
            <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="07 00 00 00 00"
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Âge</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex: 25" min={1} max={120}
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Culte <span className="text-red-500">*</span></label>
            <select value={culte} onChange={(e) => setCulte(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none">
              <option value="">Choisir</option>
              <option value="1er culte">1er culte</option>
              <option value="2ème culte">2ème culte</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1.5 text-gray-700 font-medium text-sm">Provenance / Motif de visite</label>
          <textarea value={provenance} onChange={(e) => setProvenance(e.target.value)}
            placeholder="D'où venez-vous ? Qu'est-ce qui vous a amené ici ?" rows={2}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none resize-none" />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <button type="submit" disabled={isSubmitting}
          className="w-full border-none rounded-lg py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm sm:text-base bg-[#4a2b87] text-white hover:bg-[#3a2070] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Enregistrement...</span></> : "Enregistrer ma visite"}
        </button>
        <p className="italic text-[#4a2b87] text-center text-xs sm:text-sm bg-[#ede7f6] p-3 rounded-lg">
          "La maturité pour une pêche abondante en eau profonde." — Luc 5:4
        </p>
      </div>
    </form>
  );
}
