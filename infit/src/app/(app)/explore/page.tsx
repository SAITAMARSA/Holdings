"use client";

import { Bookmark, BookmarkCheck, Camera, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/toast";
import { Badge, Button, Card, Chip, EmptyState, Notice, PageHeader, Sheet } from "@/components/ui";
import { DEFAULT_FILTERS, filterListings, SAMPLE_LISTINGS, type ListingFilters } from "@/domain/explore";
import { useAppStore } from "@/store/appStore";

export default function ExplorePage() {
  const saved = useAppStore((s) => s.data.explore.saved);
  const update = useAppStore((s) => s.update);
  const [filters, setFilters] = useState<ListingFilters>(DEFAULT_FILTERS);
  const [localOpen, setLocalOpen] = useState(false);
  const list = filterListings(SAMPLE_LISTINGS, filters, saved);
  const set = <K extends keyof ListingFilters>(k: K, v: ListingFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));

  const toggleSave = (id: string, title: string) => {
    const isSaved = saved.includes(id);
    update((d) => ({
      ...d,
      explore: { saved: isSaved ? d.explore.saved.filter((x) => x !== id) : [...d.explore.saved, id] },
    }));
    toast(isSaved ? `Removed “${title}”` : `Saved “${title}”`);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Explore" subtitle="Clubs, classes and events to try alongside your plan." />

      <Notice tone="demo" title="Sample listings">
        These are made-up examples that show how Explore will work. They aren&apos;t real, current or near you, and no listing data source is
        connected yet.
      </Notice>

      <Button variant="secondary" onClick={() => setLocalOpen(true)}>
        <MapPin className="size-5" aria-hidden /> Find options near me
      </Button>

      <div className="flex flex-col gap-3" role="group" aria-label="Filters">
        <FilterRow label="Type">
          {(
            [
              ["all", "All"],
              ["club", "Clubs"],
              ["class", "Classes"],
              ["event", "Events"],
            ] as const
          ).map(([v, l]) => (
            <Chip key={v} selected={filters.type === v} onClick={() => set("type", v)}>
              {l}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Setting">
          {(["all", "indoor", "outdoor"] as const).map((v) => (
            <Chip key={v} selected={filters.setting === v} onClick={() => set("setting", v)} className="capitalize">
              {v === "all" ? "Any" : v}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow label="Cost">
          {(["all", "free", "paid"] as const).map((v) => (
            <Chip key={v} selected={filters.cost === v} onClick={() => set("cost", v)} className="capitalize">
              {v === "all" ? "Any" : v}
            </Chip>
          ))}
        </FilterRow>
        <div className="flex flex-wrap gap-2">
          <Chip selected={filters.beginnerOnly} onClick={() => set("beginnerOnly", !filters.beginnerOnly)}>
            Beginner friendly
          </Chip>
          <Chip selected={filters.savedOnly} onClick={() => set("savedOnly", !filters.savedOnly)}>
            Saved ({saved.length})
          </Chip>
          {JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) && (
            <Button size="sm" variant="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <p className="text-sm font-bold text-muted" aria-live="polite">
        {list.length} sample listing{list.length === 1 ? "" : "s"}
      </p>

      {list.length === 0 ? (
        <EmptyState title={filters.savedOnly && saved.length === 0 ? "Nothing saved yet" : "No listings match"}>
          {filters.savedOnly && saved.length === 0 ? "Tap the bookmark on a listing to save it here." : "Try removing a filter."}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((l) => {
            const isSaved = saved.includes(l.id);
            return (
              <li key={l.id}>
                <Card className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-sunken text-2xl" aria-hidden>
                      {l.emoji}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSave(l.id, l.title)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? `Unsave ${l.title}` : `Save ${l.title}`}
                      className="flex size-11 items-center justify-center rounded-2xl text-brand-700 hover:bg-brand-50"
                    >
                      {isSaved ? <BookmarkCheck className="size-6 fill-brand-200" /> : <Bookmark className="size-6" />}
                    </button>
                  </div>
                  <h2 className="mt-2 font-extrabold">{l.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-muted">{l.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge tone="neutral">Sample</Badge>
                    <Badge tone="brand">{l.activity}</Badge>
                    <Badge tone="aqua">{l.cost === "free" ? "Free" : "Paid"}</Badge>
                    {l.beginnerFriendly && <Badge tone="mint">Beginner friendly</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {l.pattern} · {l.setting}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/explore/camera" className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-line p-4 hover:border-brand-300">
        <Camera className="size-6 text-brand-700" aria-hidden />
        <span className="flex-1">
          <span className="block font-extrabold">Camera coaching</span>
          <span className="block text-sm text-muted">A preview of a possible future feature.</span>
        </span>
        <ChevronRight className="size-5 text-muted" aria-hidden />
      </Link>

      <Sheet open={localOpen} onOpenChange={setLocalOpen} title="Local search isn't connected yet">
        <p className="text-muted">
          We don&apos;t have a real source of local clubs and events yet, so we haven&apos;t asked for your location. When local search is
          available, we&apos;ll only ask for your location when you choose to search, and you&apos;ll be able to type a town instead.
        </p>
        <Button className="mt-4 w-full" onClick={() => setLocalOpen(false)}>
          Got it
        </Button>
      </Sheet>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="w-16 text-sm font-bold text-muted">{label}</span>
      {children}
    </div>
  );
}
