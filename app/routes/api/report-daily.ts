import ExcelJS from "exceljs";
import { getDailyReportData } from "~/db/database.server";
import { categorieLabel, type ReportPerson } from "~/utils/report";
import { requireUser } from "~/utils/session.server";
import type { Route } from "./+types/report-daily";

const PURPLE = "4a2b87";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function styleHeader(ws: ExcelJS.Worksheet, row: ExcelJS.Row) {
  row.height = 26;
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PURPLE } };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });
}

function addPeopleSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  title: string,
  people: ReportPerson[],
  showType: boolean
) {
  const ws = wb.addWorksheet(sheetName);
  const cols = [
    { width: 6 },   // N°
    { width: 28 },  // Nom
    { width: 28 },  // Prénom
    { width: 14 },  // Catégorie
    { width: 22 },  // Contact
  ];
  if (showType) cols.push({ width: 14 });
  ws.columns = cols;

  const titleRow = ws.addRow([title]);
  titleRow.font = { bold: true, size: 14, color: { argb: "FF" + PURPLE } };
  ws.addRow([]);

  const headers = ["N°", "Nom", "Prénom", "Catégorie", "Contact"];
  if (showType) headers.push("Type");
  styleHeader(ws, ws.addRow(headers));

  people.forEach((p, i) => {
    const row = [
      i + 1,
      p.nom,
      p.prenom,
      categorieLabel(p.categorie),
      p.contact && p.contact.trim() ? p.contact : "NC",
    ];
    if (showType) row.push("permanent");
    ws.addRow(row);
  });
}

// GET /api/report-daily?date=AAAA-MM-JJ - Rapport journalier au format Excel
export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || todayISO();
  const report = await getDailyReportData(date);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Présence Culte";
  wb.created = new Date();

  // Feuille de synthèse
  const wsSyn = wb.addWorksheet("Synthèse");
  wsSyn.columns = [{ width: 30 }, { width: 20 }];
  wsSyn.addRow(["RAPPORT JOURNALIER DE PRÉSENCE"]).font = { bold: true, size: 16, color: { argb: "FF" + PURPLE } };
  wsSyn.addRow(["Journée du", date]);
  wsSyn.addRow(["Cultes du jour", report.cultes.join(", ") || "Aucun"]);
  wsSyn.addRow([]);
  styleHeader(wsSyn, wsSyn.addRow(["Indicateur", "Valeur"]));
  wsSyn.addRow(["Présents (permanents + invités)", report.counts.presents]);
  wsSyn.addRow(["Absents", report.counts.absents]);
  wsSyn.addRow(["Invités présents", report.counts.invites]);

  addPeopleSheet(wb, "Permanents Présents", `Liste des Permanents Présents (${report.presents.length})`, report.presents, false);
  addPeopleSheet(wb, "Invités Présents", `Liste des Invités Présents (${report.invites.length})`, report.invites, false);
  addPeopleSheet(wb, "Absents", `Liste des Absents (${report.absents.length})`, report.absents, true);

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-journalier-${date}.xlsx"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
