"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import Toast, { ToastType, Toast as ToastTypeDef } from "./Toast";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastTypeDef[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    resolve: (value: boolean) => void;
  } | null>(null);

  // ESC key handler to dismiss stuck dialogs
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && confirmDialog) {
        // Directly call cancel logic instead of referencing handleCancel
        const { onCancel, resolve } = confirmDialog;
        setConfirmDialog(null);
        onCancel?.();
        resolve(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [confirmDialog]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastTypeDef = { id, message, type };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmDialog) {
      const { onConfirm, resolve } = confirmDialog;
      setConfirmDialog(null);
      onConfirm();
      resolve(true);
    }
  }, [confirmDialog]);

  const handleCancel = useCallback(() => {
    if (confirmDialog) {
      const { onCancel, resolve } = confirmDialog;
      setConfirmDialog(null);
      onCancel?.();
      resolve(false);
    }
  }, [confirmDialog]);

  const showConfirm = useCallback(
    (
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmDialog({
          message,
          onConfirm: () => {
            setConfirmDialog(null);
            onConfirm();
            resolve(true);
          },
          onCancel: () => {
            setConfirmDialog(null);
            onCancel?.();
            resolve(false);
          },
          resolve,
        });
      });
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Vahvista toiminto
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Peruuta
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Vahvista
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
