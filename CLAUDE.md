# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (HMR at http://localhost:5173)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# TypeScript type checking
npm run typecheck
```

## Environment Variables

```
TURSO_DATABASE_URL=   # libSQL/Turso database URL (required)
TURSO_AUTH_TOKEN=     # Turso authentication token (required)
SESSION_SECRET=       # Cookie session signing secret — REQUIRED in production
                      # (the app throws at startup if missing when NODE_ENV=production).
                      # A dev fallback is used only in development.
ADMIN_USERNAME=       # Optional. Username for the seeded admin (default: "Culte")
ADMIN_PASSWORD=       # Optional but recommended. Password for the seeded admin
                      # (default: "Culte@Pr0t3ction"). A console warning is logged
                      # while the default password is in use.
```

## Architecture

This is a **React Router v7 SSR app** (full-stack, not SPA) for tracking church attendance ("présence culte"). The app has two sides:

- **Public side** (`/`): Members register themselves and mark their attendance. No auth required.
- **Admin side** (`/dashboard`): Protected by cookie-based session auth. Admins view/edit/delete members, guests and presence records, promote recurring guests to members, and export reports (global Excel + daily Excel/PDF).

### Key files

- [app/root.tsx](app/root.tsx) — App shell. Wraps everything in `ToastProvider` → `ModalProvider`. Renders the global modal components (`MemberEditModal`, `PresenceEditModal`) and `ToastContainer` once at the root level.
- [app/routes.ts](app/routes.ts) — All route definitions.
- [app/db/database.server.ts](app/db/database.server.ts) — **Singleton** Turso/libSQL client. All DB access goes through here. Exports typed `Member`, `Presence`, `Admin` interfaces and all CRUD functions. Tables are created on first connection.
- [app/utils/session.server.ts](app/utils/session.server.ts) — Cookie session management. `requireUser()` redirects to login if not authenticated.

### Routes

| Path | File | Description |
|------|------|-------------|
| `/` | `routes/home.tsx` | Public form: member registration + presence marking |
| `/dashboard` | `routes/dashboard.tsx` | Admin dashboard (auth required) |
| `/dashboard/login` | `routes/dashboard-login.tsx` | Admin login |
| `api/members` | `routes/api/members.ts` | GET list, POST create |
| `api/members/:id` | `routes/api/members-id.ts` | PUT update, DELETE delete |
| `api/presences` | `routes/api/presences.ts` | GET list, POST create |
| `api/presences/:id` | `routes/api/presences-id.ts` | PUT update, DELETE delete |
| `api/auth/login` | `routes/api/auth-login.ts` | POST login |
| `api/auth/logout` | `routes/api/auth-logout.ts` | POST logout |
| `api/visitors` | `routes/api/visitors.ts` | GET list, POST create (occasional guests) |
| `api/visitors/:id` | `routes/api/visitors-id.ts` | PUT update, DELETE delete |
| `api/visitors-convert` | `routes/api/visitors-convert.ts` | POST — promote a recurring guest to a permanent member, then delete their guest rows |
| `api/presence-unlock` | `routes/api/presence-unlock.ts` | POST — verify the rolling access code (rate-limited) |
| `api/config` | `routes/api/config.ts` | Culte session start/stop + access code |
| `api/rollcall` | `routes/api/rollcall.ts` | GET/POST — roll-call presence marking |
| `api/report` | `routes/api/report.ts` | GET global Excel report; POST custom filtered Excel |
| `api/report-daily` | `routes/api/report-daily.ts` | GET `?date=` — daily report as Excel (présents/absents/invités) |
| `/rapport-journalier` | `routes/rapport-journalier.tsx` | Printable daily report page (`?date=`); "Print → Save as PDF" produces the PDF (auth required) |
| `/rollcall` | `routes/rollcall.tsx` | Roll-call UI |
| `/display` | `routes/display.tsx` | Projector page showing the rolling access code |

### Database schema

Tables in Turso (SQLite):
- `membre` — permanent church members (nom, prenom, numero, residence, categorie, photo, **dateEnregistrement**). `dateEnregistrement` is the day the member was registered (set server-side on insert). `dateDeNaissance` is a **legacy** column kept only for backward compat with existing rows — no longer collected; `addMember` writes `""` into it to satisfy the old NOT NULL constraint on existing databases.
- `visiteur` — occasional guests ("invités de passage"), a table **separate** from `membre` (nom, prenom, telephone, culte, **date** = registration/visit day, categorie, residence, provenance). Each visit inserts a new row, so a recurring guest appears multiple times.
- `culte` — worship service type. The `culte` table exists but the label mapping is done in application code (`culteLabel` in `database.server.ts`): **1 = "1er culte", 2 = "2ème culte", 3 = "Autre"**.
- `presence` — attendance record linking membre ↔ culte, with presence boolean and optional pkabsence (absence reason).
- `config` — key/value store (rolling presence code + session expiry).
- `admin` — admin users (seeded from `ADMIN_USERNAME`/`ADMIN_PASSWORD` env, defaults `Culte` / `Culte@Pr0t3ction`).

### Attendance / reporting model

- **Members vs guests are distinct.** Members live in `membre`, guests in `visiteur`. A guest can be promoted to a member via `api/visitors-convert`.
- **Daily report** (`getDailyReportData(date)` in `database.server.ts`, rendered by `/rapport-journalier` and `api/report-daily`): for a given day it produces three lists — **présents permanents** (members present at ≥1 culte that day), **invités présents** (guests that day), **absents** = all members NOT present that day (derived).
- **"Journalier" rule:** a member present at any culte of the day is never counted absent that day. **Guests are never counted as absent** (no attendance obligation).
- `app/utils/report.ts` holds the **client-safe** report types + `categorieLabel` (do not import server-only `database.server.ts` into client-rendered code).

### Context system

Two React contexts are provided globally from `root.tsx`:

- **ToastContext** (`app/context/ToastContext.tsx`): `showToast(message, type)` — auto-dismisses after 4s. Types: `success | error | info | warning`.
- **ModalContext** (`app/context/ModalContext.tsx`): Controls the two global edit modals. Modals communicate with their parent tables via save handler callbacks set with `setMemberSaveHandler` / `setPresenceSaveHandler`.

### Data mutation pattern

The dashboard uses React Router's `useFetcher` for all mutations (no page-level form actions). Each table component (inside `dashboard.tsx`) creates its own `useFetcher` instances and submits to the API routes directly. After a successful mutation, it calls `revalidator.revalidate()` to refresh loader data.

### Styling

TailwindCSS v4 with the primary brand color `#4a2b87` (purple). Both the Tailwind PostCSS plugin and the Tailwind CDN script are loaded (the CDN script is in `root.tsx` `<head>`). The app is mobile-responsive with separate card views for mobile and table views for desktop (breakpoint: `md` for members, `lg` for presences).
