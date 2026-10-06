"use client";

import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/appStore";
import { TwinAvatar } from "./TwinAvatar";
import { Toaster } from "./toast";

export function Providers({ children }: { children: ReactNode }) {
  const status = useAppStore((s) => s.status);
  const hydrate = useAppStore((s) => s.hydrate);
  const reduceMotion = useAppStore((s) => s.data.settings.reduceMotion);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion);
  }, [reduceMotion]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3" aria-busy="true">
        <TwinAvatar color="violet" size={96} label="" />
        <p className="font-bold text-muted">Loading Infit…</p>
      </div>
    );
  }
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
