// Types et helpers de rapport — module SANS dépendance serveur,
// utilisable côté serveur (loaders/exports) ET côté client (rendu React).

export interface ReportPerson {
  nom: string;
  prenom: string;
  categorie: string; // valeur brute (hommes/femmes/jeunes/enfants)
  contact: string;   // numéro de téléphone, "" si absent
}

// Détail d'un culte précis (1er / 2ème / Autre) pour une journée donnée.
export interface CulteReport {
  culte: string;            // libellé du culte (ex. "1er culte")
  presents: ReportPerson[]; // membres présents à CE culte
  absents: ReportPerson[];  // membres non présents à CE culte (calculé = tous - présents)
  invites: ReportPerson[];  // invités venus à CE culte
  counts: { presents: number; absents: number; invites: number };
}

export interface DailyReport {
  date: string;             // AAAA-MM-JJ
  cultes: string[];         // libellés des cultes ayant eu de l'activité ce jour
  presents: ReportPerson[]; // permanents présents (présents à au moins un culte)
  invites: ReportPerson[];  // invités présents ce jour
  absents: ReportPerson[];  // permanents non présents ce jour (calculé)
  parCulte: CulteReport[];  // détail culte par culte
  counts: { presents: number; absents: number; invites: number };
}

// ── Rapport GLOBAL (toutes dates confondues) ──
export interface GlobalBreakdownRow {
  label: string;     // libellé brut (catégorie ou culte)
  presents: number;
  absents: number;
  total: number;
  visiteurs: number;
}

export interface GlobalReport {
  totals: {
    enregistrements: number; // nombre de lignes de présence
    presents: number;
    absents: number;
    visiteurs: number;
    membres: number;
  };
  parCategorie: GlobalBreakdownRow[];
  parCulte: GlobalBreakdownRow[];
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
