"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    const id = Date.now().toString();
    setToasts((t) => [...t, { id, ...toast }]);
    if (toast.duration !== 0) {
      const dur = toast.duration || 4000;
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, dur);
    }
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full px-4 py-3 rounded-md shadow-lg text-sm ${
              t.variant === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`}
          >
            <div className="font-medium">{t.title}</div>
            {t.description ? <div className="text-xs opacity-90">{t.description}</div> : null}
            <div className="text-[10px] opacity-80 mt-1">{t.timestamp || ""}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
