import { useState, useEffect, useRef } from "react";
import { useFetcher, Link } from "react-router";
import type { Route } from "./+types/home";
import { useToast } from "~/context/ToastContext";
import { Spinner } from "~/components/ui/Toast";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Présence Culte - Accueil" },
    { name: "description", content: "Gestion des présences au culte" },
  ];
}

const CATEGORIES = [
  { value: "enfants", label: "Enfants" },
  { value: "jeunes", label: "Jeunes" },
  { value: "femmes", label: "Femmes" },
  { value: "hommes", label: "Hommes" },
];

type HomeTab = "inscription" | "visiteur";

const TAB_LABELS: Record<HomeTab, string> = {
  inscription: "Inscription",
  visiteur: "Visiteur",
};

// ─── Composant principal ────────────────────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<HomeTab>("inscription");

  const memberFetcher = useFetcher();
  const visiteurFetcher = useFetcher();
  const { showToast } = useToast();

  // Résultat ajout membre
  useEffect(() => {
    if (memberFetcher.data?.success) {
      showToast("Membre enregistré avec succès !", "success");
    }
    if (memberFetcher.data?.exists) {
      showToast("Ce membre existe déjà.", "warning");
    }
    if (memberFetcher.data?.error && !memberFetcher.data?.exists) {
      showToast(memberFetcher.data.error, "error");
    }
  }, [memberFetcher.data]);

  // Résultat ajout visiteur
  useEffect(() => {
    if (visiteurFetcher.data?.success) showToast("Visite enregistrée avec succès !", "success");
    if (visiteurFetcher.data?.error) showToast(visiteurFetcher.data.error, "error");
  }, [visiteurFetcher.data]);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header sticky — même style que rollcall */}
      <header className="bg-white/90 backdrop-blur border-b border-purple-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo + Titre */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://image2url.com/images/1764243038241-9886220a-7dd9-4dc5-a8e7-8ded2d536163.png"
              alt="Logo"
              className="w-9 h-9 object-contain drop-shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-[#4a2b87] font-bold text-base leading-tight truncate">Présence Culte</h1>
              <p className="text-gray-400 text-xs leading-tight hidden sm:block">Assemblée La Porte des Cieux</p>
            </div>
          </div>

          {/* Liens nav */}
          <div className="flex items-center gap-2">
            <Link
              to="/rollcall"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4a2b87] text-white text-xs font-semibold rounded-lg hover:bg-[#5a3b97] transition-colors shadow-sm"
            >
              <span className="hidden sm:inline">📋</span>
              <span>Liste d'appel</span>
              {/* <span className="hidden sm:inline">Liste d'appel</span> */}
            </Link>
            <Link
              to="/dashboard"
              target="_blank"
              className="px-3 py-1.5 bg-white border border-purple-200 text-[#4a2b87] text-xs font-medium rounded-lg hover:bg-purple-50 transition-colors"
            >
              Dashboard →
            </Link>
          </div>
        </div>

        {/* Tabs — pills comme rollcall */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-1.5">
            {(["inscription", "visiteur"] as HomeTab[]).map((tab) => (
              <button
                key={tab}
                id={`home-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeTab === tab
                  ? "bg-[#4a2b87] text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1">
        {activeTab === "inscription" && <MemberForm fetcher={memberFetcher} />}
        {activeTab === "visiteur" && <VisiteurForm fetcher={visiteurFetcher} />}
      </main>

      {/* Footer discret */}
      <footer className="text-center pb-6 pt-2">
        <p className="italic text-[#4a2b87] text-xs bg-white/60 backdrop-blur inline-block px-4 py-2 rounded-full border border-purple-100">
          « La maturité pour une pêche abondante en eau profonde. » — Luc 5:4
        </p>
      </footer>
    </div>
  );
}

// ─── Formulaire inscription membre ──────────────────────────────────────────────
function MemberForm({
  fetcher,
}: {
  fetcher: ReturnType<typeof useFetcher>;
}) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [residence, setResidence] = useState("");
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
    formData.append("numero", phone.trim());
    formData.append("residence", residence.trim());
    formData.append("categorie", categorie);
    if (photo) formData.append("photo", photo);
    fetcher.submit(formData, { method: "post", action: "/api/members" });
    setNom(""); setPrenom(""); setPhone(""); setResidence(""); setPhoto(null); setPhotoPreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-[#4a2b87]/5 p-6 space-y-5">
        {/* En-tête */}
        <div className="text-center">
          <h2 className="text-gray-800 text-lg font-semibold">Nouveau membre</h2>
          <p className="text-gray-500 text-sm mt-1">Remplissez ce formulaire pour vous inscrire.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          <div>
            <label className="block mb-1.5 text-gray-700 font-medium text-sm">Lieu de résidence</label>
            <input type="text" value={residence} onChange={(e) => setResidence(e.target.value)} placeholder="Votre quartier..."
              className="w-full p-3 sm:p-3.5 rounded-lg border border-gray-300 bg-white text-sm transition-all duration-200 focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
          </div>
        </div>
      </div>{/* fin card */}

      {/* Actions */}
      <div className="mt-4 space-y-3">
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl py-3 px-4 font-semibold cursor-pointer transition-all duration-200 text-sm bg-[#4a2b87] text-white hover:bg-[#5a3b97] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Enregistrement...</span></> : "Enregistrer"}
        </button>
        <Link to="/rollcall"
          className="w-full rounded-xl py-3 px-4 font-medium cursor-pointer transition-all duration-200 text-sm border border-purple-200 bg-white text-[#4a2b87] hover:bg-purple-50 block text-center">
          Déjà inscrit ? Marquer ma présence →
        </Link>
      </div>
    </form>
  );
}

// ─── Formulaire visiteur ─────────────────────────────────────────────────────
function VisiteurForm({ fetcher }: { fetcher: ReturnType<typeof useFetcher> }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [residence, setResidence] = useState("");
  const [categorie, setCategorie] = useState("hommes");
  const [culte, setCulte] = useState("");
  const [provenance, setProvenance] = useState("");
  const { showToast } = useToast();
  const isSubmitting = fetcher.state !== "idle";

  useEffect(() => {
    const data = fetcher.data as any;
    if (data?.success) {
      setNom(""); setPrenom(""); setTelephone(""); setResidence("");
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
    if (residence) fd.append("residence", residence.trim());
    fd.append("provenance", provenance.trim());
    fetcher.submit(fd, { method: "post", action: "/api/visitors" });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fadeIn">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-[#4a2b87]/5 p-6 space-y-4">
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
        <div>
          <label className="block mb-1.5 text-gray-700 font-medium text-sm">Téléphone</label>
          <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="07 00 00 00 00"
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
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
          <label className="block mb-1.5 text-gray-700 font-medium text-sm">Lieu de résidence</label>
          <input type="text" value={residence} onChange={(e) => setResidence(e.target.value)} placeholder="Votre quartier..."
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none" />
        </div>
        <div>
          <label className="block mb-1.5 text-gray-700 font-medium text-sm">Provenance / Motif de visite</label>
          <textarea value={provenance} onChange={(e) => setProvenance(e.target.value)}
            placeholder="D'où venez-vous ? Qu'est-ce qui vous a amené ici ?" rows={2}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-[#4a2b87] focus:ring-2 focus:ring-[#4a2b87]/20 focus:outline-none resize-none" />
        </div>
      </div>{/* fin card */}
      <div className="mt-4 space-y-3">
        <button type="submit" disabled={isSubmitting}
          className="w-full rounded-xl py-3 px-4 font-semibold cursor-pointer transition-all duration-200 text-sm bg-[#4a2b87] text-white hover:bg-[#5a3b97] shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? <><Spinner className="border-white/30 border-t-white" /><span>Enregistrement...</span></> : "Enregistrer ma visite"}
        </button>
      </div>
    </form>
  );
}
