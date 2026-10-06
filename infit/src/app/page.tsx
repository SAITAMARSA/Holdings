"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";

export default function Home() {
  const router = useRouter();
  const completed = useAppStore((s) => s.data.onboarding.completed);
  useEffect(() => {
    router.replace(completed ? "/today" : "/welcome");
  }, [completed, router]);
  return null;
}
