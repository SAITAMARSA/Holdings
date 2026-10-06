import { ArrowLeft, CameraOff, Check, X } from "lucide-react";
import type { Metadata } from "next";
import { Card, LinkButton, Notice, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Camera coaching (preview)" };

export default function CameraPreviewPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        back={
          <LinkButton href="/explore" variant="ghost" size="sm" className="-ml-3">
            <ArrowLeft className="size-5" aria-hidden /> Explore
          </LinkButton>
        }
        title="Camera coaching"
        subtitle="A preview of a possible future feature."
      />
      <Notice tone="warning" title="Not connected">
        Live movement analysis isn&apos;t available in this version. Infit does not use your camera, and this page doesn&apos;t ask for camera
        access.
      </Notice>
      <Card className="flex flex-col items-center py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-sunken text-muted" aria-hidden>
          <CameraOff className="size-8" />
        </span>
        <p className="mt-3 font-extrabold">No camera in use</p>
        <p className="mt-1 max-w-xs text-sm text-muted">If this feature is built, it will always be opt-in and you&apos;ll be asked first.</p>
      </Card>
      <Card>
        <h2 className="font-extrabold">What we&apos;re exploring</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {["Setting up your phone so your whole body is in view", "Simple on-screen reminders of the cues already in each exercise", "Processing on your device where possible"].map((t) => (
            <li key={t} className="flex gap-2">
              <Check className="size-5 shrink-0 text-mint-700" aria-hidden /> {t}
            </li>
          ))}
        </ul>
        <h2 className="mt-5 font-extrabold">What it won&apos;t claim to do</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {["Diagnose injuries or assess pain", "Guarantee correct form", "Count reps reliably enough to replace your own logging"].map((t) => (
            <li key={t} className="flex gap-2">
              <X className="size-5 shrink-0 text-coral-700" aria-hidden /> {t}
            </li>
          ))}
        </ul>
      </Card>
      <LinkButton href="/today" variant="secondary">
        Back to Today
      </LinkButton>
    </div>
  );
}
