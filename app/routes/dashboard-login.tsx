import { Form, redirect, useActionData, useNavigation, Link } from "react-router";
import type { Route } from "./+types/dashboard-login";
import { loginAdmin } from "~/db/database.server";
import { createUserSession, getUserFromSession } from "~/utils/session.server";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

// Components
import Header from "~/components/Header";
import Input from "~/components/ui/Input";
import Button from "~/components/ui/Button";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Connexion Dashboard - Présence Culte" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) {
    throw redirect("/dashboard");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Veuillez remplir tous les champs" };
  }

  const admin = loginAdmin(username, password);

  if (admin) {
    return createUserSession(admin.username, "/dashboard");
  }

  return { error: "Nom d'utilisateur ou mot de passe incorrect" };
}

export default function DashboardLoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex justify-center items-center min-h-screen px-3 sm:px-4">
      <div className="relative flex flex-col gap-10 z-10 w-full max-w-lg min-w-[320px] p-4 sm:p-6 md:p-8 rounded-lg bg-white border border-gray-200 shadow-lg mx-auto overflow-hidden mobile-fixed-card-2">
        <Header />

        <div className="mobile-scroll-content flex-1 min-h-0 overflow-y-auto flex flex-col">
          <Form method="post" className="animate-fadeIn flex flex-col h-full flex-1 justify-between pt-4">
            <div className="flex flex-col h-full justify-around">
              <div className="text-center mb-6">
                <h1 className="text-center text-gray-800 text-lg sm:text-xl my-2 font-semibold">
                  Connexion Dashboard
                </h1>
                <p className="text-center text-gray-500 text-sm">
                  Accédez à l'espace d'administration
                </p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Nom d'utilisateur"
                  type="text"
                  name="username"
                  placeholder="Entrez votre identifiant"
                  disabled={isSubmitting}
                />

                <Input
                  label="Mot de passe"
                  type="password"
                  name="password"
                  placeholder="Entrez votre mot de passe"
                  disabled={isSubmitting}
                />
              </div>

              {actionData?.error && (
                <div className="mt-4 p-3 bg-[#ffebee] border border-[#ffcdd2] rounded-lg animate-fadeIn">
                  <p className="text-[#c62828] text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={faExclamationCircle} className="w-5 h-5" />
                    {actionData.error}
                  </p>
                </div>
              )}
            </div>

            <Button
              type="submit"
              fullWidth
              className="mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}


