# MathLab

**Learn mathematics by doing.**

MathLab is a visual, interactive learning app for lower-secondary mathematics. It starts with equations, algebra and proportional relationships, turning each topic into a short learning path with explanations, practice and feedback.

The goal is simple: make mathematics feel clear, approachable and rewarding to practise.

<p align="center">
  <strong>Explore a topic · Understand the method · Practise · See your progress</strong>
</p>

## Learning experience

The first learning collection contains six topics:

| Topic | What you will learn |
| --- | --- |
| Understanding equations | Equality, unknowns and the balance principle |
| One-step and two-step equations | Undo operations to isolate a variable |
| Variables on both sides | Collect variable terms and solve |
| Equations with brackets | Expand brackets using the distributive property |
| Proportional relationships | Understand direct and inverse proportion |
| Word problems | Translate real situations into equations |

Each topic includes a short introduction and a practice round. Questions provide immediate feedback and an explanation, and the results screen summarises the round.

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
- **Practice:** answer multiple-choice questions with instant feedback.
- **Results:** review a completed round and retry it.
- **Progress:** see total attempts, accuracy and completed topics.

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 and project CSS |
| Icons | Lucide |
| Typography | Fredoka Variable and Open Sans Variable |
| Hosting target | Cloudflare Workers static assets |
| Persistence | Browser `localStorage` |

The application uses Next.js static export. The first release does not require an API, database, account system or environment secrets.

## Getting started

### Requirements

- Node.js 20.9 or newer (Node.js 22 recommended).
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
| `npm run build` | Create the production static export |
| `npm run check` | Run lint, type checking and the production build |
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
│   └── page.tsx
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTENT_GUIDE.md
│   ├── DEPLOYMENT.md
│   ├── README.md
│   └── ROADMAP.md
├── public/
├── CONTRIBUTING.md
├── next.config.ts
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

See the [documentation index](docs/README.md) for architecture, content authoring, deployment and roadmap details.

## Progress and privacy

Learning progress is stored locally in the current browser using the versioned key `mathlab:progress:v1`. It is not synced between devices and is not connected to a user account.

The stored summary currently contains completed topic IDs, submitted answer count and correct answer count. No password, profile or authentication token is collected.

Clearing this browser's site data will also clear local MathLab progress. Cross-device sync can be considered later if the project introduces an account system and a documented privacy model.

## Quality checks

Before submitting a change, run:

```bash
npm run check
```

GitHub Actions also runs linting, type checking and a production build for pushes and pull requests targeting `main`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Content authoring guide](docs/CONTENT_GUIDE.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Product roadmap](docs/ROADMAP.md)
- [Contributing](CONTRIBUTING.md)

## Contributing

Improvements to the learning experience, content quality, accessibility and responsive design are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

No open-source license has been added yet. Until a license is added, all rights are reserved by the repository owner.
