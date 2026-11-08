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
npm run verify
```

The `check` script runs all five checks in sequence:

```bash
npm run check
```

## Static build

The project uses Next.js static export. A production build writes the deployable site to `out/`.

Every screen is a real exported page in both languages (`/fi/learn/two-step/`, `/en/practice/`, ...), so no rewrite rules are needed: Cloudflare serves `fi/learn/two-step/index.html` directly. `wrangler.jsonc` keeps `html_handling: "auto-trailing-slash"` (so `/fi` goes to `/fi/`) and `not_found_handling: "404-page"` (so an unknown address gets the bilingual `404.html`). The bare address `/` is `public/index.html`, a small page that redirects to `/fi/` or `/en/` and upgrades old `#/` links. See [languages and addresses](LANGUAGES_AND_ROUTING.md).

## Cloudflare Workers

MathLab is a static site: `npm run build` writes it to `out/` and Cloudflare serves that folder with Workers static assets (`wrangler.jsonc`). There is no server code. Nothing in this repository deploys by itself; you choose one of the three ways below.

### Before the first deployment

```bash
npm run check          # lint, types, tests, build, and the export check (about a minute)
npm run preview        # builds, then serves out/ in the real Workers runtime on http://localhost:3000
npm run deploy:dry     # builds, checks the export, and validates the Cloudflare configuration without uploading
```

`npm run verify` (also part of `check` and of every deploy) reads `out/` and fails when a page exists in only one language, a page is marked with the wrong language, `404.html`, `index.html`, `robots.txt` or `_headers` is missing, a page loads something from another site, or `wrangler.jsonc` no longer has the three settings the routing depends on.

### Way 1: Cloudflare's own Git integration (Workers Builds)

In the Cloudflare dashboard: **Workers & Pages → Create → Import a repository**, choose `JuusoJuusto/math-lab`, and set:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Build command | `npm run build && npm run verify` |
| Deploy command | `npx wrangler deploy` |
| Root directory | (leave empty) |
| Worker name | `math-lab` (must match `name` in `wrangler.jsonc`) |

Add the build variable `NODE_VERSION` = `22` if the build image does not already use Node 22 (the `.nvmrc` file says 22). If you use this way, delete `.github/workflows/deploy.yml` so the site is not deployed twice.

### Way 2: GitHub Actions

`.github/workflows/deploy.yml` builds, tests, verifies and deploys whenever `main` changes, or when you press **Run workflow**. Add two repository secrets (**Settings → Secrets and variables → Actions**):

- `CLOUDFLARE_API_TOKEN`: create it at **My Profile → API Tokens → Create Token → "Edit Cloudflare Workers"** template.
- `CLOUDFLARE_ACCOUNT_ID`: shown on the right of the Workers & Pages overview.

Until both secrets exist the workflow only prints a notice and does nothing, so it is safe to merge first.

### Way 3: from your own computer

```bash
npx wrangler login
npm run deploy
```

### What Cloudflare does with the files

- `html_handling: "auto-trailing-slash"`: `/fi` goes to `/fi/` (a 307 redirect), and `/fi/learn/index.html` goes to `/fi/learn/`.
- `not_found_handling: "404-page"`: an unknown address returns the bilingual `404.html` **with status 404**.
- `public/_headers` is copied into `out/` and sets security headers on every page (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) and a one-year `immutable` cache for the hashed files under `/_next/static/`. Pages themselves are revalidated on every visit, so a new deployment shows up at once. `_headers` is never served as a file.
- The content security policy allows only the site's own files (plus the small inline scripts Next.js writes into each page). If you ever add an outside script, font or image, the browser will refuse it until you add its address to the policy in `public/_headers`.

### Checked in the real runtime

These were tested against `wrangler dev` (the same runtime Cloudflare uses) on the real `out/` build: every page in both languages loads with no console errors; the bare address `/` goes to `/fi/` for a Finnish browser and `/en/` for anything else; an old `#/learn/two-step` link becomes `/fi/learn/two-step/`; an unknown address returns 404 with the app's own page; the content security policy is enforced (an outside script is refused); and the headers above are present.

## Rolling back

```bash
npx wrangler deployments list
npx wrangler rollback
```

Cloudflare keeps earlier versions of the Worker, so the previous site can be restored in seconds.

## Custom domain

After the first successful deployment, attach the desired hostname to the Cloudflare Worker in the Cloudflare dashboard. DNS and domain ownership must already be configured in the relevant Cloudflare account.

## Troubleshooting

- If dependency installation fails, verify the Node.js version with `node --version`.
- If type generation fails, run `npm install` and then `npm run typecheck` again.
- If the Worker cannot find assets, confirm that `npm run build` created the `out/` directory and that Wrangler's assets directory matches it.
- If a deployment is rejected, authenticate with `npx wrangler login` and verify that the active Cloudflare account has permission to deploy the Worker.
