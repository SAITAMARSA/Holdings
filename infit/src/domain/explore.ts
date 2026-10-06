/**
 * SAMPLE listings only. These are fictional examples that show how Explore
 * will work once a real data source is connected. They have no real
 * locations or dates and must never be presented as current or nearby.
 */

export type ListingType = "club" | "class" | "event";
export type ListingSetting = "indoor" | "outdoor";
export type ListingCost = "free" | "paid";

export interface Listing {
  id: string;
  title: string;
  type: ListingType;
  activity: string;
  setting: ListingSetting;
  cost: ListingCost;
  beginnerFriendly: boolean;
  /** Typical pattern, never a specific date. */
  pattern: string;
  description: string;
  emoji: string;
}

export const SAMPLE_LISTINGS: Listing[] = [
  {
    id: "sample-run-club",
    title: "Easy-pace social run club",
    type: "club",
    activity: "Running",
    setting: "outdoor",
    cost: "free",
    beginnerFriendly: true,
    pattern: "Example: weekly, early evening",
    description: "A no-drop group where everyone runs (or walks) at their own pace, followed by a chat.",
    emoji: "🏃",
  },
  {
    id: "sample-park-yoga",
    title: "Yoga in the park",
    type: "class",
    activity: "Yoga",
    setting: "outdoor",
    cost: "free",
    beginnerFriendly: true,
    pattern: "Example: weekend mornings in summer",
    description: "Gentle flow suitable for all levels. Bring a mat and water.",
    emoji: "🧘",
  },
  {
    id: "sample-strength-intro",
    title: "Intro to strength training workshop",
    type: "event",
    activity: "Strength",
    setting: "indoor",
    cost: "paid",
    beginnerFriendly: true,
    pattern: "Example: one-off, 90 minutes",
    description: "Learn the basic lifts with a coach in a small group. Ideal before your first gym visit.",
    emoji: "🏋️",
  },
  {
    id: "sample-climbing-social",
    title: "Bouldering social",
    type: "club",
    activity: "Climbing",
    setting: "indoor",
    cost: "paid",
    beginnerFriendly: true,
    pattern: "Example: weekly, weekday evening",
    description: "Climb short walls without ropes. Shoes can usually be rented; staff show you the basics.",
    emoji: "🧗",
  },
  {
    id: "sample-5k",
    title: "Community 5K fun run",
    type: "event",
    activity: "Running",
    setting: "outdoor",
    cost: "free",
    beginnerFriendly: true,
    pattern: "Example: weekly, Saturday morning",
    description: "A timed 5K you can run, jog or walk. Volunteers cheer everyone home.",
    emoji: "🎽",
  },
  {
    id: "sample-swim",
    title: "Adult improver swim sessions",
    type: "class",
    activity: "Swimming",
    setting: "indoor",
    cost: "paid",
    beginnerFriendly: true,
    pattern: "Example: weekly course, 6 weeks",
    description: "Build confidence and technique in small groups.",
    emoji: "🏊",
  },
  {
    id: "sample-cycling",
    title: "Weekend group ride",
    type: "club",
    activity: "Cycling",
    setting: "outdoor",
    cost: "free",
    beginnerFriendly: false,
    pattern: "Example: weekly, Sunday morning",
    description: "Steady 40–60 km rides with regroup stops. Some riding experience recommended.",
    emoji: "🚴",
  },
  {
    id: "sample-dance",
    title: "Dance fitness class",
    type: "class",
    activity: "Dance",
    setting: "indoor",
    cost: "paid",
    beginnerFriendly: true,
    pattern: "Example: twice weekly, evening",
    description: "Upbeat, follow-along cardio. No dance experience needed.",
    emoji: "💃",
  },
  {
    id: "sample-hike",
    title: "Hiking meetup",
    type: "event",
    activity: "Hiking",
    setting: "outdoor",
    cost: "free",
    beginnerFriendly: true,
    pattern: "Example: monthly, full day",
    description: "Moderate trails with a friendly group. Routes are shared in advance.",
    emoji: "🥾",
  },
  {
    id: "sample-lifting-club",
    title: "Strength club open session",
    type: "club",
    activity: "Strength",
    setting: "indoor",
    cost: "paid",
    beginnerFriendly: false,
    pattern: "Example: three evenings a week",
    description: "Coached barbell sessions for people who already train and want structure.",
    emoji: "🏆",
  },
];

export interface ListingFilters {
  type: ListingType | "all";
  setting: ListingSetting | "all";
  cost: ListingCost | "all";
  beginnerOnly: boolean;
  savedOnly: boolean;
}

export const DEFAULT_FILTERS: ListingFilters = {
  type: "all",
  setting: "all",
  cost: "all",
  beginnerOnly: false,
  savedOnly: false,
};

export function filterListings(list: Listing[], f: ListingFilters, saved: readonly string[]): Listing[] {
  return list.filter(
    (l) =>
      (f.type === "all" || l.type === f.type) &&
      (f.setting === "all" || l.setting === f.setting) &&
      (f.cost === "all" || l.cost === f.cost) &&
      (!f.beginnerOnly || l.beginnerFriendly) &&
      (!f.savedOnly || saved.includes(l.id)),
  );
}
