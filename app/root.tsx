import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import type { Route } from "./+types/root";
import "./app.css";
import { ModalProvider } from "~/context/ModalContext";
import MemberEditModal from "~/components/modals/MemberEditModal";
import PresenceEditModal from "~/components/modals/PresenceEditModal";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  // Font Awesome (CDN) - provides classic CSS classes like `fa-solid fa-user`
  {
    rel: "stylesheet",
    href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  },
  // Favicon declarations to prevent 404 errors
  {
    rel: "icon",
    href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🙏</text></svg>",
  },
  {
    rel: "apple-touch-icon",
    href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🙏</text></svg>",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
          {children}
          {/* Inline script: provide functions to lock/unlock page scrolling */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(){
                  if (typeof window === 'undefined') return;

                  var __scrollLock = {
                    locked: false,
                    scrollY: 0,
                    prevBodyStyles: null
                  };

                  function lockPageScroll(){
                    if(__scrollLock.locked) return;
                    __scrollLock.scrollY = window.scrollY || window.pageYOffset || 0;
                    // store previous inline styles we will override
                    __scrollLock.prevBodyStyles = {
                      overflow: document.body.style.overflow,
                      position: document.body.style.position,
                      top: document.body.style.top,
                      width: document.body.style.width
                    };
                    // apply lock styles
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.top = '-' + __scrollLock.scrollY + 'px';
                    document.body.style.width = '100%';
                    __scrollLock.locked = true;
                  }

                  function unlockPageScroll(){
                    if(!__scrollLock.locked) return;
                    // restore inline styles
                    if(__scrollLock.prevBodyStyles){
                      document.body.style.overflow = __scrollLock.prevBodyStyles.overflow || '';
                      document.body.style.position = __scrollLock.prevBodyStyles.position || '';
                      document.body.style.top = __scrollLock.prevBodyStyles.top || '';
                      document.body.style.width = __scrollLock.prevBodyStyles.width || '';
                    } else {
                      document.body.style.overflow = '';
                      document.body.style.position = '';
                      document.body.style.top = '';
                      document.body.style.width = '';
                    }
                    // restore scroll position
                    var y = __scrollLock.scrollY || 0;
                    window.scrollTo(0, y);
                    __scrollLock.locked = false;
                  }

                  // Expose functions globally
                  window.lockPageScroll = lockPageScroll;
                  window.unlockPageScroll = unlockPageScroll;

                  // Optionally prevent accidental page scroll on load
                  window.addEventListener('load', function(){ if(window.scrollY>0) window.scrollTo(0,0); });
                })();
              `,
            }}
          />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ModalProvider>
      <Outlet />
      <MemberEditModal />
      <PresenceEditModal />
    </ModalProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "Une erreur inattendue s'est produite.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Erreur";
    details =
      error.status === 404
        ? "La page demandée n'a pas été trouvée."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-[#ffebee] rounded-full flex items-center justify-center mx-auto mb-4">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-8 h-8 text-[#c62828]" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">{message}</h1>
        <p className="text-gray-600 mb-4">{details}</p>
        {stack && (
          <pre className="text-left text-xs bg-gray-100 p-4 rounded overflow-auto max-h-40">
            <code>{stack}</code>
          </pre>
        )}
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-[#4a2b87] text-white rounded-lg hover:bg-[#3a2070] transition-colors"
        >
          Retour à l'accueil
        </a>
      </div>
    </main>
  );
}
