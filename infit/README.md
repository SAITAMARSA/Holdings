# Infit

**Your fitness routine adapts with your life.**

Infit is a mobile-first web prototype of an AI fitness service with two companions:

- **Coach** — practical planning, explanations and adjustments.
- **Fitness Twin** — a customisable companion that follows the same plan as you, offers fair, friendly competition, and celebrates showing up.

It is built for beginners who need confidence and simple steps, and for people who already train and want structure, progression and accountability.

> This first version runs entirely locally. It needs no account, credentials or paid services. The coach uses **scripted demo responses**, not live AI.

---

## Quick start

Requires Node.js 20.9 or later.

```sh
cd infit
npm install
npm run dev          # http://localhost:3000
```

From the welcome screen you can either set up your own plan (about a minute) or choose **Explore the demo first**. The demo loads sample data, stored separately from your own.

### Scripts

| Command             | What it does                                                          |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | Development server                                                     |
| `npm run build`     | Production build                                                       |
| `npm start`         | Serve the production build                                             |
| `npm run check`     | Typecheck + lint + unit tests                                          |
| `npm test`          | Unit tests (Vitest) for the domain logic, storage and coach            |
| `npm run test:e2e`  | End-to-end tests (Playwright) on phone and desktop viewports. Builds and starts the app on port 3100 |
| `npm run format`    | Prettier                                                               |

End-to-end tests use Chromium. If you don't already have it, run `npx playwright install chromium` once. If Chromium is already installed elsewhere, set `PW_CHROMIUM_PATH` to its executable.

### Environment variables

None are required. See [`.env.example`](.env.example):

| Variable          | Default | Purpose                                                                                       |
| ----------------- | ------- | --------------------------------------------------------------------------------------------- |
| `COACH_PROVIDER`  | `demo`  | `demo` uses the scripted coach. `live` is reserved for a real model provider: it isn't implemented yet and falls back to demo with a notice. |
| `COACH_API_KEY`   | —       | Server-only key for a future live provider. Never prefix it with `NEXT_PUBLIC_`.              |

---

## What's in the app

| Area              | Highlights                                                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Onboarding**    | One question at a time, with back navigation and progress saved after each answer; a review screen with editable answers; optional limitations with a clear "skip". |
| **Today**         | Greeting and Twin message, today's workout or rest day, time and purpose, **Start** and **Adjust today**, the weekly schedule, a meal idea, and at most one check-in. |
| **Adjust today**  | Seven reasons, each with only the follow-up it needs, then a preview of what changed, why, the new duration and what's preserved. You choose "just today" or "from now on"; nothing applies until you accept. |
| **Workout**       | How-to steps and equipment, planned sets and reps, editable reps and load, explicit set completion with undo, a rest timer (+30s, skip), pause and resume, replace exercise, a pain check-in, partial finish and a difficulty check. Survives refresh and backgrounding. |
| **Twin**          | Colour and nickname, expressions, supportive and friendly-race modes, a weekly challenge, clearly explained points, and unlockable cosmetic accessories. |
| **Coach**         | Chat with quick actions. Structured actions only open previews. **What your coach knows** lets you view, edit and delete remembered preferences. |
| **Progress**      | Consistency, performance and personal feedback kept separate; a weekly review with a proposed next step; permanent milestones; an optional fresh baseline; session and plan-change history. |
| **Meals**         | Budget, currency, people, diet, allergies, cooking time and pantry. Curated ideas with safe substitutions, a combined shopping list, and labelled estimates. |
| **Explore**       | Clearly labelled sample clubs, classes and events, with filters and saving. No location request. |
| **Camera coaching** | A preview page only. The camera is never accessed. |
| **Settings**      | Edit every onboarding answer (experience and detail level are separate), equipment, reduce motion, export JSON, reset, and exit demo. |

---

## Architecture

```
src/
  domain/      Pure, framework-free TypeScript: the product rules
    schema.ts      Zod schemas → all typed models + persisted-data validation
    plan.ts        Plan generation, time-fitting, "what's planned on date X"
    adjust.ts      Adjust today: proposeAdjustment() → Proposal → applyProposal()
    session.ts     Active workout state machine (wall-clock timers)
    rewards.ts     Idempotent Twin points ledger + accessories
    progress.ts    Week status, consistency, performance trends, weekly review
    checkins.ts    Contextual check-ins with snooze/cooldowns
    twin.ts        Twin colours and (never guilt-tripping) messages
    meals.ts       Curated meals, diet/allergy adaptation, shopping list
    explore.ts     Sample listings + filters
    exercises.ts   Curated exercise library (no video links)
    demo.ts        Demo data generated by running the real domain logic
  storage/     Persistence abstraction
    adapter.ts     StorageAdapter interface, LocalStorageAdapter, MemoryAdapter
    repository.ts  Versioned load → migrate → validate → salvage/recover
  coach/       Coach provider contract
    types.ts       CoachRequest / CoachReply / CoachAction schemas
    demoProvider.ts Deterministic scripted coach (labelled "demo")
    server/providers.ts Server-side provider selection (live provider seam)
    client.ts      Builds minimal context, calls /api/coach, validates the reply
  store/       Zustand store: holds AppData, applies pure updates, persists
  app/         Next.js App Router screens (+ /api/coach route handler)
  components/  UI primitives (Radix Dialog for accessible sheets), Twin SVG, charts
```

**Core principle:** every consequential change is a pure function of `AppData` (`(data, input, now) → data`). The UI calls these through `store.update(fn)`. This keeps the rules testable without a browser, and lets a future backend run the same logic server-side.

### Plans and revisions

- A **Plan** is versioned. It stores its generated templates and a weekday schedule, so it stays stable even if the generator changes.
- `plannedSessionFor(data, date)` is the single source of truth for what's planned on a date. Today, the week strip, the Twin and Progress all use it, so they always agree. It resolves day overrides first, then the plan version effective on that date, then any "ease back in" ramp.
- **Just today** creates a per-date override. **From now on** updates the profile, archives the current plan in `planHistory`, generates a new version from today, and adds a note to coach memory. Every acceptance records a `PlanRevision` with before and after snapshots. Today-only changes can be undone.

### AI and the coach

- The browser sends a **minimal context snapshot** (name, experience, today's session, week counts, memory notes) to `POST /api/coach`. The server validates it with Zod and picks a provider.
- Pain and medical keywords are handled deterministically **before** any provider, and always return the safety reply.
- Replies are validated against `CoachReply`. Actions are a closed set: open an Adjust preview, navigate, or *propose* a memory that the user must confirm. Model text can never write workouts or profile data.
- **Connecting a real model:** implement `createLiveProvider()` in `src/coach/server/providers.ts`. Ask for JSON matching `CoachReply`, validate it, and set `COACH_PROVIDER=live` and `COACH_API_KEY` on the server.

### Persistence

- `LocalStorageAdapter` stores one versioned JSON document per mode: `infit:user:v1` for real data and `infit:demo:v1` for the demo. Demo data never touches real data.
- On load, data is migrated (`MIGRATIONS` in `repository.ts`) and then validated against the schema:
  - **Partly invalid:** valid sections are salvaged and the rest is reset, with a notice.
  - **Unreadable:** the app starts fresh and keeps a backup copy under `…:corrupt-backup`, with a notice.
- **Path to an authenticated backend:** implement `StorageAdapter` against an API (for example `GET`/`PUT /api/me/data`) and choose it in `store/appStore.ts`. The domain and UI don't change. For multi-device sync, move from whole-document writes to per-record endpoints, keeping the reward-ledger idempotency keys as unique constraints.

---

## Capability status

| Capability | Status |
| --- | --- |
| Onboarding, plans, Adjust today, workout logging, Twin, rewards, check-ins, progress, coach memory, meal preferences, shopping list, settings, export and reset | **Working locally** (this browser only) |
| Coach replies | **Demo**: scripted, deterministic, labelled "Demo response" |
| `/api/coach` server route and provider selection | **Connected** (runs on the Next.js server; demo provider only) |
| Live AI coach | **Deferred**: interface and server seam in place; no provider implemented |
| Meal costs and nutrition | **Estimates**: fixed reference prices and currency multipliers, not live prices; nutrition unverified |
| Explore listings | **Sample data**: fictional, with no dates or locations |
| Local search and location | **Deferred**: location is never requested |
| Camera coaching | **Deferred**: preview page only, no camera access |
| Accounts, sync, notifications, video demonstrations | **Deferred** |

---

## Testing

- **Unit (Vitest, 57 tests):** plan generation and time-fitting; every adjust reason; today-only vs lasting changes; revision history and undo; session timers (pause, background, extend); explicit set completion; partial and complete recording; reward idempotency and top-ups; rest days and the weekly goal; return after a break; check-in triggers, snooze and cooldowns; honest performance trends and baselines; meal diet and allergy filtering; storage migration, salvage and recovery; coach safety and provider fallback.
- **End-to-end (Playwright, 20 journeys × phone and desktop viewports):** both onboarding paths (refresh mid-way, back navigation); adjust cancel, accept and undo; lasting changes reaching coach memory; rest days; partial sessions surviving refresh, top-up rewards and idempotency; pause; return after a break (seeded data); coach memory edit and delete; pain safety flow; empty progress states; Explore filters and saving with no location access; meals; demo isolation; export and reset; corrupt-storage recovery; keyboard-only onboarding with visible focus; reduced motion (OS setting and in-app); navigation and no horizontal overflow at both sizes.

## Known limitations

- Data lives in one browser. There's no sync between tabs or devices, and clearing site data erases it (export first).
- The exercise library is small (39 movements), and it has no videos.
- Limitations filtering is coarse: it avoids exercises that heavily load a chosen area. It isn't medical advice.
- The plan generator is rule-based. Progression is suggested through the weekly review and check-ins rather than auto-applied load increases.
- The meal set is small (13 recipes). Some combinations of diet and allergies produce few or no suggestions, and the app says so.
- Desktop is a responsive layout, not a separate desktop design. There's no dark theme yet.
- Only Chromium has been tested automatically.

See [`docs/DECISIONS.md`](docs/DECISIONS.md) for the reasoning behind key choices.
