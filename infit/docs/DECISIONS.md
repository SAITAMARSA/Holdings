# Decision log

Short records of product and engineering decisions, so future work can stay coherent. Newest last. Each entry is a decision, the reason for it, and the consequences.

---

### D1 — Build Infit in `infit/`, leave PixelPort untouched
The repository already contained an unrelated static site (PixelPort) with no build tooling. Infit lives in its own Next.js project in `infit/` with its own lockfile, so neither project constrains the other.

### D2 — Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Radix primitives
This was the requested default for an empty project. Radix Dialog provides accessible modals and bottom sheets (focus trap, Escape, labelling); other controls are plain semantic HTML. The Nunito variable font is bundled via `@fontsource`, so builds need no network font fetch. Icons come from lucide-react.

### D3 — Domain logic is pure and framework-free
All product rules (plans, adjustments, rewards, check-ins, progress, meals) are pure functions over a single `AppData` document in `src/domain`. The React store only applies `(data) => data` updates and persists them. This makes the rules unit-testable and portable to a server later.

### D4 — Zod schemas are the source of truth for types and stored data
Types are inferred from schemas, and the same schemas validate localStorage on load. On failure, valid top-level sections are salvaged. If nothing is usable, the app starts fresh, keeps a backup, and tells the user why.

### D5 — Persistence behind `StorageAdapter`; demo data under a separate key
`infit:user:v1` and `infit:demo:v1` never mix. The demo is regenerated on entry, by running the real domain logic, so it reflects today's date. New users start with empty history.

### D6 — A plan is versioned and stores its generated templates
Regenerating from settings creates version N+1, effective from today. Older versions stay in `planHistory`, and past dates resolve against the version in force then. This preserves the original plan and keeps history honest when settings change.

### D7 — "Just today" vs "from now on" is always an explicit choice
When a reason can be lasting (less time, missing equipment, new gym, training at home, too hard, exercise swap, returning), the preview asks which one applies, with no default. Lasting choices update the profile, rebuild the plan, and add a visible, deletable note to coach memory. One-time actions are never remembered.

### D8 — Adjustments are coherent, not regenerative
Adjusting re-picks only the affected movement slots (same pattern, available equipment, suitable for limitations), or trims volume in a fixed order: accessories → sets → rest → secondary movements. Main (priority 1) movements are kept last. The whole programme is never replaced by an adjustment.

### D9 — Default training days are anchored to the signup day
A user who signs up on a Tuesday with 3 days a week trains Tue, Thu and Sat. The first session is available immediately ("receive a plan" → "complete a workout"), instead of landing on a rest day. Days before signup are never planned, so they never show as "not done".

### D10 — "Both" (home + gym) plans default to the gym
The home equipment profile starts as bodyweight only. Home days are handled with *Adjust → I'm training at home*, which can remember home equipment (opt-in checkbox). Detailed equipment questions are deferred until they're relevant.

### D11 — Wall-clock timers
Rest and elapsed time are stored as timestamps (`endsAt`, `pausedAt`, `pausedMs`), and the UI recomputes them on an interval and when the tab becomes visible. Refreshes, backgrounding and navigation never lose or distort time.

### D12 — Proposed values are prefilled but never recorded without a tap
Each set is prefilled from the last performance (or the target), but only sets the user explicitly marks **Done** are saved. A session with zero completed sets cannot be saved; the user can only keep going or discard. Replacing an exercise is allowed only before any of its sets are done, so recorded work is never reattributed.

### D13 — Rewards: an idempotent ledger, cosmetic only
Every award has a unique key (`session:<date>:complete|partial`, `comeback:<date>`, `week:<weekStart>`, `first-session`). The rules:
- A full session after a partial one the same day tops up the difference.
- A partial session after a full one earns nothing.
- Points are never deducted, and toggling sets earns nothing (points are only awarded on finish).
- Accessories unlock from lifetime points and stay unlocked.

Points are kept visually and conceptually separate from fitness progress.

### D14 — The Twin follows the agreed schedule
The Twin's weekly count is the number of planned days before today, plus today once the user trains. It reads the same `plannedSessionFor`, so moves, rest days and accepted adjustments apply to the Twin too. In competitive mode the user can tie the Twin but is never "punished"; messages are reviewed for guilt-free language. A pain report pauses competition for that day.

### D15 — A shortened session satisfies the revised commitment
A completed adjusted session counts as completing that day's plan (consistency and rewards), but its record stores the real planned sets and minutes, and the work done. Progress compares only actual performance of the same exercise; a lower target is never shown as improvement.

### D16 — Return after a break = 10+ days since the last session
This triggers a welcome-back check-in, an "ease back in" adjustment (optionally ramping 7 days), a one-time comeback reward, and an optional fresh progress baseline. Earlier history and milestones are kept.

### D17 — Check-ins: one at a time, with cooldowns and data freshness
Accept, Later and No thanks are always available:
- **Later** snoozes for 3 days.
- **Accept** cools down for 30 days; **dismiss** for 21 days.
- No new check-in appears within 24 hours of answering one.
- Streak-based questions only re-trigger on sessions newer than the last answer.
- Accepting applies exactly the change described in the card.

Suggested session lengths are rounded up to 5 minutes, to match the choices offered elsewhere.

### D18 — Coach: server route + provider seam; demo is deterministic and labelled
`/api/coach` validates requests and replies with Zod. Safety (pain, urgent symptoms, medical questions) short-circuits before any provider. The only actions are: open an Adjust preview, navigate, or propose a memory the user confirms. No live provider is implemented, to avoid credentials, cost and untested integration code. `COACH_PROVIDER=live` falls back to demo with a notice. If the server can't be reached, the client runs the same demo logic locally and says so.

### D19 — No inference of sensitive information
Limitations are four coarse body areas with an explicit skip, used only to filter exercises. The coach refuses to store health details ("remember that I'm pregnant" is declined, with a pointer to profile limitations). Memory contains only what the user confirmed.

### D20 — Meals: curated set, fixed reference prices, safe substitutions
Costs come from USD reference prices × fixed currency multipliers, labelled as estimates rather than live prices. Nutrition is approximate and shown only if the user opts in. Conflicting ingredients are swapped only for a substitute that passes both diet and allergy filters; otherwise the meal is excluded. Without preferences, costs are hidden and suggestions are marked "not tailored".

### D21 — Explore and camera are honest placeholders
Listings are fictional, labelled "Sample", and carry only patterns like "Example: weekly". "Find options near me" explains that local search isn't connected and does **not** request location. The camera page never requests camera access and lists what the feature won't claim to do.

### D22 — Accessibility baseline
Semantic headings and landmarks, a skip link, and focus moved to each new onboarding question. A visible 3px focus ring, touch targets of at least 44px, and `aria-pressed`/`role=radio` on chip groups. Charts are focusable bars with a tooltip and a table view. Motion respects both `prefers-reduced-motion` and an in-app setting. Brand and text colours meet WCAG AA; the chart colour (brand-600) passed lightness, chroma and contrast validation, while an aqua alternative failed the chroma floor.

### D23 — Single light theme for v1
The warm off-white brand canvas is part of the identity. A dark theme would need separately tuned tokens and is deferred.
