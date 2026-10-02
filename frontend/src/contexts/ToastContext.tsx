import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "SUCCESS" | "ERROR" | "INFO";

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => {} });

let toastSequence = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setMessages((items) => items.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = "SUCCESS") => {
      const id = toastSequence++;
      setMessages((items) => [...items, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), 4_500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col items-end gap-3 sm:left-auto sm:w-full sm:max-w-sm"
      >
        {messages.map((toast) => (
          <div
            className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-xl ${
              toast.variant === "ERROR"
                ? "border-red-200 bg-red-50 text-red-900"
                : toast.variant === "INFO"
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-indigo-200 bg-white text-slate-900"
            }`}
            key={toast.id}
            role={toast.variant === "ERROR" ? "alert" : "status"}
          >
            <span
              aria-hidden="true"
              className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-black ${
                toast.variant === "ERROR"
                  ? "bg-red-700 text-white"
                  : toast.variant === "INFO"
                    ? "bg-blue-700 text-white"
                    : "bg-indigo-700 text-white"
              }`}
            >
              {toast.variant === "ERROR"
                ? "!"
                : toast.variant === "INFO"
                  ? "i"
                  : "✓"}
            </span>
            <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-5">
              {toast.message}
            </p>
            <button
              aria-label="Cerrar notificación"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-lg leading-none hover:bg-black/5"
              onClick={() => dismiss(toast.id)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
