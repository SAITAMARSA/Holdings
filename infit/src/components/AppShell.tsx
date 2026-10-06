"use client";

import clsx from "clsx";
import { Compass, MessageCircle, Settings, Smile, Sun, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAppStore } from "@/store/appStore";
import { TwinAvatar } from "./TwinAvatar";
import { Button } from "./ui";

const NAV = [
  { href: "/today", label: "Today", icon: Sun, match: ["/today", "/adjust", "/workout", "/meals"] },
  { href: "/twin", label: "Twin", icon: Smile, match: ["/twin"] },
  { href: "/coach", label: "Coach", icon: MessageCircle, match: ["/coach"] },
  { href: "/progress", label: "Progress", icon: TrendingUp, match: ["/progress"] },
  { href: "/explore", label: "Explore", icon: Compass, match: ["/explore"] },
] as const;

export function Logo({ className }: { className?: string }) {
  const color = useAppStore((s) => s.data.twin.color);
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <TwinAvatar color={color} size={36} label="" />
      <span className="text-2xl font-black tracking-tight text-brand-700">infit</span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const completed = useAppStore((s) => s.data.onboarding.completed);
  const mode = useAppStore((s) => s.data.mode);
  const notice = useAppStore((s) => s.notice);
  const dismissNotice = useAppStore((s) => s.dismissNotice);
  const exitDemo = useAppStore((s) => s.exitDemo);
  const focusMode = pathname.startsWith("/workout");

  useEffect(() => {
    if (!completed) router.replace("/welcome");
  }, [completed, router]);

  if (!completed) return null;

  const isActive = (match: readonly string[]) => match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      {!focusMode && (
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 lg:flex">
          <Link href="/today" className="mb-8 px-2" aria-label="Infit home">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const active = isActive(match);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={clsx(
                    "flex min-h-12 items-center gap-3 rounded-2xl px-3 font-extrabold",
                    active ? "bg-brand-100 text-brand-800" : "text-muted hover:bg-sunken hover:text-ink",
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto">
            <Link
              href="/settings"
              aria-current={pathname.startsWith("/settings") ? "page" : undefined}
              className={clsx(
                "flex min-h-12 items-center gap-3 rounded-2xl px-3 font-extrabold",
                pathname.startsWith("/settings") ? "bg-brand-100 text-brand-800" : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Settings className="size-6" aria-hidden />
              Settings
            </Link>
            <p className="mt-3 px-3 text-xs text-muted">Data is stored in this browser only.</p>
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {mode === "demo" && (
          <div className="sticky top-0 z-40 flex items-center justify-between gap-3 bg-brand-700 px-4 py-2 text-sm font-bold text-white">
            <span>Demo mode — sample data, separate from your own.</span>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-9 shrink-0"
              onClick={async () => {
                await exitDemo();
                router.replace("/");
              }}
            >
              Exit demo
            </Button>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 bg-sun-100 px-4 py-3 text-sm font-bold text-sun-800"
          >
            <span>{notice}</span>
            <button type="button" className="underline" onClick={dismissNotice}>
              Dismiss
            </button>
          </div>
        )}
        <main
          id="main"
          className={clsx(
            "mx-auto w-full max-w-2xl px-4 pt-5 sm:px-6 lg:pt-10",
            pathname === "/today" && "xl:max-w-5xl",
            focusMode ? "pb-10" : "pb-28 lg:pb-12",
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile tab bar */}
      {!focusMode && (
        <nav
          aria-label="Main"
          className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-lg justify-around px-1">
            {NAV.map(({ href, label, icon: Icon, match }) => {
              const active = isActive(match);
              return (
                <li key={href} className="flex-1">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-extrabold",
                      active ? "text-brand-700" : "text-muted",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                        active && "bg-brand-100",
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
