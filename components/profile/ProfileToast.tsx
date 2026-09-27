"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ProfileToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function ProfileToast({ toast, onClose }: ProfileToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-6 right-6 z-[99999] max-w-md pointer-events-auto"
        >
          <div
            className={`flex items-start gap-3 rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all ${
              toast.type === "success"
                ? "bg-white/95 border-emerald-200 text-emerald-950 shadow-emerald-900/5"
                : toast.type === "error"
                ? "bg-white/95 border-rose-200 text-rose-950 shadow-rose-900/5"
                : "bg-white/95 border-blue-200 text-blue-950 shadow-blue-900/5"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === "success" && (
                <div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
              )}
              {toast.type === "error" && (
                <div className="p-1 rounded-full bg-rose-100 text-rose-600">
                  <AlertCircle className="size-4" />
                </div>
              )}
              {toast.type === "info" && (
                <div className="p-1 rounded-full bg-blue-100 text-blue-600">
                  <Info className="size-4" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              {toast.title && (
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-70">
                  {toast.title}
                </p>
              )}
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close notification"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
