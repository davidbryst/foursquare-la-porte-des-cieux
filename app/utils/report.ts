// Types et helpers de rapport — module SANS dépendance serveur,
// utilisable côté serveur (loaders/exports) ET côté client (rendu React).

export interface ReportPerson {
  nom: string;
  prenom: string;
  categorie: string; // valeur brute (hommes/femmes/jeunes/enfants)
  contact: string;   // numéro de téléphone, "" si absent
}

export interface DailyReport {
  date: string;             // AAAA-MM-JJ
  cultes: string[];         // libellés des cultes ayant eu de l'activité ce jour
  presents: ReportPerson[]; // permanents présents (présents à au moins un culte)
  invites: ReportPerson[];  // invités présents ce jour
  absents: ReportPerson[];  // permanents non présents ce jour (calculé)
  counts: { presents: number; absents: number; invites: number };
}

// Libellé d'affichage d'une catégorie (modèle du rapport : Homme/Femme/Jeunesse/Enfant/NC)
export function categorieLabel(cat: string | null | undefined): string {
  switch ((cat || "").toLowerCase()) {
    case "enfants": return "Enfant";
    case "jeunes": return "Jeunesse";
    case "femmes": return "Femme";
    case "hommes": return "Homme";
    default: return "NC";
  }
}
