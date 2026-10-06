"use client";

import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { X } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// ---------------------------------------------------------------- buttons

type Variant = "primary" | "secondary" | "ghost" | "aqua" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-extrabold rounded-2xl select-none transition-[transform,box-shadow,background-color] duration-100 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[2px] text-center";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-[0_4px_0_var(--color-brand-800)] hover:bg-brand-700 active:shadow-[0_2px_0_var(--color-brand-800)] disabled:active:translate-y-0",
  aqua: "bg-aqua-600 text-white shadow-[0_4px_0_var(--color-aqua-800)] hover:bg-aqua-700 active:shadow-[0_2px_0_var(--color-aqua-800)]",
  secondary:
    "bg-surface text-brand-700 border-2 border-line shadow-[0_3px_0_var(--color-line)] hover:bg-brand-50 active:shadow-[0_1px_0_var(--color-line)]",
  outline: "bg-transparent text-ink border-2 border-line hover:bg-sunken",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50 active:translate-y-0",
  danger:
    "bg-coral-500 text-white shadow-[0_4px_0_var(--color-coral-700)] hover:bg-coral-700 active:shadow-[0_2px_0_var(--color-coral-700)]",
};

const sizes: Record<Size, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}

export function IconButton({ label, className, type = "button", ...props }: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex size-11 items-center justify-center rounded-2xl text-ink hover:bg-sunken disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------- surfaces

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={clsx("rounded-3xl border border-line bg-surface p-5 shadow-card", className)} {...props} />;
}

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: "brand" | "aqua" | "sun" | "coral" | "mint" | "neutral";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    brand: "bg-brand-100 text-brand-800",
    aqua: "bg-aqua-100 text-aqua-800",
    sun: "bg-sun-100 text-sun-800",
    coral: "bg-coral-100 text-coral-700",
    mint: "bg-mint-100 text-mint-700",
    neutral: "bg-sunken text-muted",
  };
  return (
    <span
      className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold", tones[tone], className)}
    >
      {children}
    </span>
  );
}

/** A toggle chip. Use for single or multi-select option groups. */
export function Chip({ selected, className, children, role, ...props }: ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      role={role}
      aria-pressed={role ? undefined : selected}
      aria-checked={role === "radio" || role === "checkbox" ? selected : undefined}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border-2 px-4 text-sm font-bold transition-colors",
        selected
          ? "border-brand-600 bg-brand-50 text-brand-800 shadow-[0_3px_0_var(--color-brand-300)]"
          : "border-line bg-surface text-ink hover:border-brand-300",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** A large option card used in onboarding and adjust flows. */
export function OptionCard({
  selected,
  title,
  description,
  icon,
  className,
  ...props
}: Omit<ComponentProps<"button">, "title"> & {
  selected?: boolean;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected === undefined ? undefined : selected}
      className={clsx(
        "flex w-full min-h-16 items-center gap-4 rounded-3xl border-2 p-4 text-left transition-colors",
        selected
          ? "border-brand-600 bg-brand-50 shadow-[0_4px_0_var(--color-brand-300)]"
          : "border-line bg-surface shadow-[0_3px_0_var(--color-line)] hover:border-brand-300",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700" aria-hidden>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-extrabold text-ink">{title}</span>
        {description && <span className="mt-0.5 block text-sm text-muted">{description}</span>}
      </span>
    </button>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "safety" | "demo";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "bg-aqua-50 border-aqua-200 text-aqua-800",
    warning: "bg-sun-100 border-sun-300 text-sun-800",
    safety: "bg-coral-100 border-coral-500/40 text-coral-700",
    demo: "bg-brand-50 border-brand-200 text-brand-800",
  };
  return (
    <div
      role={tone === "safety" ? "alert" : undefined}
      className={clsx("rounded-2xl border-2 p-4 text-sm", tones[tone], className)}
    >
      {title && <p className="font-extrabold">{title}</p>}
      {children && <div className={clsx(title && "mt-1")}>{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-line bg-surface/60 px-6 py-8 text-center">
      {icon && (
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700" aria-hidden>
          {icon}
        </div>
      )}
      <p className="font-extrabold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-extrabold">
        {children}
      </h2>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- sheet

/** Accessible modal: bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideClose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  hideClose?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=open]:animate-[rise_0.2s_ease-out]" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-4xl bg-surface p-5 pb-8 shadow-2xl outline-none data-[state=open]:animate-rise sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(92vw,32rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-4xl"
          // No description → tell Radix explicitly rather than duplicating the title.
          {...(description ? {} : { "aria-describedby": undefined })}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          <div className="mb-3 flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-extrabold">{title}</Dialog.Title>
            {!hideClose && (
              <Dialog.Close asChild>
                <IconButton label="Close" className="-mr-2 -mt-1">
                  <X className="size-5" />
                </IconButton>
              </Dialog.Close>
            )}
          </div>
          {description && <Dialog.Description className="mb-4 text-sm text-muted">{description}</Dialog.Description>}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ---------------------------------------------------------------- stepper

export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  suffix,
  disabled,
  placeholder,
  allowEmpty,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  disabled?: boolean;
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 100) / 100));
  return (
    <div className={clsx("flex items-center rounded-2xl border-2 border-line bg-surface", disabled && "opacity-60")}>
      <button
        type="button"
        className="flex size-11 shrink-0 items-center justify-center rounded-l-2xl text-xl font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        aria-label={`Decrease ${label}`}
        disabled={disabled || (value ?? 0) <= min}
        onClick={() => onChange(clamp((value ?? 0) - step))}
      >
        −
      </button>
      <label className="flex min-w-0 flex-1 items-center justify-center">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          inputMode="decimal"
          className="tabular w-full min-w-0 bg-transparent text-center text-lg font-extrabold outline-none"
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange(allowEmpty ? null : null);
            const n = Number(raw);
            if (!Number.isNaN(n)) onChange(clamp(n));
          }}
        />
        {suffix && <span className="pr-1 text-xs font-bold text-muted">{suffix}</span>}
      </label>
      <button
        type="button"
        className="flex size-11 shrink-0 items-center justify-center rounded-r-2xl text-xl font-extrabold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
        aria-label={`Increase ${label}`}
        disabled={disabled || (value ?? 0) >= max}
        onClick={() => onChange(clamp((value ?? min) + step))}
      >
        +
      </button>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {back && <div className="mb-2">{back}</div>}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
