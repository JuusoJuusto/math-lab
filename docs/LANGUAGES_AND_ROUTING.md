# Languages and addresses

MathLab speaks Finnish and English. Every screen is a real page of the static site, in each language.

## Addresses

| Address | Screen |
| --- | --- |
| `/` | Chooses a language and carries on (see below) |
| `/fi/`, `/en/` | Home |
| `/fi/learn/`, `/fi/learn/two-step/` | Topics, a lesson |
| `/fi/solve/two-step/` | The equation solver |
| `/fi/practice/`, `/fi/practice/?mode=time` | Practice hub, optionally with a mode's setup open |
| `/fi/practice/exam/?topic=both&n=20&seed=5` | A practice session |
| `/fi/progress/` | Progress |

The static export builds one HTML file for every screen in both languages (`staticSegments()` in `lib/routes.ts` lists them, currently 70 files). That means:

- the language is known when the page is built, so `<html lang>`, the title and the first paint are right without JavaScript;
- a refresh, a shared link or a new tab opens the same screen in the same language;
- the browser's Back button and the phone's back gesture work, because moving between screens uses the History API (`hooks/useRoute.ts`);
- practice settings (topic, number of tasks, seed) travel in the query, so a session is reproducible and shareable.

Links are `<a href>` to the real pages (`components/ui/AppLink.tsx`). A plain click is handled in the app, which is instant; a modified click (new tab) is left to the browser.

### The bare address

`public/index.html` is a tiny page with a script. It sends a visitor to `/fi/` if the language they chose last is Finnish, or if they have not chosen and the browser's language is Finnish, and to `/en/` otherwise. With JavaScript off it shows two links. It also carries **older links** over: `/#/learn/two-step` becomes `/<language>/learn/two-step/`. The same upgrade happens for `/en/#/learn/two-step`, inside the app. A test (`components/app/__tests__/Language.test.tsx`) runs the real script against a fake browser.

### Unknown addresses

`app/global-not-found.tsx` is the 404 page, in both languages, because an unknown address has no language. Cloudflare serves it with a 404 status (`not_found_handling: "404-page"`).

## The language switch

`FI | EN` with a globe icon, on the right of the top bar (`components/shell/LanguageSwitch.tsx`). Each choice is a real link to the *same screen* in the other language, so it works in a new tab and without JavaScript. Choosing remembers the language in `localStorage` (`mathlab:lang:v1`), but only as a preference for the bare address; the language of a page always comes from its address.

## Where the words live

| What | Where |
| --- | --- |
| Interface text | `lib/i18n/ui-en.ts`, `lib/i18n/ui-fi.ts` |
| What the tutor says (feedback, hints, explanations, the clean-up questions) | `lib/equations/text-en.ts`, `text-fi.ts` (contract in `text-types.ts`) |
| Practice task sentences | `lib/tasks/text.ts` |
| Word problems | `lib/tasks/stories.ts` (each story carries both languages) |
| Topics and lessons | `content/topics.ts` |
| Quiz questions | `content/questions.ts` |
| Level introductions | `lib/equations/levels.ts` |

Each file has one dictionary per language with exactly the same shape, so the compiler refuses a string that exists in one language only. A message is a plain string or a function, because plural forms and word order differ (`1 virhe`, `2 virhettä`; "Kun molemmille puolille lisätään 5, ..." has no English-style gerund).

**Language never changes the maths.** Numbers, answers and the order of options come from the task's recipe (`kind`, `topic`, `seed`), never from the language. A test generates thousands of tasks in both languages and checks that the numbers, the right answer and the number of options agree, that no English is left in Finnish text and no Finnish in English text, and that every story says the same numbers in both languages. (Mutation checks were run: leaking an English sentence or changing a number in one language makes these tests fail.)

### Finnish conventions

- Division is `:` and multiplication `·` in written working; English uses `÷` and `×`. The parser reads both.
- Decimals use a comma in Finnish text (`0,75x`). Typed answers and typed equations accept a comma or a point in either language.
- Currency is written `5 €` in Finnish and `€5` in English.

## Adding a language

1. Add the code to `Lang` in `lib/lang.ts` and give it a name in `LANG_NAMES`.
2. Add a dictionary to each of the files in the table above (the compiler lists what is missing).
3. Add the language to `public/index.html` if the browser language should lead to it.
4. Run `npm test`. The parity tests loop over `LANGS`, so the new language is checked automatically.
