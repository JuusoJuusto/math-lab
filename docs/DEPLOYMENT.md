# Deployment

## Requirements

- Node.js 20.9 or newer to build and deploy (Node.js 22 is recommended).
- Node.js 22.22 or newer to run the test suite.
- npm.
- A Cloudflare account authenticated with Wrangler for deployment.

## Local development

```bash
npm install
npm run dev
```

Open the local address printed by Next.js.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The `check` script runs all four checks in sequence:

```bash
npm run check
```

## Static build

The project uses Next.js static export. A production build writes the deployable site to `out/`.

Every screen is a real exported page in both languages (`/fi/learn/two-step/`, `/en/practice/`, ...), so no rewrite rules are needed: Cloudflare serves `fi/learn/two-step/index.html` directly. `wrangler.jsonc` keeps `html_handling: "auto-trailing-slash"` (so `/fi` goes to `/fi/`) and `not_found_handling: "404-page"` (so an unknown address gets the bilingual `404.html`). The bare address `/` is `public/index.html`, a small page that redirects to `/fi/` or `/en/` and upgrades old `#/` links. See [languages and addresses](LANGUAGES_AND_ROUTING.md).

## Cloudflare Workers

Authenticate Wrangler:

```bash
npx wrangler login
```

Build and deploy:

```bash
npm run deploy
```

The `wrangler.jsonc` configuration points the Workers static-assets binding at `./out`. The project name is currently `math-lab`.

## GitHub Actions

The CI workflow in `.github/workflows/ci.yml` runs lint, TypeScript checks, the test suite and a production build for pushes and pull requests targeting `main`. It does not deploy the application.

## Custom domain

After the first successful deployment, attach the desired hostname to the Cloudflare Worker in the Cloudflare dashboard. DNS and domain ownership must already be configured in the relevant Cloudflare account.

## Troubleshooting

- If dependency installation fails, verify the Node.js version with `node --version`.
- If type generation fails, run `npm install` and then `npm run typecheck` again.
- If the Worker cannot find assets, confirm that `npm run build` created the `out/` directory and that Wrangler's assets directory matches it.
- If a deployment is rejected, authenticate with `npx wrangler login` and verify that the active Cloudflare account has permission to deploy the Worker.
