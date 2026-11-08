# MathLab

**Matikka haltuun, yksi oivallus kerrallaan.** MathLab is a Finnish-first interactive learning app for 8th-grade mathematics, beginning with equations and proportionality.

## First learning modules

- Yhtälön perusidea
- Yksinkertaiset yhtälöt
- Muuttuja molemmilla puolilla
- Sulut yhtälöissä
- Verrannollisuus

The learning experience takes inspiration from Toporopa's direct, visual exercise navigation and the existing Master-Modus and GeoMaster projects. The implementation is original and shares their flat, colourful visual language rather than copying their artwork or source code.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

## Checks and deployment

```bash
npm run lint
npm run typecheck
npm run build
npm run deploy
```

The app is a static Next.js export and stores learning progress locally in the browser. No account, backend, or API key is required for this first version.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Lucide icons, Fredoka and Open Sans variable fonts, Cloudflare Workers static assets.
