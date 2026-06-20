import type { Route } from "./+types/rapport-journalier";
import { getDailyReportData } from "~/db/database.server";
import { categorieLabel, type ReportPerson } from "~/utils/report";
import { requireUser } from "~/utils/session.server";

export function meta() {
  return [{ title: "Rapport Journalier de Présence" }];
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// AAAA-MM-JJ -> JJ/MM/AAAA
function toFrDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const url = new URL(request.url);
  const date = url.searchParams.get("date") || todayISO();
  const report = await getDailyReportData(date);
  const generatedAt = new Date().toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return { report, date, dateFr: toFrDate(date), generatedAt };
}

function contactOf(p: ReportPerson): string {
  return p.contact && p.contact.trim() ? p.contact : "NC";
}

export default function RapportJournalier({ loaderData }: Route.ComponentProps) {
  const { report, date, dateFr, generatedAt } = loaderData;

  return (
    <div className="rj-root">
      <style>{REPORT_CSS}</style>

      {/* Barre d'outils (non imprimée) */}
      <div className="no-print rj-toolbar">
        <a href="/dashboard" className="rj-btn rj-btn-light">← Dashboard</a>
        <form method="get" className="rj-date-form">
          <label>Date :</label>
          <input type="date" name="date" defaultValue={date} />
          <button type="submit" className="rj-btn rj-btn-light">Voir</button>
        </form>
        <button type="button" className="rj-btn rj-btn-primary" onClick={() => window.print()}>
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="rj-sheet">
        {/* En-tête */}
        <header className="rj-header">
          <img src="/apple-touch-icon.png" alt="Logo" className="rj-logo" />
          <h1>Rapport Journalier de Présence</h1>
          <p className="rj-sub">Journée du {dateFr}</p>
          <p className="rj-sub">Cultes du jour :</p>
          {report.cultes.length > 0 ? (
            report.cultes.map((c) => (
              <p key={c} className="rj-culte">- {c}</p>
            ))
          ) : (
            <p className="rj-culte">- Aucun culte enregistré ce jour</p>
          )}
          <hr />
        </header>

        {/* Cartes de synthèse */}
        <div className="rj-cards">
          <div className="rj-card">
            <div className="rj-card-value">{report.counts.presents}</div>
            <div className="rj-card-label">Présents</div>
          </div>
          <div className="rj-card">
            <div className="rj-card-value">{report.counts.absents}</div>
            <div className="rj-card-label">Absents</div>
          </div>
          <div className="rj-card">
            <div className="rj-card-value">{report.counts.invites}</div>
            <div className="rj-card-label">Invités présents</div>
          </div>
        </div>

        {/* Liste des Permanents Présents */}
        <section className="rj-section">
          <h2>Liste des Permanents Présents ({report.presents.length})</h2>
          <PersonTable people={report.presents} />
        </section>

        {/* Liste des Invités Présents */}
        <section className="rj-section">
          <h2>Liste des Invités Présents ({report.invites.length})</h2>
          <PersonTable people={report.invites} />
        </section>

        {/* Liste des Absents */}
        <section className="rj-section">
          <h2>Liste des Absents ({report.absents.length})</h2>
          <PersonTable people={report.absents} showType />
        </section>
      </div>

      {/* Pied de page (répété à l'impression) */}
      <footer className="rj-footer">
        <div>Rapport généré le {generatedAt}</div>
        <div>Système de Gestion de Présence - Foursquare La Porte des Cieux</div>
      </footer>
    </div>
  );
}

function PersonTable({ people, showType }: { people: ReportPerson[]; showType?: boolean }) {
  if (people.length === 0) {
    return <p className="rj-empty">Aucun enregistrement.</p>;
  }
  return (
    <table className="rj-table">
      <thead>
        <tr>
          <th className="rj-col-num">N°</th>
          <th>Nom</th>
          <th>Prénom</th>
          <th>Catégorie</th>
          <th>Contact</th>
          {showType && <th>Type</th>}
        </tr>
      </thead>
      <tbody>
        {people.map((p, i) => (
          <tr key={i}>
            <td className="rj-col-num">{i + 1}</td>
            <td>{p.nom}</td>
            <td>{p.prenom}</td>
            <td>{categorieLabel(p.categorie)}</td>
            <td>{contactOf(p)}</td>
            {showType && <td>permanent</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const REPORT_CSS = `
.rj-root { font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #f3f4f6; min-height: 100vh; }
.rj-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; }
.rj-date-form { display: flex; align-items: center; gap: 8px; }
.rj-date-form input { padding: 6px 8px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
.rj-btn { border: none; border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
.rj-btn-primary { background: #4a2b87; color: #fff; }
.rj-btn-light { background: #ede7f6; color: #4a2b87; }
.rj-sheet { max-width: 800px; margin: 16px auto; background: #fff; padding: 32px 36px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.rj-header { text-align: center; }
.rj-logo { width: 64px; height: 64px; object-fit: contain; margin: 0 auto 8px; display: block; }
.rj-header h1 { font-size: 22px; font-weight: 700; margin: 8px 0; color: #111827; }
.rj-sub { margin: 2px 0; color: #4b5563; font-size: 14px; }
.rj-culte { margin: 2px 0; color: #4b5563; font-size: 13px; }
.rj-header hr { margin: 16px 0; border: none; border-top: 2px solid #4a2b87; }
.rj-cards { display: flex; gap: 16px; margin: 20px 0 28px; }
.rj-card { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 10px; text-align: center; }
.rj-card-value { font-size: 30px; font-weight: 700; color: #4a2b87; }
.rj-card-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
.rj-section { margin-top: 24px; }
.rj-section h2 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
.rj-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.rj-table th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 700; border: 1px solid #e5e7eb; color: #374151; }
.rj-table td { padding: 7px 10px; border: 1px solid #e5e7eb; color: #374151; }
.rj-col-num { width: 44px; }
.rj-empty { font-size: 13px; color: #6b7280; font-style: italic; }
.rj-footer { text-align: center; color: #9ca3af; font-size: 11px; padding: 16px; }

@media print {
  .rj-root { background: #fff; }
  .no-print { display: none !important; }
  .rj-sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; }
  .rj-table thead { display: table-header-group; }
  .rj-table tr { page-break-inside: avoid; }
  .rj-section { page-break-inside: auto; }
  .rj-footer { position: fixed; bottom: 0; left: 0; right: 0; }
  @page { margin: 16mm 12mm 20mm; }
}
`;
