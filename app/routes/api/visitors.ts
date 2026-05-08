import { getAllVisiteurs, addVisiteur } from "~/db/database.server";
import type { Route } from "./+types/visitors";

// GET /api/visitors - Récupérer tous les visiteurs
export async function loader({ request }: Route.LoaderArgs) {
  const visiteurs = await getAllVisiteurs();
  return Response.json({ visiteurs });
}

// POST /api/visitors - Ajouter un nouveau visiteur
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const nom = formData.get("nom") as string;
  const prenom = formData.get("prenom") as string;
  const telephone = formData.get("telephone") as string | null;
  const culteId = parseInt(formData.get("culteId") as string) || 1;
  const date = formData.get("date") as string;
  const categorie = (formData.get("categorie") as string) || "hommes";
  const dateDeNaissance = (formData.get("dateDeNaissance") as string) || "";
  const residence = (formData.get("residence") as string) || null;
  const provenance = formData.get("provenance") as string | null;

  if (!nom || !prenom) {
    return Response.json(
      { error: "Le nom et le prénom sont obligatoires" },
      { status: 400 }
    );
  }

  const visiteurId = await addVisiteur(
    nom,
    prenom,
    telephone || null,
    culteId,
    date || new Date().toLocaleDateString(),
    categorie,
    dateDeNaissance,
    residence,
    provenance || null
  );

  if (visiteurId) {
    return Response.json({ success: true, visiteurId });
  } else {
    return Response.json(
      { error: "Erreur lors de l'ajout du visiteur" },
      { status: 500 }
    );
  }
}
