import { createCookieSessionStorage, redirect } from "react-router";

// Configuration du session storage
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
    sameSite: "lax",
    secrets: ["presence-culte-secret-key-change-in-production"],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function createUserSession(username: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  session.set("username", username);
  session.set("isLoggedIn", true);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
}

export async function getUserFromSession(request: Request) {
  const session = await getSession(request);
  const username = session.get("username");
  const isLoggedIn = session.get("isLoggedIn");
  
  if (!isLoggedIn || !username) {
    return null;
  }
  
  return { username };
}

export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);
  if (!user) {
    throw redirect("/dashboard/login");
  }
  return user;
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/dashboard/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}


