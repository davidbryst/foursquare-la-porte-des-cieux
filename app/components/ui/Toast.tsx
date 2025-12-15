import { useToast, type ToastType } from "~/context/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const toastStyles: Record<ToastType, { bg: string; icon: typeof faCheckCircle; iconColor: string }> = {
  success: {
    bg: "bg-green-50 border-white ring-green-200",
    icon: faCheckCircle,
    iconColor: "text-green-400 font-semibold",
  },
  error: {
    bg: "bg-red-50 border-white ring-red-300",
    icon: faExclamationCircle,
    iconColor: "text-red-400 font-semibold",
  },
  warning: {
    bg: "bg-yellow-50 border-white ring-yellow-200",
    icon: faExclamationTriangle,
    iconColor: "text-yellow-400 font-semibold",
  },
  info: {
    bg: "bg-blue-50 border-white ring-blue-200",
    icon: faInfoCircle,
    iconColor: "text-blue-400 font-semibold",
  },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 z-[9999] toast-container flex flex-col py-5 gap-2 w-full sm:right-5 sm:w-1/4 px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`${style.bg} border-8 ring-2 rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-slideInRight pointer-events-auto`}
          >
            <FontAwesomeIcon
              icon={style.icon}
              className={`${style.iconColor} w-5 h-5 flex-shrink-0 mt-0.5`}
            />
            <p className={`${style.iconColor} text-sm flex-1`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${style.iconColor} hover:text-gray-600 transition-colors`}
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Spinner component for buttons
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
    />
  );
}
