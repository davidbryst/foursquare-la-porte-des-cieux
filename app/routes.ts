import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("dashboard/login", "routes/dashboard-login.tsx"),
  
  // API routes
  route("api/members", "routes/api/members.ts"),
  route("api/members/:id", "routes/api/members-id.ts"),
  route("api/presences", "routes/api/presences.ts"),
  route("api/presences/:id", "routes/api/presences-id.ts"),
  route("api/auth/login", "routes/api/auth-login.ts"),
  route("api/auth/logout", "routes/api/auth-logout.ts"),

  // Nouvelles routes
  route("api/visitors", "routes/api/visitors.ts"),
  route("api/visitors/:id", "routes/api/visitors-id.ts"),
  route("api/presence-unlock", "routes/api/presence-unlock.ts"),
  route("api/report", "routes/api/report.ts"),
  route("api/config", "routes/api/config.ts"),
  route("display", "routes/display.tsx"),
] satisfies RouteConfig;
