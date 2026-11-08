# Architecture

## Overview

MathLab is a client-interactive Next.js application exported as a static site. The first release deliberately has no application server, user accounts or remote database.

## Runtime structure

- `app/layout.tsx` defines the document language, global fonts, metadata and shared stylesheets.
- `app/page.tsx` is the application shell. It owns navigation between views (home, topics, lesson, quiz, results, progress and the equation solver) and the state of the multiple-choice quiz.
- `app/globals.css` defines the shared visual system, responsive layouts, topic colours and exercise states.
- `app/solver.css` styles the equation solver. Everything is scoped under `.solver`.
- `components/solver/` contains the equation solver interface. See [the equation solver](EQUATION_SOLVER.md).
- `content/` holds the topic catalogue (`topics.ts`) and the multiple-choice question bank (`questions.ts`), separate from presentation.
- `lib/equations/` is the equation engine: exact arithmetic, parsing, validated operations, solving, the tutor, the session state machine and the level catalogue. It has no React or browser code.
- `lib/progress.ts` and `hooks/useProgress.ts` parse, update and store learner progress.
- `public/` contains static assets served with the exported site.
- `docs/` contains product, architecture, content and deployment documentation.

```text
app/page.tsx ──────────────┐
   │                       ▼
   │              components/solver/*  ── render ──►  lib/equations (engine)
   ▼                       │                              ▲
content/ (topics, quiz)    └── dispatch actions ──► session reducer
   ▲
   └── hooks/useProgress ◄── lib/progress ◄── localStorage
```

The rule that keeps this maintainable: **mathematics lives in `lib/equations/`, components only present it.** A component never decides whether a move is correct; it asks the engine.

## Learning flow

1. The home view introduces the learning path and displays a progress summary. Its main button opens the first solver level the learner has not finished.
2. The topic catalogue lets a learner choose a subject. Topics that have an interactive solver offer **Solve step by step** next to the quiz.
3. A topic lesson presents concise key ideas.
4. The equation solver takes a learner through a level: learn, worked example, practice round and completion.
5. A multiple-choice practice round filters the question bank to the selected topic, or uses the mixed set. Each answer is checked immediately and receives an explanation.
6. The results view summarises a quiz round and offers a retry or a route back to learning.

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
- `completed`: topic identifiers whose quiz round a learner has finished.
- `attempts`: number of submitted quiz answers.
- `correct`: number of correct quiz answers.
- `solverLevels`: identifiers of equation solver levels the learner has finished.

Storage is optional. If browser storage is unavailable, full or contains invalid data, the app continues with empty or in-memory progress. Changes made in another tab are picked up. No password, personal profile or authentication token is collected.

The key remains `v1` because every change so far is additive and old data is read correctly (see `lib/progress.ts`).

## Static delivery

Next.js uses `output: "export"` to create the `out/` directory. Wrangler serves and deploys that directory as Cloudflare static assets. Client-side learning interactions run in the browser. The solver adds no backend, database or network request.

## Testing

Vitest runs two projects (see `vitest.config.mts`): `engine` (Node) for `lib/` and `content/`, and `ui` (jsdom) for components, hooks and the page. `npm test` runs both. CI runs lint, type checks, tests and the production build.

## Design references

MathLab follows the same product direction as the author's GeoMaster and Master-Modus learning projects: clear navigation, topic-first learning, colourful flat cards, friendly display typography and immediate practice feedback. Toporopa is a reference for direct exercise discovery and low-friction interactions. MathLab uses its own code, copy, examples and visual assets.
