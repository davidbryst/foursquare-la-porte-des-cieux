# Graph Report - .  (2026-06-18)

## Corpus Check
- Corpus is ~40,625 words - fits in a single context window. You may not need a graph.

## Summary
- 394 nodes · 648 edges · 32 communities (17 shown, 15 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.8)
- Token cost: 230,170 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Server Route Handlers|Server Route Handlers]]
- [[_COMMUNITY_App Shell & Context|App Shell & Context]]
- [[_COMMUNITY_Presence Approaches & Schema Design|Presence Approaches & Schema Design]]
- [[_COMMUNITY_UI Patterns & Tables|UI Patterns & Tables]]
- [[_COMMUNITY_DB CRUD & Forms|DB CRUD & Forms]]
- [[_COMMUNITY_Forms & Table Components|Forms & Table Components]]
- [[_COMMUNITY_Admin Session & Config|Admin Session & Config]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Authentication Flow|Authentication Flow]]
- [[_COMMUNITY_Roll Call & Members|Roll Call & Members]]
- [[_COMMUNITY_Build Dev Dependencies|Build Dev Dependencies]]
- [[_COMMUNITY_Tabs Component|Tabs Component]]
- [[_COMMUNITY_Success Modal|Success Modal]]
- [[_COMMUNITY_Claude Permissions|Claude Permissions]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_App Icons (Church Logo)|App Icons (Church Logo)]]
- [[_COMMUNITY_Header & Routing|Header & Routing]]
- [[_COMMUNITY_Visitors Loader|Visitors Loader]]
- [[_COMMUNITY_Root Error Boundary|Root Error Boundary]]
- [[_COMMUNITY_Card Primitive|Card Primitive]]
- [[_COMMUNITY_Select Component|Select Component]]
- [[_COMMUNITY_SuccessModal Node|SuccessModal Node]]
- [[_COMMUNITY_Tabs Node|Tabs Node]]
- [[_COMMUNITY_Add Visitor|Add Visitor]]
- [[_COMMUNITY_Update Visitor|Update Visitor]]
- [[_COMMUNITY_DevTools Config|DevTools Config]]

## God Nodes (most connected - your core abstractions)
1. `ensureDb()` - 23 edges
2. `useToast()` - 20 edges
3. `compilerOptions` - 16 edges
4. `getAllMembers()` - 14 edges
5. `requireUser()` - 12 edges
6. `getSessionExpiry()` - 11 edges
7. `useModal()` - 10 edges
8. `getPresenceCode()` - 10 edges
9. `MemberEditModal` - 9 edges
10. `getAllPresences()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `useFetcher mutation + revalidate pattern` --rationale_for--> `visitors action (POST create)`  [INFERRED]
  CLAUDE.md → app/routes/api/visitors.ts
- `Visiteur entity (nom, prenom, telephone, culteId, categorie, dateDeNaissance, residence, provenance)` --semantically_similar_to--> `membre table (id, nom, prenom, numero, dateDeNaissance)`  [INFERRED] [semantically similar]
  app/routes/api/visitors.ts → data/data.db.sql
- `App architecture (RR v7 SSR, public + admin sides)` --references--> `Cookie-based session auth pattern`  [INFERRED]
  CLAUDE.md → app/utils/session.server.ts
- `Approche 1 - Code projecteur (implemented)` --conceptually_related_to--> `presence table (id, culte, presence, date, member, pkabsence)`  [INFERRED]
  APPROCHES-PRESENCE.md → data/data.db.sql
- `App architecture (RR v7 SSR, public + admin sides)` --references--> `presence table (id, culte, presence, date, member, pkabsence)`  [INFERRED]
  CLAUDE.md → data/data.db.sql

## Hyperedges (group relationships)
- **Global Modal Orchestration via ModalContext** — root_App, modalcontext_useModal, membereditmodal_MemberEditModal, presenceeditmodal_PresenceEditModal, visitoreditmodal_VisitorEditModal [EXTRACTED 1.00]
- **Shared UI Primitives Consumed by Forms and Tables** — button_Button, input_Input, memberform_MemberForm, membertable_MemberTable, presencetable_PresenceTable [INFERRED 0.85]
- **Edit Modal Save-Handler + Toast + Spinner Pattern** — concept_save_handler_callback, toastcontext_useToast, toast_Spinner, membereditmodal_MemberEditModal, presenceeditmodal_PresenceEditModal [INFERRED 0.75]
- **Culte session code lifecycle (generate, display, unlock)** — config_action, database_startCulteSession, database_config_table, display_DisplayPage, presenceunlock_action, database_getSessionExpiry [INFERRED 0.85]
- **Presence CRUD + rollcall toggle over shared presence data** — presences_action, presences_loader, presencesid_action, rollcall_action, database_addPresence, database_updatePresence, database_getAllPresences [INFERRED 0.85]
- **Excel report aggregates members, presences, visiteurs** — report_loader, database_getAllMembers, database_getAllPresences, database_getAllVisiteurs [INFERRED 0.75]
- **Turso/SQLite database schema (admin, culte, membre, presence)** — sql_table_admin, sql_table_culte, sql_table_membre, sql_table_presence, sql_fk_presence_culte, sql_fk_presence_member [EXTRACTED 1.00]
- **Visitor CRUD flow (list/create/update/delete)** — visitors_loader, visitors_action, visitorsid_action, visitors_visiteurEntity [EXTRACTED 1.00]
- **Four presence-tracking approaches (projector code, kiosk, sector, roll call)** — approches_approche1_codeProjecteur, approches_approche2_bornesAccueil, approches_approche3_pointageSecteur, approches_approche4_listeAppel [EXTRACTED 1.00]

## Communities (32 total, 15 thin omitted)

### Community 0 - "Server Route Handlers"
Cohesion: 0.08
Nodes (52): action(), loader(), action(), action(), attempts, getClientIp(), isRateLimited(), action() (+44 more)

### Community 1 - "App Shell & Context"
Cohesion: 0.06
Nodes (40): HeaderProps, MemberSavePayload, ModalContext, ModalContextType, ModalProvider(), PresenceSavePayload, useModal(), VisitorSavePayload (+32 more)

### Community 2 - "Presence Approaches & Schema Design"
Cohesion: 0.06
Nodes (33): Approche 1 - Code projecteur (implemented), Approche 2 - Bornes d'accueil (kiosk self-service), Approche 3 - Pointage par secteur (huissier devices), Approche 4 - Liste d'appel (roll call), Category filter (Hommes/Femmes/Jeunes/Enfants), Recommended approach combinations by assembly size, /display projector page + rotating 6-digit code, /kiosk route (to create) (+25 more)

### Community 3 - "UI Patterns & Tables"
Cohesion: 0.13
Nodes (29): Button (UI primitive), Responsive Table/Card Dual View, Modal Save-Handler Callback Pattern, MemberTable, PresenceTable, VisitorTable, Member type, DeleteMemberForm (+21 more)

### Community 4 - "DB CRUD & Forms"
Cohesion: 0.09
Nodes (28): addMember, addPresence, checkPresenceExists, deleteMember, deletePresence, deleteVisiteur, ensureDb, getAllMembers (+20 more)

### Community 5 - "Forms & Table Components"
Cohesion: 0.09
Nodes (11): DeleteMemberFormProps, LoginFormProps, MemberFormProps, PresenceFormProps, Member, Presence, MemberTableProps, PresenceTableProps (+3 more)

### Community 6 - "Admin Session & Config"
Cohesion: 0.10
Nodes (26): api/auth/login action, api/auth/logout action, api/config action (start/stop), api/config loader, Dashboard Page, ReportsTab, SettingsTab, Dashboard Login Page (+18 more)

### Community 7 - "NPM Dependencies"
Cohesion: 0.08
Nodes (23): dependencies, exceljs, @fortawesome/fontawesome-svg-core, @fortawesome/free-solid-svg-icons, @fortawesome/react-fontawesome, isbot, @libsql/client, lucide (+15 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, esModuleInterop, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 9 - "Authentication Flow"
Cohesion: 0.23
Nodes (11): action(), action(), loader(), loginAdmin(), action(), loader(), createUserSession(), getSession() (+3 more)

### Community 10 - "Roll Call & Members"
Cohesion: 0.17
Nodes (13): action(), loader(), addMember(), getAllMembers(), getMemberByNameAndPrenom(), loader(), CATEGORIE_COLORS, CATEGORIE_LABELS (+5 more)

### Community 11 - "Build Dev Dependencies"
Cohesion: 0.13
Nodes (15): devDependencies, autoprefixer, postcss, @react-router/dev, tailwindcss, @tailwindcss/postcss, @tailwindcss/vite, @types/better-sqlite3 (+7 more)

## Ambiguous Edges - Review These
- `VisiteurForm` → `api/presences action`  [AMBIGUOUS]
  app/routes/home.tsx · relation: references

## Knowledge Gaps
- **130 isolated node(s):** `name`, `private`, `type`, `build`, `dev` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `VisiteurForm` and `api/presences action`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getAllMembers` connect `DB CRUD & Forms` to `UI Patterns & Tables`, `Admin Session & Config`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `getAllMembers()` connect `Roll Call & Members` to `Server Route Handlers`, `App Shell & Context`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `name`, `private`, `type` to the rest of the system?**
  _133 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Server Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.07886904761904762 - nodes in this community are weakly interconnected._
- **Should `App Shell & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05853174603174603 - nodes in this community are weakly interconnected._
- **Should `Presence Approaches & Schema Design` be split into smaller, more focused modules?**
  _Cohesion score 0.06439393939393939 - nodes in this community are weakly interconnected._