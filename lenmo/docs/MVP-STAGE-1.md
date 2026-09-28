# Lenmo — Stage 1 Foundation: decisions and status

This document records the decisions made when the master brief
(`MASTER-BRIEF.md`) was turned into a first working product. It follows the
brief's own labelling: **Core**, **Experiment**, **Future**, **Rejected**.

## Beachhead (Core)

**Grade 7–9 (CAPS Senior Phase), Mathematics and English, South Africa.**

Why this and not younger or older learners:

- Learners are old enough to type to a Twin and own a study habit, young enough
  that parents still pay and schools still procure per learner.
- Grade 9 is the last common year before subject streaming, so one curriculum
  serves the whole cohort.
- Maths and English are the two subjects with the clearest mastery ladders and
  the most measurable outcomes for a pilot.

## What is built (Core)

`app/` is a mobile-first PWA (React, TypeScript, Tailwind) plus a small Node API.

| Mode | What works today |
| --- | --- |
| Onboarding | Three steps: learner profile (name, grade, home language, subjects), Twin creation (name, colour, personality), learning preferences (explanation style, motivation, goal). |
| Learn | Twin-recommended next concept, concept list with prerequisite locking, a streamed tutoring conversation with the Twin, save-an-explanation. |
| Challenge | Per-concept and mixed rounds from the seed item bank. Every answer updates mastery. Hints and explanations on wrong answers. |
| Study | Sound → duration → topic → focus → reflect. Sounds are synthesised on-device (no downloads). Adapts: suggests 10-minute blocks after repeated early exits. |
| Progress | Concepts mastered, streak, sessions this week, recommended next, weak concepts, saved explanations, Twin editing. |

### Learner model
Stored as structured data, not chat history (brief §24): per-concept mastery
(exponential update, recent evidence weighs more), sessions, XP, saved
explanations, Twin preferences. Currently in `localStorage` on the device.
This is deliberate for Stage 1: zero backend cost, works offline, no personal
data leaves the phone. Stage 2 moves it to Supabase behind auth.

### AI architecture
- Browser never holds an API key. The PWA calls `/api/tutor`; the server calls
  Claude with the official SDK and streams text back.
- The learner model is injected as a stable system prompt (cached prefix) so
  each turn only pays for the new message.
- Effort is set to `low`: tutoring replies are short and the cost per learner
  matters more than depth. Raise per-route when measurement justifies it.
- **Mock mode**: with no `ANTHROPIC_API_KEY` the server returns deterministic
  replies, so the whole loop is testable at zero inference cost.
- Recommendation logic (what to learn next, weak spots, unlocks) runs on the
  client. The model handles conversation, not direction. That keeps inference
  cost proportional to conversation, not to navigation.

### Ownership (IKEA effect)
Twin name, colour, personality and explanation style are learner-chosen and
visible everywhere (accent colour, Twin name in the header). The Progress
screen reports the two Learning Ownership Score inputs from brief §22.

## Experiments (not yet validated)

- Mastery update rule (`alpha = 0.25`, unlock at 0.6, mastered at 0.8).
- Study Mode adaptive nudge after two early exits.
- XP values (10 per correct, 2 per attempt, 15 per completed session).
- Home-language behaviour: the prompt tells the Twin to explain in the home
  language when the learner is stuck. Needs testing with real isiZulu and
  isiXhosa speakers before we claim it works.

## Deliberately not built yet (Future)

Accounts and sync, parent and teacher views, Learning World, short-course
generator, Note Sync, study groups, payments, more grades and subjects.

## Rejected for Stage 1

- Building or fine-tuning a proprietary model.
- Streaming audio files for Study Mode (bandwidth).
- Open-ended chat with no concept context (drifts into "AI answer machine").

## Stage 2 (pilot) checklist

1. Supabase auth + Postgres for the learner model; keep the local store as the
   offline cache.
2. Analytics events: session start/complete, answer, mastery change, Twin edit.
3. Expand the item bank to at least 10 items per concept and 15 concepts per
   subject, reviewed by a CAPS-experienced teacher.
4. Pilot with 2–3 schools across different socioeconomic contexts; measure the
   Stage 2 metrics in brief §28.
5. Cost per learner per week from real usage, then set the free/premium line.

## Running it

```sh
cd lenmo/app
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY for live tutoring; leave blank for mock mode
npm run dev               # web on :5173, api on :8787
npm run build && npm start   # production: api serves the built PWA on :8787
npm run e2e               # headless browser run through the full loop (needs a running server)
```
