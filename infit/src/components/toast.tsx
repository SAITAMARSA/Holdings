"use client";

import { CheckCircle2 } from "lucide-react";
import { create } from "zustand";

interface Toast {
  id: number;
  text: string;
}

const useToasts = create<{ toasts: Toast[]; push: (text: string) => void; remove: (id: number) => void }>((set) => ({
  toasts: [],
  push: (text) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Only call after an action has actually succeeded. */
export const toast = (text: string) => useToasts.getState().push(text);

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex animate-rise items-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-lg"
        >
          <CheckCircle2 className="size-5 text-aqua-300" aria-hidden />
          {t.text}
        </div>
      ))}
    </div>
  );
}
