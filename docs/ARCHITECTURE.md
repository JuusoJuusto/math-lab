# Architecture

## Overview

MathLab is a client-interactive Next.js application exported as a static site. The first release deliberately has no application server, user accounts or remote database.

## Runtime structure

- `app/layout.tsx` defines the document language, global fonts, metadata and shared stylesheets. `app/page.tsx` only renders `<App />`.
- `app/globals.css` is the design system: tokens, shell, cards, buttons, practice screens. `app/solver.css` styles the equation solver and is scoped under `.solver`.
- `components/app/App.tsx` is the application shell. It reads the current screen from the address (`hooks/useRoute.ts`), renders the header, the screen and the footer, and moves focus and scroll when the screen changes.
- `components/shell/` the header (pill navigation, level coin, phone menu), the logo and the footer.
- `components/screens/` the home, learn, lesson, practice hub, progress and solver screens.
- `components/practice/` practice sessions: the task card for every kind of task, the session runner and the results.
- `components/solver/` the equation solver interface. See [the equation solver](EQUATION_SOLVER.md).
- `components/ui/` shared pieces: module and mode cards, the maths line renderer, the Lucide icon map.
- `content/` the topic catalogue (`topics.ts`) and the fixed quiz questions (`questions.ts`), separate from presentation.
- `lib/equations/` the equation engine: exact arithmetic, parsing, validated operations, solving, the tutor, the session state machine and the level catalogue.
- `lib/tasks/` the practice task generators, grading and session builder. See [practice](PRACTICE.md).
- `lib/routes.ts`, `lib/progress.ts` and `hooks/` addresses, saved progress and the hooks that connect them to the browser.
- `public/` static assets. `docs/` documentation.

```text
address (#/practice/exam?...) ──► useRoute ──► App ──► screen
                                                       │
content/ (topics, quiz) ───────────────────────────────┤
lib/tasks (generate, grade) ──► practice components ◄──┤
lib/equations (engine) ──► solver components ◄─────────┘
                    │
        hooks/useProgress ◄──► lib/progress ◄──► localStorage
```

Two rules keep this maintainable. **Mathematics lives in `lib/equations/` and `lib/tasks/`; components only present it.** A component never decides whether an answer is correct; it asks the engine. And **every icon is a Lucide icon**; a test fails if an emoji or a text symbol is used as an icon.

## Navigation

Screens are addressed with the URL hash (`#/learn/two-step`, `#/practice/exam?topic=both&n=20&seed=5`). Going to a screen adds a history entry, so the browser's Back button and the phone's back gesture work; a refresh or a shared link returns to the same screen. The server render and the first client render both show the home screen, so there is no hydration mismatch. See `lib/routes.ts` and `hooks/useRoute.ts`.

## Learning flow

1. The home screen introduces MathLab, its **Start learning** button opens the first solver level that is not finished, and its cards lead to topics and to the ten ways to practise.
2. A topic lesson presents concise key ideas. Topics with a solver offer **Solve step by step**; every topic offers varied practice.
3. The equation solver takes a learner through a level: learn, worked example, practice round and completion.
4. Practice sessions mix kinds of task (typed answers, true or false, which step, find the mistake, write the equation, multiple choice), explain every answer and record XP.
5. Missed tasks wait in a queue to be retried, and the progress screen shows accuracy by topic and by type of task.

## Topics

| Id | Topic | Interactive solver level |
| --- | --- | --- |
| `basics` | Understanding equations | – |
| `one-step` | One-step equations | Level 1 |
| `two-step` | Two-step equations | Level 2 |
| `both` | Variables on both sides | Level 3 |
| `brackets` | Equations with brackets | – |
| `proportion` | Proportional relationships | – |
| `word` | Word problems | – |

Topic ids are stored in learners' browsers, so they are stable. The former combined topic `simple` was split into `one-step` and `two-step`; stored progress for `simple` is mapped to `one-step`.

## Equation engine

Summary only; [EQUATION_SOLVER.md](EQUATION_SOLVER.md) has the details.

- **Exact numbers.** Every value is a fraction of two safe integers. There is no floating point, so there are no display errors, and equality is exact.
- **One way to change an equation.** `applyOperation` applies the same operation to both sides, rejects operations that would break the equation (divide by zero, multiply by zero, multiply or divide by an x term) and verifies that the solution did not change.
- **A tutor, not a script.** `evaluateMove` accepts any valid move that gets closer to a solution and explains moves that do not.
- **A pure state machine.** `sessionReducer` models apply, simplify, hint, undo, restart and check. The UI dispatches actions and renders the state.

## State and persistence

The application state is held in React state. Aggregate progress is saved in browser `localStorage` under the versioned key `mathlab:progress:v1`, exposed to React through `useSyncExternalStore` in `hooks/useProgress.ts`. The server render uses empty progress and the client switches to the stored value, so the static HTML and the first client render always agree.

Stored fields:
- `completed`: topic identifiers whose older quiz round a learner has finished.
- `attempts`, `correct`: practice answers given and how many were right.
- `byTopic`, `byGroup`: the same tallies per topic and per type of task.
- `solverLevels`: equation solver levels the learner has finished.
- `xp`: experience points; every 100 is a level.
- `missed`: recipes (kind, topic, seed) of tasks answered wrongly, newest first, at most 30.
- `dailyDone`, `bestTime`: the date of the last daily challenge and the best time attack score.

Storage is optional. If browser storage is unavailable, full or contains invalid data, the app continues with empty or in-memory progress. Changes made in another tab are picked up. No password, personal profile or authentication token is collected.

The key remains `v1` because every change so far is additive and old data is read correctly (see `lib/progress.ts`).

## Static delivery

Next.js uses `output: "export"` to create the `out/` directory. Wrangler serves and deploys that directory as Cloudflare static assets. Client-side learning interactions run in the browser. The solver adds no backend, database or network request.

## Testing

Vitest runs two projects (see `vitest.config.mts`): `engine` (Node) for `lib/` and `content/`, and `ui` (jsdom) for components and hooks, including an end-to-end suite for the whole app. `npm test` runs both. CI runs lint, type checks, tests and the production build.

## Design references

MathLab is built to look and feel like the author's GeoMaster and MasterModus learning apps: sky-blue stripes, a chunky outlined wordmark with a round logo mark, white pill navigation with a yellow level coin, white rounded cards, big uppercase teal buttons with a darker bottom edge, coloured cards with a darker label band, and varied "play" modes with numbered answers. The values (colours, radius, shadows, fonts) were measured from those apps and live as tokens at the top of `app/globals.css`. Toporopa is a reference for direct exercise discovery. MathLab uses its own code, copy, examples and visual assets.
