import ExcelJS from "exceljs";
import { getAllPresences, getAllVisiteurs, getAllMembers } from "~/db/database.server";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/report";

const PURPLE = "4a2b87";
const LIGHT_PURPLE = "ede7f6";
const GREEN = "2e7d32";
const RED = "c62828";
const CATEGORIES = ["enfants", "jeunes", "femmes", "hommes"] as const;

function headerRow(ws: ExcelJS.Worksheet, cols: string[]) {
  const row = ws.addRow(cols);
  row.height = 30; // augmented height
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PURPLE } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFc7b8ea' } },
      bottom: { style: 'thin', color: { argb: 'FFc7b8ea' } }
    };
  });
  return row;
}

function applyStripeAndHeight(ws: ExcelJS.Worksheet, startRow: number = 2) {
  ws.eachRow((row, rowNumber) => {
    if (rowNumber >= startRow) {
      row.height = 25; // augmented row height
      row.eachCell((cell) => {
        // align middle vertically
        cell.alignment = { ...cell.alignment, vertical: 'middle', wrapText: true };
        // mild borders
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFede7f6' } }
        };
        // gentle alternating colors for readability
        if (rowNumber > startRow) {
          if (rowNumber % 2 === 0) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDFBFF' } }; // slightly tinted white
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3EEFF' } }; // very light purple (f3eeff)
          }
        }
      });
    }
  });
}

// POST /api/report - Dynamic custom Excel export (for quick filtered tables)
export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  const data = await request.json();
  const { filename, sheetName, headers, rows, widths } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = "Présence Culte";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName || "Export");

  // set widths if provided
  if (widths && Array.isArray(widths)) {
    ws.columns = widths.map((w: number, i) => ({ key: `col${i}`, width: w }));
  } else {
    ws.columns = headers.map((_: any, i: number) => ({ key: `col${i}`, width: 25 }));
  }

  // Header
  if (headers) {
    headerRow(ws, headers);
  }

  // Rows
  if (rows && Array.isArray(rows)) {
    rows.forEach((r: any[]) => ws.addRow(r));
  }

  // apply styling
  applyStripeAndHeight(ws, headers ? 1 : 1);

  const buffer = await wb.xlsx.writeBuffer();

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename || "export.xlsx"}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}

// GET /api/report - Générer et télécharger le rapport Excel
export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);

  const [presences, visiteurs, members] = await Promise.all([
    getAllPresences(),
    getAllVisiteurs(),
    getAllMembers(),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Présence Culte";
  wb.created = new Date();

  // ── Feuille 1 : Global ──────────────────────────────────────────
  const wsGlobal = wb.addWorksheet("Global");
  wsGlobal.columns = [
    { header: "", key: "label", width: 40 },
    { header: "", key: "value", width: 25 },
  ];

  wsGlobal.addRow(["RAPPORT GLOBAL DES PRÉSENCES", ""]).font = { bold: true, size: 16 };
  wsGlobal.addRow(["Généré le", new Date().toLocaleString("fr-FR")]).height = 25;
  wsGlobal.addRow([]);

  const totalPresent = presences.filter((p) => p.presence === "Présent").length;
  const totalAbsent = presences.filter((p) => p.presence === "Absent").length;
  const totalVisiteurs = visiteurs.length;

  headerRow(wsGlobal, ["Indicateur", "Valeur"]);
  wsGlobal.addRow(["Total enregistrements présence", presences.length]);
  const r2 = wsGlobal.addRow(["Total présents", totalPresent]);
  const r3 = wsGlobal.addRow(["Total absents", totalAbsent]);
  wsGlobal.addRow(["Total visiteurs", totalVisiteurs]);

  r2.getCell(2).font = { color: { argb: "FF" + GREEN }, bold: true };
  r3.getCell(2).font = { color: { argb: "FF" + RED }, bold: true };

  applyStripeAndHeight(wsGlobal, 4);

  // ── Feuille 2 : Par Catégorie ───────────────────────────────────
  const wsCat = wb.addWorksheet("Par Catégorie");
  wsCat.columns = [
    { key: "cat", width: 25 },
    { key: "presents", width: 20 },
    { key: "absents", width: 20 },
    { key: "total", width: 20 },
    { key: "visiteurs", width: 20 },
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
  applyStripeAndHeight(wsCat, 3);

  // ── Feuille 3 : Par Culte ───────────────────────────────────────
  const wsCulte = wb.addWorksheet("Par Culte");
  wsCulte.columns = [
    { key: "culte", width: 25 },
    { key: "presents", width: 20 },
    { key: "absents", width: 20 },
    { key: "total", width: 20 },
    { key: "visiteurs", width: 20 },
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
  applyStripeAndHeight(wsCulte, 3);

  // ── Feuille 4 : Détail Présences ───────────────────────────────
  const wsDetail = wb.addWorksheet("Détail Présences");
  wsDetail.columns = [
    { key: "nom", width: 30 },
    { key: "telephone", width: 22 },
    { key: "categorie", width: 18 },
    { key: "presence", width: 16 },
    { key: "culte", width: 20 },
    { key: "date", width: 18 },
    { key: "pkabsence", width: 40 },
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
  applyStripeAndHeight(wsDetail, 3);

  // ── Feuille 5 : Détail Visiteurs ───────────────────────────────
  const wsVisiteurs = wb.addWorksheet("Visiteurs");
  wsVisiteurs.columns = [
    { key: "nom", width: 25 },
    { key: "prenom", width: 25 },
    { key: "telephone", width: 22 },
    { key: "categorie", width: 18 },
    { key: "age", width: 10 },
    { key: "culte", width: 20 },
    { key: "date", width: 18 },
    { key: "provenance", width: 40 },
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
  applyStripeAndHeight(wsVisiteurs, 3);

  // ── Feuille 6 : Liste des Membres ───────────────────────────────
  const wsMembres = wb.addWorksheet("Liste Complète des Membres");
  wsMembres.columns = [
    { key: "nom", width: 25 },
    { key: "prenom", width: 25 },
    { key: "numero", width: 22 },
    { key: "categorie", width: 18 },
    { key: "dateDeNaissance", width: 22 },
  ];

  wsMembres.addRow(["LISTE COMPLÈTE DES MEMBRES", "", "", "", ""]).font = { bold: true, size: 14 };
  wsMembres.addRow([]);
  headerRow(wsMembres, ["Nom", "Prénom", "Téléphone", "Catégorie", "Date Inscription"]);

  for (const m of members) {
    wsMembres.addRow([
      m.nom,
      m.prenom,
      m.numero || "",
      m.categorie || "hommes",
      m.dateDeNaissance || "",
    ]);
  }
  applyStripeAndHeight(wsMembres, 3);

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
