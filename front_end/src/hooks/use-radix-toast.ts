import { createContext, useContext } from "react";

export type ToastPayload = {
  title: string;
  description?: string;
};

type ToastContextType = {
  showToast: (payload: ToastPayload) => void;
};

export const ToastContext = createContext<ToastContextType | null>(null);

export const useRadixToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useRadixToast must be used inside ToastProvider");
  }
  return ctx;
};