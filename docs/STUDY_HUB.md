# Study Hub progress reporting

A student who opens MathLab from Study Hub (https://insaneones.xyz) has their progress shown there. This page describes what the app sends, when, and what it never sends. A student who does not come from Study Hub gets exactly the same app, and nothing is sent.

The code is two small files in `src/`, and a handful of one-line `reportProgress(...)` calls where learning happens.

## How the student arrives

Study Hub opens `https://mathlab.insaneones.xyz/#hub_token=...`. The token is in the part of the address after the `#`, which the browser never sends to any server.

1. `initStudyHub()` runs once, when the app's script loads (`components/app/App.tsx`), before anything else uses the address. It reads `hub_token`, keeps it in `sessionStorage` for this visit, and removes it from the address bar with `history.replaceState`. Other parts of the hash are left as they were. Next.js puts the address it saw at load time back once the page has hydrated, so `App` checks again after it mounts and removes the token a second time if it came back (only then, so a token held in memory is never forgotten).
2. The root page `public/index.html` is a language redirect (`/` goes to `/fi/` or `/en/`). It forwards `#hub_token=...` to the language page, because the browser would otherwise drop the fragment there.
3. While the visit lasts, the token is read from `sessionStorage` again, so later pages still report. If storage is blocked (private mode) the token stays in memory for as long as the page is open.

## What is sent

`POST https://insaneones.xyz/api/apps/progress`, with `Content-Type: text/plain;charset=UTF-8` (a simple request, so the browser sends no preflight), no cookies (`credentials: "omit"`), and `keepalive`, so a report sent as the page closes still goes out:

```json
{ "token": "...", "events": [ { "kind": "score", "label": "One-step equations", "ref": "lesson-one-step", "value": 4, "max": 5 } ] }
```

Events that happen close together go in one request (a two-second wait; at most 20 per request). When the page is hidden or closed, anything waiting is sent at once. The module stops after 200 events in a visit.

Only fixed labels and ids are sent: the lesson or practice name, a stable `ref`, and numbers. Never a name, email, user id, anything the student typed, or the equation they worked on.

## When it reports

| `kind` | `ref` | `label` | `value` / `max` | Where (file) |
| --- | --- | --- | --- | --- |
| `started` | `lesson-<id>` | the lesson's title | | A lesson round begins: `SolverView.startPractice` (`components/solver/SolverView.tsx`) |
| `progress` | `lesson-<id>` | the lesson's title | 25, 50, 75 | A lesson round passes a quarter, half, three quarters: `PracticeRound.tsx`, `WordRound.tsx` |
| `score` | `lesson-<id>` | the lesson's title | equations solved with no hint or wrong move / equations in the round | A lesson round ends: `SolverView.finishRound` |
| `completed` | `lesson-<id>` | the lesson's title | | The lesson is finished for the first time: `components/screens/SolverScreen.tsx` |
| `completed` | `chapter-<id>` | the chapter's title | | That first finish completes the last lesson of a chapter: `SolverScreen.tsx` |
| `started` | `practice-<mode>` | the practice name | | A practice session opens, once: `components/practice/PracticeSession.tsx` |
| `progress` | `practice-<mode>` | the practice name | 25, 50, 75 | A session passes a quarter, half, three quarters (not for time attack, which has no fixed length) |
| `score` | `practice-<mode>` | the practice name | correct answers / tasks | A session ends (time attack gives the number correct and no `max`) |
| `level` | `xp-level` | `Level <n>` | the new level | The XP level goes up: `updateProgress` in `hooks/useProgress.ts` |

The same `ref` is used for the same activity every time, so Study Hub can combine the reports. "Completed" is sent only the first time a lesson is finished, not every time it is practised again. The `<mode>` is a practice mode id such as `solve`, `truefalse`, `exam` or `test`.

`src/studyHubMilestones.ts` decides which of 25/50/75 a step passes, so a short session sends at most three `progress` events, and each exactly once.

## When sending does not work

Nothing happens to the app. Every send is wrapped so that a blocked, failed, slow or unreachable request is forgotten: no error is shown, nothing is retried in a loop, and nothing waits for it. An answer of 401 (the token has run out) ends the reporting for the rest of the visit.

The app does not try to get around content blockers: one address, no proxy, no other domains, no third-party analytics.

## Deployment

The content security policy has to allow the one request: `connect-src 'self' https://insaneones.xyz` in both `public/_headers` (Cloudflare) and `deploy/security-headers.conf` (Coolify / nginx). Nothing else in the policy changed. Without it the browser would refuse the report. `src/__tests__/securityHeaders.test.ts` checks both files and that they agree.

Study Hub has to allow `https://mathlab.insaneones.xyz` with CORS headers. Its answer to a preflight request was checked (204, with `access-control-allow-origin` for this site); the report itself is a simple request, so the browser does not send a preflight for it.

## Tests

- `src/__tests__/studyHubProgress.test.ts`: no token sends nothing; the token is read, kept and removed from the address; the request has the right address, body and options; limits; every kind of failure.
- `src/__tests__/studyHubMilestones.test.ts`: the 25/50/75 marks.
- `src/__tests__/securityHeaders.test.ts`: the policy in both header files.
- `components/app/__tests__/StudyHubEvents.test.tsx`: which events a lesson, a practice session and an XP level-up send, and that nothing typed is in them.
- `components/app/__tests__/StudyHubStartup.test.tsx`: the app loads the page asked for, with and without a token.
- `components/app/__tests__/Language.test.tsx`: the root redirect keeps the token.
