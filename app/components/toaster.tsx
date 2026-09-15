"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

type ToastKind = "success" | "error";
type ToastAction = { label: string; onClick: () => void };

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
  action?: ToastAction;
};

type ToastContextValue = {
  show: (kind: ToastKind, message: string, action?: ToastAction) => void;
  dismiss: (id: number) => void;
};

const TOAST_DURATION_MS = 4500;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string, action?: ToastAction) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, kind, message, action }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6"
        role="region"
        aria-label="Notifications"
        aria-live="polite">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const isError = toast.kind === "error";
  return (
    <div
      className={`[animation:toast-in_0.25s_cubic-bezier(.16,1,.3,1)] pointer-events-auto flex items-start gap-3 border px-4 py-3 text-xs shadow-[0_10px_30px_rgba(20,37,29,.14)] sm:text-[13px] ${isError ? "border-[#eec4bc] bg-[#fdf2ef] text-[#8e2f28]" : "border-[#bfe3d1] bg-[#f0faf4] text-[#0b6b49]"}`}>
      {isError ? (
        <FiAlertCircle className="mt-px shrink-0 text-base" aria-hidden="true" />
      ) : (
        <FiCheckCircle className="mt-px shrink-0 text-base" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="leading-relaxed">{toast.message}</p>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action!.onClick();
              onDismiss();
            }}
            className="mt-1.5 font-bold text-[#14251d] underline underline-offset-2 hover:opacity-70">
            {toast.action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="grid shrink-0 place-items-center rounded-sm p-1 text-current opacity-70 transition hover:bg-black/5 hover:opacity-100">
        <FiX className="text-sm" aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToasterProvider");
  }
  return {
    toast: context.show,
    success: (message: string, action?: ToastAction) =>
      context.show("success", message, action),
    error: (message: string) => context.show("error", message),
  };
}