import { Link, useLocation } from 'react-router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartBar, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  onLogout?: () => void
  showLogout?: boolean
}

export default function Header({ onLogout, showLogout = false }: HeaderProps) {
  const location = useLocation();
  const isOnHome = location.pathname === '/';

  // Style commun pour les boutons/liens (aligné avec le composant Button)
  const baseButtonStyles = `
    inline-flex items-center justify-center gap-2
    border-none rounded-lg
    py-3 px-5 sm:py-2 sm:px-3
    font-medium text-sm sm:text-sm
    cursor-pointer transition-all duration-200
    active:scale-[0.98]
    shadow-sm hover:shadow-md
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7c3aed]
    no-underline
  `;

  // Style pour le bouton principal (violet)
  const primaryLinkClass = `
    ${baseButtonStyles}
    bg-[#4a2b87] text-white hover:bg-[#3a2070]
  `;

  // Style pour le bouton de déconnexion (rouge)
  const logoutButtonClass = `
    ${baseButtonStyles}
    bg-[#d32f2f] text-white hover:bg-[#b71c1c]
  `;

  return (
    <header className="relative mb-0 flex items-center justify-between">
      {/* Bouton gauche */}
      <div className="flex-1">
        {isOnHome ? (
          <Link
            to="/dashboard"
            target="_blank"
            className={primaryLinkClass}
            aria-label="Accéder au dashboard"
          >
            <FontAwesomeIcon icon={faChartBar} className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        ) : (
          <Link
            to="/"
            // target="_blank"
            className={primaryLinkClass}
            aria-label="Retour à l'accueil"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        )}
      </div>

      {/* Logo - centré */}
      <img
        className="logo w-16 inline-block flex-shrink-0 mx-2 drop-shadow-md hover:drop-shadow-lg transition-all duration-300"
        src="https://image2url.com/images/1764243038241-9886220a-7dd9-4dc5-a8e7-8ded2d536163.png"
        alt="Logo"
      />

      {/* Bouton droite - Déconnexion */}
      <div className="flex-1 flex justify-end">
        {showLogout && (          
          <Link
            to="/api/auth/logout"
            className={logoutButtonClass}
            aria-label="Déconnexion"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Link>
        )}
      </div>
    </header>
  );
}
