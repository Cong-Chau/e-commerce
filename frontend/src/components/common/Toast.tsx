/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (message: string, type: ToastType) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), type === "error" ? 5000 : 3000);
    },
    [dismiss],
  );

  const ctx: ToastContextValue = {
    success: (msg) => add(msg, "success"),
    error:   (msg) => add(msg, "error"),
    info:    (msg) => add(msg, "info"),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

const ICON: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} strokeWidth={2} className="text-emerald-500 dark:text-emerald-400 shrink-0" />,
  error:   <XCircle      size={15} strokeWidth={2} className="text-signal shrink-0" />,
  info:    <Info         size={15} strokeWidth={2} className="text-ink/40 dark:text-canvas/40 shrink-0" />,
};

function ToastList({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-2.5 py-3 rounded-xl bg-canvas dark:bg-[#1C1C1A] border border-ink/10 dark:border-canvas/10 shadow-lg w-72 text-sm font-medium text-ink dark:text-canvas"
          >
            {ICON[t.type]}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-ink/8 dark:hover:bg-canvas/8 transition-colors shrink-0"
            >
              <X size={11} strokeWidth={2.5} className="text-ink/40 dark:text-canvas/40" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
