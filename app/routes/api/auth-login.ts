import { loginAdmin } from "~/db/database.server";
import { createUserSession } from "~/utils/session.server";
import type { Route } from "./+types/auth-login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return Response.json(
      { error: "Nom d'utilisateur et mot de passe requis" },
      { status: 400 }
    );
  }

  const admin = loginAdmin(username, password);
  
  if (admin) {
    return createUserSession(admin.username, "/dashboard");
  } else {
    return Response.json(
      { error: "Nom d'utilisateur ou mot de passe incorrect" },
      { status: 401 }
    );
  }
}


