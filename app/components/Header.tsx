import { Link, useLocation } from 'react-router'
import Button from '~/components/ui/Button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartBar, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
  onLogout?: () => void
  showLogout?: boolean
}

export default function Header({ onLogout, showLogout = false }: HeaderProps) {
  const location = useLocation();
  const isOnHome = location.pathname === '/';

  const navLinkClass = "inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-1.5 text-xs sm:text-sm font-semibold bg-[#4a2b87] text-white no-underline rounded-lg transition-all hover:bg-[#5a3b97] active:bg-[#3a2070] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4a2b87] shadow-md hover:shadow-lg";

  return (
    <header className="relative mb-0 flex items-center justify-between">
      {/* Bouton gauche */}
      <div className="flex-1">
        {isOnHome && (
          <Link
            to="/dashboard"
            target="_blank"
            className={navLinkClass}
          >
            <FontAwesomeIcon icon={faChartBar} className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        )}
        {!isOnHome && (
          <Link
            to="/"
            className={navLinkClass}
            aria-label="Retour à l'accueil"
          >
            <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
            <span className="hidden sm:inline">Accueil</span>
          </Link>
        )}
      </div>

      {/* Logo - centré */}
      <img
        className="logo w-12 sm:w-14 md:w-16 inline-block flex-shrink-0 mx-2"
        src="https://image2url.com/images/1764243038241-9886220a-7dd9-4dc5-a8e7-8ded2d536163.png"
        alt="Logo"
      />

      {/* Bouton droite - Déconnexion */}
      <div className="flex-1 flex justify-end">
        {showLogout && onLogout && (
          <button
            onClick={onLogout}
            className={navLinkClass.replace("bg-[#4a2b87]", "bg-[#dc2626]").replace("hover:bg-[#5a3b97]", "hover:bg-[#ef4444]").replace("active:bg-[#3a2070]", "active:bg-[#991b1b]").replace("focus:ring-[#4a2b87]", "focus:ring-[#dc2626]")}
            type="button"
            aria-label="Déconnexion"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        )}
      </div>
    </header>
  );
}
