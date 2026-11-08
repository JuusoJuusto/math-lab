# MathLab

**Learn mathematics by doing.**

MathLab is a visual, interactive learning app for lower-secondary mathematics. It starts with equations, algebra and proportional relationships, turning each topic into a short learning path with explanations, practice and feedback.

The goal is simple: make mathematics feel clear, approachable and rewarding to practise.

<p align="center">
  <strong>Explore a topic · Understand the method · Practise · See your progress</strong>
</p>

## Learning experience

The first learning collection contains seven topics:

| Topic | What you will learn | Interactive solver |
| --- | --- | --- |
| Understanding equations | Equality, unknowns and the balance principle | |
| One-step equations | Undo one operation to isolate a variable | Level 1 |
| Two-step equations | Undo two operations, in the right order | Level 2 |
| Variables on both sides | Collect variable terms and solve | Level 3 |
| Equations with brackets | Expand brackets using the distributive property | |
| Proportional relationships | Understand direct and inverse proportion | |
| Word problems | Translate real situations into equations | |

Each topic includes a short introduction and a multiple-choice practice round. Questions provide immediate feedback and an explanation, and the results screen summarises the round.

### Equation solver

Three topics teach equation solving hands-on. In each level you learn the idea, watch a worked example, and then solve equations yourself by choosing what to do to **both sides**:

- Pick an operation and a number. A good choice is shown written on both sides in the same highlight: `2x + 5 − 5 = 17 − 5`, then simplified to `2x = 12`.
- A mistake gets an explanation and another try, never the full answer.
- Three hints reveal one at a time: what is in the way, which inverse operation to use, and a worked explanation.
- Every step is kept in a history with undo.
- At the end, check the answer by substituting it back into the original equation.

Divisions by zero and other moves that would break the equation are never accepted. See [the equation solver](docs/EQUATION_SOLVER.md) for how it works.

## Product direction

MathLab belongs to the same learning-app family as **GeoMaster** and **Master-Modus**:

- Clear, topic-first navigation.
- Colourful, flat cards and friendly display typography.
- Short, focused learning activities.
- Immediate feedback instead of silent right/wrong grading.
- Responsive layouts for phones, tablets and school computers.
- A practical interface that prioritises learning over decoration.

**Inspiration:** [Toporopa](https://www.toporopa.eu/) is a reference for direct exercise discovery and simple interactions. MathLab is an original implementation with its own code, copy, examples and visual assets.

## Screens and features

- **Home:** introduction, learning path and a quick progress overview.
- **Topics:** browse all available learning areas.
- **Lessons:** review concise explanations before practising.
- **Equation solver:** learn, see a worked example and solve equations step by step.
- **Practice:** answer multiple-choice questions with instant feedback.
- **Results:** review a completed round and retry it.
- **Progress:** see total attempts, accuracy and completed topics.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 and project CSS |
| Icons | Lucide |
| Typography | Fredoka Variable and Open Sans Variable |
| Hosting target | Cloudflare Workers static assets |
| Persistence | Browser `localStorage` |
| Tests | Vitest and React Testing Library |

The application uses Next.js static export. The first release does not require an API, database, account system or environment secrets.

## Getting started

### Requirements

- Node.js 20.9 or newer to build and run the app (Node.js 22 recommended).
- Node.js 22.22 or newer to run the test suite.
- npm.

### Install and run

```bash
git clone https://github.com/JuusoJuusto/math-lab.git
cd math-lab
npm install
npm run dev
```

Open the local URL printed by Next.js.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate Next.js types and run TypeScript |
| `npm test` | Run the unit and interaction tests once |
| `npm run test:watch` | Re-run tests when files change |
| `npm run build` | Create the production static export |
| `npm run check` | Run lint, type checking, tests and the production build |
| `npm run preview` | Build and preview the output with Wrangler |
| `npm run deploy` | Build and deploy the Worker with Wrangler |

## Project structure

```text
math-lab/
├── .github/
│   └── workflows/
│       └── ci.yml
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── not-found.tsx
│   ├── page.tsx
│   └── solver.css
├── components/
│   └── solver/            # Equation solver interface
├── content/               # Topics and quiz questions
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTENT_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── EQUATION_SOLVER.md
│   ├── README.md
│   └── ROADMAP.md
├── hooks/                 # Progress storage hook
├── lib/
│   ├── equations/         # Equation engine (no React)
│   └── progress.ts
├── public/
├── CONTRIBUTING.md
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.mts
└── wrangler.jsonc
```

See the [documentation index](docs/README.md) for architecture, content authoring, deployment and roadmap details.

## Progress and privacy

Learning progress is stored locally in the current browser using the versioned key `mathlab:progress:v1`. It is not synced between devices and is not connected to a user account.

The stored summary currently contains completed topic IDs, submitted quiz answer count and correct answer count, and the equation solver levels that have been finished. No password, profile or authentication token is collected.

Clearing this browser's site data will also clear local MathLab progress. Cross-device sync can be considered later if the project introduces an account system and a documented privacy model.

## Quality checks

Before submitting a change, run:

```bash
npm run check
```

This runs ESLint, the TypeScript check, the test suite and the production build. GitHub Actions runs the same checks for pushes and pull requests targeting `main`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Equation solver](docs/EQUATION_SOLVER.md)
- [Content authoring guide](docs/CONTENT_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Product roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)

## Contributing

Improvements to the learning experience, content quality, accessibility and responsive design are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

No open-source license has been added yet. Until a license is added, all rights are reserved by the repository owner.
