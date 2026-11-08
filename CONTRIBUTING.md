# Contributing to MathLab

Thanks for helping improve MathLab.

## Development setup

1. Install Node.js 20.9 or newer (Node.js 22 recommended).
2. Clone the repository.
3. Run `npm install`.
4. Run `npm run dev` to start the local development server.

## Before opening a pull request

Run:

```bash
npm run check
```

Keep pull requests focused and describe the learner-facing impact.

## Code conventions

- Use TypeScript and keep types explicit.
- Prefer small components with clear responsibilities.
- Keep content separate from presentation as the project grows.
- Use descriptive identifiers and stable IDs for topics and questions.
- Make controls keyboard accessible and provide visible focus states.
- Support narrow screens and school-managed devices.
- Avoid adding a backend or collecting personal data without a documented product requirement.

## Learning content

Follow [the content guide](docs/CONTENT_GUIDE.md). Verify every answer and explanation before submitting new questions.

## Design direction

MathLab should feel like part of the same family as GeoMaster and Master-Modus: approachable, colourful, direct and practical. Avoid generic dashboard patterns, excessive gradients, glass effects, decorative blobs and unnecessary animation. Prefer purposeful illustrations, clear hierarchy, flat cards and useful interactions.

## Pull request checklist

- [ ] The change has a clear learner benefit.
- [ ] The interface is in English.
- [ ] The layout works on mobile and desktop.
- [ ] Keyboard focus and button labels remain usable.
- [ ] New questions have verified answers and explanations.
- [ ] `npm run check` passes.
- [ ] Documentation is updated when behaviour or setup changes.
