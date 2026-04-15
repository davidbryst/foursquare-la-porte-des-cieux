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

The app requires these env vars to run:

```
TURSO_DATABASE_URL=   # libSQL/Turso database URL
TURSO_AUTH_TOKEN=     # Turso authentication token
```

## Architecture

This is a **React Router v7 SSR app** (full-stack, not SPA) for tracking church attendance ("présence culte"). The app has two sides:

- **Public side** (`/`): Members register themselves and mark their attendance. No auth required.
- **Admin side** (`/dashboard`): Protected by cookie-based session auth. Admins view/edit/delete members and presence records, and export CSV.

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

### Database schema

Four tables in Turso (SQLite):
- `membre` — church members (nom, prenom, numero, dateDeNaissance)
- `culte` — worship service type (1 = "1er culte", 2 = "2ème culte")
- `presence` — attendance record linking membre ↔ culte, with presence boolean and optional pkabsence (absence reason)
- `admin` — admin users (default: `Culte` / `Culte@Pr0t3ction`)

Culte IDs are hardcoded: 1 = "1er culte", 2 = "2ème culte". The `culte` table exists but mapping is done in application code.

### Context system

Two React contexts are provided globally from `root.tsx`:

- **ToastContext** (`app/context/ToastContext.tsx`): `showToast(message, type)` — auto-dismisses after 4s. Types: `success | error | info | warning`.
- **ModalContext** (`app/context/ModalContext.tsx`): Controls the two global edit modals. Modals communicate with their parent tables via save handler callbacks set with `setMemberSaveHandler` / `setPresenceSaveHandler`.

### Data mutation pattern

The dashboard uses React Router's `useFetcher` for all mutations (no page-level form actions). Each table component (inside `dashboard.tsx`) creates its own `useFetcher` instances and submits to the API routes directly. After a successful mutation, it calls `revalidator.revalidate()` to refresh loader data.

### Styling

TailwindCSS v4 with the primary brand color `#4a2b87` (purple). Both the Tailwind PostCSS plugin and the Tailwind CDN script are loaded (the CDN script is in `root.tsx` `<head>`). The app is mobile-responsive with separate card views for mobile and table views for desktop (breakpoint: `md` for members, `lg` for presences).
