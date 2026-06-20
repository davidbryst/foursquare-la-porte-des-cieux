import type { Route } from "./+types/rapport-global";
import { getGlobalReportData } from "~/db/database.server";
import { categorieLabel, type GlobalBreakdownRow } from "~/utils/report";
import { requireUser } from "~/utils/session.server";

export function meta() {
  return [{ title: "Rapport Global de Présence" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  const report = await getGlobalReportData();
  const generatedAt = new Date().toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return { report, generatedAt };
}

export default function RapportGlobal({ loaderData }: Route.ComponentProps) {
  const { report, generatedAt } = loaderData;
  const { totals } = report;

  return (
    <div className="rg-root">
      <style>{REPORT_CSS}</style>

      {/* Barre d'outils (non imprimée) */}
      <div className="no-print rg-toolbar">
        <a href="/dashboard" className="rg-btn rg-btn-light">← Dashboard</a>
        <button type="button" className="rg-btn rg-btn-primary" onClick={() => window.print()}>
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      <div className="rg-sheet">
        {/* En-tête */}
        <header className="rg-header">
          <img src="/apple-touch-icon.png" alt="Logo" className="rg-logo" />
          <p className="rg-kicker">Église Foursquare La Porte des Cieux</p>
          <h1>Rapport Global des Présences</h1>
          <div className="rg-datebadge">Toutes dates confondues</div>
        </header>

        {/* Cartes de synthèse */}
        <div className="rg-cards">
          <div className="rg-card">
            <div className="rg-card-value">{totals.presents}</div>
            <div className="rg-card-label">Présents (pointages)</div>
          </div>
          <div className="rg-card">
            <div className="rg-card-value">{totals.absents}</div>
            <div className="rg-card-label">Absents (pointages)</div>
          </div>
          <div className="rg-card">
            <div className="rg-card-value">{totals.visiteurs}</div>
            <div className="rg-card-label">Invités</div>
          </div>
          <div className="rg-card">
            <div className="rg-card-value">{totals.membres}</div>
            <div className="rg-card-label">Membres inscrits</div>
          </div>
        </div>

        {/* Par catégorie */}
        <section className="rg-section">
          <h2>Répartition par catégorie</h2>
          <BreakdownTable rows={report.parCategorie} firstCol="Catégorie" labelize={categorieLabel} />
        </section>

        {/* Par culte */}
        <section className="rg-section">
          <h2>Répartition par culte</h2>
          <BreakdownTable rows={report.parCulte} firstCol="Culte" />
        </section>
      </div>

      {/* Pied de page (affiché une fois, en fin de document à l'impression) */}
      <footer className="rg-footer">
        <span className="rg-footer-brand">Foursquare La Porte des Cieux</span>
        <span className="rg-footer-meta">Système de Gestion de Présence · Généré le {generatedAt}</span>
      </footer>
    </div>
  );
}

function BreakdownTable({
  rows,
  firstCol,
  labelize,
}: {
  rows: GlobalBreakdownRow[];
  firstCol: string;
  labelize?: (v: string) => string;
}) {
  if (rows.length === 0) {
    return <p className="rg-empty">Aucune donnée.</p>;
  }
  return (
    <table className="rg-table">
      <thead>
        <tr>
          <th>{firstCol}</th>
          <th>Présents</th>
          <th>Absents</th>
          <th>Total pointages</th>
          <th>Invités</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label}>
            <td>{labelize ? labelize(r.label) : r.label}</td>
            <td className="rg-green">{r.presents}</td>
            <td className="rg-red">{r.absents}</td>
            <td>{r.total}</td>
            <td>{r.visiteurs}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const REPORT_CSS = `
.rg-root { font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #f3f4f6; min-height: 100vh; }
.rg-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 12px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; }
.rg-btn { border: none; border-radius: 8px; padding: 8px 14px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
.rg-btn-primary { background: #4a2b87; color: #fff; }
.rg-btn-light { background: #ede7f6; color: #4a2b87; }
.rg-sheet { max-width: 800px; margin: 16px auto; background: #fff; padding: 32px 36px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.rg-header { text-align: center; padding-bottom: 18px; border-bottom: 2px solid #4a2b87; }
.rg-logo { width: 56px; height: 56px; object-fit: contain; margin: 0 auto 10px; display: block; }
.rg-kicker { margin: 0 0 2px; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: #7c6aa6; }
.rg-header h1 { font-size: 24px; font-weight: 800; margin: 4px 0 14px; color: #1f2937; letter-spacing: -.01em; }
.rg-datebadge { display: inline-block; background: #4a2b87; color: #fff; font-size: 13px; font-weight: 600; padding: 6px 18px; border-radius: 999px; }
.rg-cards { display: flex; flex-wrap: wrap; gap: 16px; margin: 20px 0 28px; }
.rg-card { flex: 1; min-width: 120px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 10px; text-align: center; }
.rg-card-value { font-size: 28px; font-weight: 700; color: #4a2b87; }
.rg-card-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
.rg-section { margin-top: 24px; }
.rg-section h2 { font-size: 15px; font-weight: 700; color: #111827; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
.rg-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.rg-table th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 700; border: 1px solid #e5e7eb; color: #374151; }
.rg-table td { padding: 7px 10px; border: 1px solid #e5e7eb; color: #374151; }
.rg-green { color: #2e7d32; font-weight: 700; }
.rg-red { color: #c62828; font-weight: 700; }
.rg-empty { font-size: 13px; color: #6b7280; font-style: italic; }
.rg-footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; color: #9ca3af; font-size: 11px; padding: 16px; }
.rg-footer-brand { font-weight: 700; color: #6b7280; }
.rg-footer-meta { color: #9ca3af; }

@media print {
  .rg-root { background: #fff; }
  .no-print { display: none !important; }
  .rg-sheet { box-shadow: none; margin: 0; max-width: none; padding: 0; }
  .rg-table thead { display: table-header-group; }
  .rg-table tr { page-break-inside: avoid; }
  .rg-footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; page-break-inside: avoid; }
  @page { margin: 14mm 12mm; }
}
`;
