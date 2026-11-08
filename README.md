# MathLab

**Learn mathematics by doing.**

MathLab is a visual, interactive learning app for lower-secondary mathematics, in **Finnish and English** (`/fi/`, `/en/`). It starts with equations, algebra and proportional relationships, turning each topic into a short learning path with explanations, practice and feedback.

The goal is simple: make mathematics feel clear, approachable and rewarding to practise.

<p align="center">
  <strong>Explore a topic · Understand the method · Practise · See your progress</strong>
</p>

## Learning experience

The learning collection contains eleven topics, and nine of them host a hands-on solver level:

| Topic | What you will learn | Interactive solver |
| --- | --- | --- |
| Understanding equations | Equality, unknowns and the balance principle | |
| One-step equations | Undo one operation to isolate a variable | Level 1 |
| Two-step equations | Undo two operations, in the right order | Level 2 |
| Variables on both sides | Collect variable terms and solve | Level 3 |
| Equations with brackets | Open brackets, mind the signs, then solve | Level 4 |
| Fractions and ratios | Clear the denominators, then solve | Level 5 |
| Word problems | Write the equation from a story, then solve it | Level 6 |
| No solution or infinitely many | What it means when x disappears | Level 7 |
| Hard word problems | Percentages, consecutive numbers, movement, ages, work | Level 8 |
| Challenge | Brackets, fractions and negatives together | Level 9 |
| Proportional relationships | Understand direct and inverse proportion | |

Each topic includes a short introduction and a multiple-choice practice round. Questions provide immediate feedback and an explanation, and the results screen summarises the round.

### Equation solver

Nine levels teach equation solving hands-on, from `x + 5 = 12` to equations with brackets on both sides, fractions and negative numbers. In each level you learn the idea, watch a worked example, and then solve equations yourself, in the way you prefer:

- **Both sides** (vaakamenetelmä): pick an operation and a number. A good choice is shown written on both sides in the same highlight, and in the notebook way: `3x − 5 = 6 || + 5`, then simplified.
- **Flip a term** (siirtomenetelmä): tap `− 5` and it crosses the equals sign as `+ 5`: `3x = 6 + 5`.
- **Work backwards** (käänteisoperaatiot): write what happens to x (`x → · 2 → + 5 → 17`) and undo it from the end.
- **Guess and check** (kokeilu): try a value for x, see both sides, and improve the guess until they are equal.
- **On a graph**: each side is a line, and the solution is where they cross.
- Equations written with brackets or fractions start with clean-up questions (open the brackets, simplify) that explain the typical mistakes.
- In the word-problem levels you write the **whole equation yourself** from a blank field before you solve it.
- A mistake gets an explanation and another try, never the full answer.
- Three hints reveal one at a time: what is in the way, which inverse operation to use, and a worked explanation.
- Every step is kept in a history with undo.
- At the end, check the answer by substituting it back into the original equation.

Divisions by zero and other moves that would break the equation are never accepted. See [the equation solver](docs/EQUATION_SOLVER.md) for how it works.

## Product direction

MathLab belongs to the same learning-app family as **GeoMaster** and **MasterModus**, and shares their look (sky-blue stripes, outlined wordmark, pill navigation with a level coin, coloured cards):

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
- **Practice:** ten ways to prepare for an exam, each with an explanation for every answer: daily challenge, quick quiz, solve it (type the answer), true or false, which step?, find the mistake, write the equation, time attack, exam practice and fix your mistakes. Tasks are generated, so you never run out.
- **XP and levels:** correct answers earn XP, as in GeoMaster and MasterModus.
- **Results:** review a completed round and retry it.
- **Progress:** see total attempts, accuracy and completed topics.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 and project CSS |
| Icons | Lucide (never emojis) |
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
| `npm run verify` | Check the exported site in `out/` (both languages complete, Cloudflare files present, nothing loaded from other sites) |
| `npm run check` | Run lint, type checking, tests, the production build and the export check |
| `npm run preview` | Build and preview the output in the Workers runtime (`wrangler dev`) |
| `npm run deploy:dry` | Build, verify and validate the Cloudflare configuration without uploading anything |
| `npm run deploy` | Build, verify and deploy the Worker with Wrangler |

## Project structure

```text
math-lab/
├── .github/
│   └── workflows/
│       └── ci.yml
├── app/
│   ├── globals.css
│   ├── [lang]/            # Every screen as a page, in each language
│   ├── global-not-found.tsx
│   └── solver.css
├── components/
│   ├── app/               # Application shell and routing
│   ├── practice/          # Practice sessions and results
│   ├── screens/           # Home, learn, lesson, practice, progress
│   ├── shell/             # Header, logo, footer
│   ├── solver/            # Equation solver interface
│   └── ui/                # Cards, maths line, icons
├── content/               # Topics and quiz questions
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTENT_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── EQUATION_SOLVER.md
│   ├── LANGUAGES_AND_ROUTING.md
│   ├── PRACTICE.md
│   ├── README.md
│   └── ROADMAP.md
├── hooks/                 # Progress, language and address hooks
├── lib/
│   ├── equations/         # Equation engine (no React)
│   ├── i18n/              # Interface text in Finnish and English
│   ├── tasks/             # Practice task generators, stories and grading (no React)
│   ├── progress.ts
│   └── routes.ts
├── public/                # index.html: the redirect from the bare address
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
- [Practice and exam preparation](docs/PRACTICE.md)
- [Equation solver](docs/EQUATION_SOLVER.md)
- [Content authoring guide](docs/CONTENT_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Product roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)

## Contributing

Improvements to the learning experience, content quality, accessibility and responsive design are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

No open-source license has been added yet. Until a license is added, all rights are reserved by the repository owner.
