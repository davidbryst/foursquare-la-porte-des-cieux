import ExcelJS from "exceljs";
import { getAllPresences, getAllVisiteurs } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/report";

const PURPLE = "4a2b87";
const LIGHT_PURPLE = "ede7f6";
const GREEN = "2e7d32";
const RED = "c62828";
const CATEGORIES = ["enfants", "jeunes", "femmes", "hommes"] as const;

function headerRow(ws: ExcelJS.Worksheet, cols: string[]) {
  const row = ws.addRow(cols);
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PURPLE } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center" };
  });
  return row;
}

// GET /api/report - Générer et télécharger le rapport Excel
export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const [presences, visiteurs] = await Promise.all([
    getAllPresences(),
    getAllVisiteurs(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Présence Culte";
  wb.created = new Date();

  // ── Feuille 1 : Global ──────────────────────────────────────────
  const wsGlobal = wb.addWorksheet("Global");
  wsGlobal.columns = [
    { header: "", key: "label", width: 30 },
    { header: "", key: "value", width: 20 },
  ];

  wsGlobal.addRow(["RAPPORT GLOBAL DES PRÉSENCES", ""]).font = { bold: true, size: 14 };
  wsGlobal.addRow(["Généré le", new Date().toLocaleString("fr-FR")]);
  wsGlobal.addRow([]);

  const totalPresent = presences.filter((p) => p.presence === "Présent").length;
  const totalAbsent = presences.filter((p) => p.presence === "Absent").length;
  const totalVisiteurs = visiteurs.length;

  headerRow(wsGlobal, ["Indicateur", "Valeur"]);
  wsGlobal.addRow(["Total enregistrements présence", presences.length]);
  wsGlobal.addRow(["Total présents", totalPresent]);
  wsGlobal.addRow(["Total absents", totalAbsent]);
  wsGlobal.addRow(["Total visiteurs", totalVisiteurs]);

  // ── Feuille 2 : Par Catégorie ───────────────────────────────────
  const wsCat = wb.addWorksheet("Par Catégorie");
  wsCat.columns = [
    { key: "cat", width: 20 },
    { key: "presents", width: 15 },
    { key: "absents", width: 15 },
    { key: "total", width: 15 },
    { key: "visiteurs", width: 15 },
  ];

  wsCat.addRow(["RAPPORT PAR CATÉGORIE", "", "", "", ""]).font = { bold: true, size: 14 };
  wsCat.addRow([]);
  headerRow(wsCat, ["Catégorie", "Présents", "Absents", "Total Membres", "Visiteurs"]);

  for (const cat of CATEGORIES) {
    const catPresences = presences.filter((p) => p.categorie === cat);
    const catVisiteurs = visiteurs.filter((v) => v.categorie === cat);
    const presents = catPresences.filter((p) => p.presence === "Présent").length;
    const absents = catPresences.filter((p) => p.presence === "Absent").length;
    const row = wsCat.addRow([
      cat.charAt(0).toUpperCase() + cat.slice(1),
      presents,
      absents,
      catPresences.length,
      catVisiteurs.length,
    ]);
    row.getCell(2).font = { color: { argb: "FF" + GREEN }, bold: true };
    row.getCell(3).font = { color: { argb: "FF" + RED }, bold: true };
  }

  // ── Feuille 3 : Par Culte ───────────────────────────────────────
  const wsCulte = wb.addWorksheet("Par Culte");
  wsCulte.columns = [
    { key: "culte", width: 20 },
    { key: "presents", width: 15 },
    { key: "absents", width: 15 },
    { key: "total", width: 15 },
    { key: "visiteurs", width: 15 },
  ];

  wsCulte.addRow(["RAPPORT PAR CULTE", "", "", "", ""]).font = { bold: true, size: 14 };
  wsCulte.addRow([]);
  headerRow(wsCulte, ["Culte", "Présents", "Absents", "Total", "Visiteurs"]);

  const cultes = [...new Set(presences.map((p) => p.culte))].sort();
  for (const culte of cultes) {
    const cultePresences = presences.filter((p) => p.culte === culte);
    const culteVisiteurs = visiteurs.filter((v) => v.culte === culte);
    const presents = cultePresences.filter((p) => p.presence === "Présent").length;
    const absents = cultePresences.filter((p) => p.presence === "Absent").length;
    const row = wsCulte.addRow([culte, presents, absents, cultePresences.length, culteVisiteurs.length]);
    row.getCell(2).font = { color: { argb: "FF" + GREEN }, bold: true };
    row.getCell(3).font = { color: { argb: "FF" + RED }, bold: true };
  }

  // ── Feuille 4 : Détail Présences ───────────────────────────────
  const wsDetail = wb.addWorksheet("Détail Présences");
  wsDetail.columns = [
    { key: "nom", width: 25 },
    { key: "telephone", width: 18 },
    { key: "categorie", width: 14 },
    { key: "presence", width: 12 },
    { key: "culte", width: 14 },
    { key: "date", width: 14 },
    { key: "pkabsence", width: 30 },
  ];

  wsDetail.addRow(["DÉTAIL DES PRÉSENCES", "", "", "", "", "", ""]).font = { bold: true, size: 14 };
  wsDetail.addRow([]);
  headerRow(wsDetail, ["Nom", "Téléphone", "Catégorie", "Présence", "Culte", "Date", "Raison absence"]);

  for (const p of presences) {
    const row = wsDetail.addRow([
      p.nom,
      p.telephone,
      p.categorie || "",
      p.presence,
      p.culte,
      p.date,
      p.pkabsence || "",
    ]);
    if (p.presence === "Présent") {
      row.getCell(4).font = { color: { argb: "FF" + GREEN } };
    } else {
      row.getCell(4).font = { color: { argb: "FF" + RED } };
    }
  }

  // ── Feuille 5 : Détail Visiteurs ───────────────────────────────
  const wsVisiteurs = wb.addWorksheet("Visiteurs");
  wsVisiteurs.columns = [
    { key: "nom", width: 20 },
    { key: "prenom", width: 20 },
    { key: "telephone", width: 18 },
    { key: "categorie", width: 14 },
    { key: "age", width: 8 },
    { key: "culte", width: 14 },
    { key: "date", width: 14 },
    { key: "provenance", width: 30 },
  ];

  wsVisiteurs.addRow(["LISTE DES VISITEURS", "", "", "", "", "", "", ""]).font = { bold: true, size: 14 };
  wsVisiteurs.addRow([]);
  headerRow(wsVisiteurs, ["Nom", "Prénom", "Téléphone", "Catégorie", "Âge", "Culte", "Date", "Provenance / Motif"]);

  for (const v of visiteurs) {
    wsVisiteurs.addRow([
      v.nom,
      v.prenom,
      v.telephone || "",
      v.categorie,
      v.age ?? "",
      v.culte,
      v.date,
      v.provenance || "",
    ]);
  }

  // Générer le buffer
  const buffer = await wb.xlsx.writeBuffer();

  const date = new Date().toLocaleDateString("fr-FR").replace(/\//g, "-");
  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-presences-${date}.xlsx"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
