"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useRouter } from "next/navigation";
import { acceptCheckIn, currentCheckIn, dismissCheckIn, snoozeCheckIn } from "@/domain/checkins";
import { now, useAppStore } from "@/store/appStore";
import { toast } from "./toast";
import { Button, Card } from "./ui";

/** Shows at most one contextual question, with accept / later / dismiss. */
export function CheckInCard({ today }: { today: string }) {
  const router = useRouter();
  const data = useAppStore((s) => s.data);
  const update = useAppStore((s) => s.update);
  const checkIn = currentCheckIn(data, today, now());
  if (!checkIn) return null;

  const accept = () => {
    if (checkIn.effect.type === "navigate") {
      // Navigation-only check-ins record the answer; the change itself is
      // still previewed and accepted on the destination screen.
      update((d) => acceptCheckIn(d, checkIn.kind, today, now()));
      router.push(checkIn.effect.href);
    } else {
      update((d) => acceptCheckIn(d, checkIn.kind, today, now()));
      toast("Updated your plan");
    }
  };

  return (
    <Card className="border-2 border-aqua-200 bg-aqua-50" aria-labelledby="checkin-q">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-aqua-600 text-white" aria-hidden>
          <MessageCircleQuestion className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-aqua-800">Coach check-in</p>
          <h2 id="checkin-q" className="mt-0.5 font-extrabold">
            {checkIn.question}
          </h2>
          <p className="mt-1 text-sm text-aqua-800">{checkIn.detail}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="aqua" onClick={accept}>
          {checkIn.acceptLabel}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => update((d) => snoozeCheckIn(d, checkIn.kind, now()))}>
          Later
        </Button>
        <Button size="sm" variant="ghost" onClick={() => update((d) => dismissCheckIn(d, checkIn.kind, now()))}>
          No thanks
        </Button>
      </div>
    </Card>
  );
}
