import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/home";
import { getAllMembers } from "~/db/database.server";
import type { Member } from "~/db/database.server";

// Components
import Header from "~/components/Header";
import MemberForm from "~/components/MemberForm";
import PresenceForm from "~/components/PresenceForm";
import SuccessModal from "~/components/ui/SuccessModal";

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

  // Handler pour MemberForm
  const handleMemberSubmit = (nom: string, prenom: string, phone: string) => {
    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("prenom", prenom);
    formData.append("numero", phone);
    formData.append("dateDeNaissance", "");
    memberFetcher.submit(formData, { method: "post", action: "/api/members" });
  };

  // Handler pour PresenceForm (avec pkabsence)
  const handlePresenceSubmit = (
    memberId: number,
    culteId: number,
    isPresent: boolean,
    date: string,
    pkabsence: string | null
  ) => {
    const formData = new FormData();
    formData.append("memberId", memberId.toString());
    formData.append("culteId", culteId.toString());
    formData.append("presence", isPresent.toString());
    formData.append("date", date);
    if (pkabsence) {
      formData.append("pkabsence", pkabsence);
    }
    presenceFetcher.submit(formData, { method: "post", action: "/api/presences" });
  };

  return (
    <section className="flex justify-center items-center h-screen py-2 sm:py-8 px-3 sm:px-4 bg-gray-50">
      <div className="relative z-10 h-xl w-lg p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden container">
        <Header />

        {showPresence ? (
          <PresenceForm
            members={members}
            onSubmit={handlePresenceSubmit}
            onSwitchToRegister={() => setShowPresence(false)}
          />
        ) : (
          <MemberForm
            onSubmit={handleMemberSubmit}
            onSwitchToPresence={() => setShowPresence(true)}
          />
        )}
      </div>

      <SuccessModal show={showSuccess} />
    </section>
  );
}
