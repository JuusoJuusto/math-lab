# Architecture

## Overview

MathLab is a client-interactive Next.js application exported as a static site. The first release deliberately has no application server, user accounts or remote database.

## Runtime structure

- `app/layout.tsx` defines the document language, global fonts, metadata and shared stylesheet.
- `app/page.tsx` contains the learning experience, topic data, exercise data and browser-local progress state.
- `app/globals.css` defines the visual system, responsive layouts, topic colours and exercise states.
- `public/` contains static assets served with the exported site.
- `docs/` contains product, architecture, content and deployment documentation.

## Learning flow

1. The home view introduces the learning path and displays a progress summary.
2. The topic catalogue lets a learner choose a subject.
3. A topic lesson presents concise key ideas.
4. A practice round filters the question bank to the selected topic, or uses the mixed set.
5. Each answer is checked immediately and receives an explanation.
6. The results view summarises the round and offers a retry or a route back to learning.

## State and persistence

The current application state is held in React state. Aggregate progress is saved in browser `localStorage` under the versioned key `mathlab:progress:v1`.

Stored fields:
- `completed`: topic identifiers completed by a learner.
- `attempts`: number of submitted answers.
- `correct`: number of correct answers.

Storage is optional. If browser storage is unavailable or contains invalid data, the app continues with an empty progress state. No password, personal profile or authentication token is collected.

## Static delivery

Next.js uses `output: "export"` to create the `out/` directory. Wrangler serves and deploys that directory as Cloudflare static assets. Client-side learning interactions run in the browser.

## Design references

MathLab follows the same product direction as the author's GeoMaster and Master-Modus learning projects: clear navigation, topic-first learning, colourful flat cards, friendly display typography and immediate practice feedback. Toporopa is a reference for direct exercise discovery and low-friction interactions. MathLab uses its own code, copy, examples and visual assets.
