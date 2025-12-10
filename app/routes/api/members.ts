import { getAllMembers, addMember, getMemberByNameAndPrenom } from "~/db/database.server";
import type { Route } from "./+types/members";

// GET /api/members - Récupérer tous les membres
export async function loader({ request }: Route.LoaderArgs) {
  const members = getAllMembers();
  return Response.json({ members });
}

// POST /api/members - Ajouter un nouveau membre
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const nom = formData.get("nom") as string;
  const prenom = formData.get("prenom") as string;
  const numero = formData.get("numero") as string | null;
  const dateDeNaissance = (formData.get("dateDeNaissance") as string) || "";

  if (!nom || !prenom) {
    return Response.json(
      { error: "Le nom et le prénom sont obligatoires" },
      { status: 400 }
    );
  }

  // Vérifier si le membre existe déjà
  const existingMember = getMemberByNameAndPrenom(nom, prenom);
  if (existingMember) {
    return Response.json(
      { error: "Ce membre existe déjà", exists: true },
      { status: 400 }
    );
  }


  const memberId = addMember(nom, prenom, numero, dateDeNaissance);

  if (memberId) {
    return Response.json({ success: true, memberId });
  } else {
    return Response.json(
      { error: "Erreur lors de l'ajout du membre" },
      { status: 500 }
    );
  }
}

