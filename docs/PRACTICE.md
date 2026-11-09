# Practice and exam preparation

MathLab has eleven ways to practise, so a learner can prepare for an exam with the kinds of question an exam actually asks, not only multiple choice. All of them live under **Practice** in the navigation.

## Ways to practise

| Mode | What the learner does | Task kinds |
| --- | --- | --- |
| Daily challenge | Five fresh tasks, the same for everyone that day, **+25 XP** once a day | mixed |
| Quick quiz | Pick the right answer | fixed questions and generated multiple choice |
| Solve it | Work it out and **type** the answer | typed answer |
| True or false | Decide whether a value solves an equation | true or false |
| Which step? | Say what was done to both sides between two equations | multiple choice |
| Find the mistake | Read a worked solution and find the first wrong line (or "no mistake") | multiple choice |
| Write the equation | Turn a story into the right equation | multiple choice |
| Time attack | As many tasks as possible in **60 seconds** | mixed, quick |
| Mixed practice | Every kind of task, climbing from easy topics to hard | all |
| Practice test (Koe) | A test on the chapters the learner chooses; four tasks in five are written by hand (`hand` tasks: whole solutions, solutions to finish, single steps) and the rest come from the other kinds in turn; results are shown per chapter. It is set up on its own screen, `/test/` | chosen chapters |
| Fix your mistakes | Retry the tasks you got wrong | the mistake queue |

Most modes can be narrowed to one topic and to a shorter or longer session. The topic list only shows topics the mode really has tasks for.

After every answer the learner sees whether it was right, the correct answer, and an explanation written from the actual solution. A wrong typed answer is shown to fail by **substituting it back**: "with x = 3 the left side is 7 and the right side is 1. They are not equal."

## Where tasks come from

Tasks are not stored. They are **generated** from a small recipe (`TaskSpec`: kind, topic, seed). The same recipe always gives the identical task. That one idea gives:

- endless variety (a new seed is a new task),
- a **mistake queue** that stores only recipes and regenerates the exact task to retry,
- reproducible sessions: the address `/en/practice/exam/?topic=both&n=20&seed=5` is the same exam every time, in either language (the words change, the numbers do not).

The code is in `lib/tasks/` and has no React or browser code.

| File | Responsibility |
| --- | --- |
| `types.ts` | `Task`, `TaskSpec`, grading types, the groups used in progress |
| `sample.ts` | Random equations with a whole-number solution, per topic |
| `stories.ts` | Word problems and proportion problems with verified wrong options |
| `corruption.ts` | Realistic algebra mistakes, used for wrong options and for "find the mistake" |
| `generate.ts` | `generateTask(spec)`: builds each kind of task |
| `grade.ts` | Reads a typed answer (`6`, `x = 6`, `2,5`, `7/2`, `12 km`) and grades it exactly |
| `support.ts` | Which kinds of task make sense for which topic |
| `modes.ts` | The modes, and `buildSession` which assembles a session from a seed |

### Why the maths can be trusted

- Every equation is built **backwards from its solution**, parsed by the equation engine and solved again. If the engine disagrees with the template, the template throws, so a bad template is found by the tests, never by a learner.
- Answers are **solved, not hard-coded**. Explanations come from the same step-by-step solution the solver uses.
- Wrong options are **real mistakes**, produced by the same code that builds "find the mistake": forgetting the last step, doing an operation on one side only, using the opposite sign on one side, a slip in the arithmetic. They are the answers a learner would actually reach, and each is checked to be wrong.
- Word-problem options are checked with the engine: exactly one equation gives the story's answer.
- "Which step?" options are checked by applying each one: exactly one turns the first equation into the second.
- A session never contains the same task twice.

The tests (`lib/tasks/__tests__`) generate about 4,400 tasks across every kind and topic and re-verify each independently of the generator: options are read back from their text, applied with the engine and compared.

## XP and levels

As in GeoMaster and MasterModus, correct answers earn XP and every 100 XP is a level (the yellow coin in the header).

| Action | XP |
| --- | --- |
| Correct practice task | 10 |
| Correct task in time attack | 5 |
| Equation solved in the solver | 10 |
| Solver level finished (first time) | 20 |
| Daily challenge finished (once per day) | 25 |

XP is saved as each answer is given, so leaving a session early never loses it.

## What is saved

Everything is kept in the browser's `localStorage` under `mathlab:progress:v1` (see `lib/progress.ts`): XP, answers and correct answers in total, **by topic** and **by type of task**, finished solver levels, the mistake queue (at most 30 recipes), the date of the last daily challenge and the best time attack score. Older saved data is still read correctly. The Progress screen shows all of it and suggests what to revise.

A topic counts as *practised* after at least five answers with 70% correct, and as *finished* when the solver level, an older quiz round or enough good practice is done.

## Screens and addresses

The app is a static export. Every screen is a real page under its language, which makes the browser's Back button, refresh and shared links work. The table shows the address without the language (`/fi/` or `/en/` in front); see [languages and addresses](LANGUAGES_AND_ROUTING.md).

| Address | Screen |
| --- | --- |
| `/` | Home |
| `learn/`, `learn/two-step/` | Topics, a lesson |
| `solve/two-step/` | The equation solver |
| `practice/`, `practice/?mode=time` | Practice hub, optionally with a mode's setup open |
| `practice/exam/?topic=all&n=20&seed=5` | A practice session |
| `progress/` | Progress |

Unknown addresses open the home screen. `lib/routes.ts` parses and builds them and is covered by tests.

## Keyboard and accessibility

- Choice tasks can be answered with the number keys `1` to `4`, and **Next** is focused after each answer so Enter carries on.
- Typed answers accept equivalent forms and a decimal comma. A **±** button helps on phone keyboards that have no minus key.
- Feedback is announced politely. Colour is never the only signal: right and wrong choices also get an icon and hidden text.
- Time attack announces its remaining seconds as a timer and respects the reduced-motion setting.

## Adding to the practice system

### A new word problem

Add a template to `lib/tasks/stories.ts`. Return the story text, the question, the unit, the equations (the **first one is correct**) and one sentence on how the equation is built. `sampleStory` checks with the engine that only the first option gives the answer, and the tests check every template across many seeds.

### A new kind of equation

Add a case to the topic's sampler in `lib/tasks/sample.ts`. Write the equation in standard form built from the solution, for example `ax + b = a*s + b`. The sampler solves it and throws if the answer is not the whole number you intended.

### A new kind of task

1. Add the kind to `TaskKind` and a group in `TASK_GROUPS` (`types.ts`).
2. Write its generator in `generate.ts` and say which topics it supports in `support.ts`.
3. Add it to a mode in `modes.ts`.
4. Add a verification to `lib/tasks/__tests__/generate.test.ts` that re-derives the correct answer independently.

### A new mode

Add an entry to `MODES` in `modes.ts` with its kinds, counts and description, an icon in `components/ui/icons.tsx` and a colour in `components/ui/Cards.tsx`.

## Tests

```bash
npm test
```

- `lib/tasks/__tests__` generation soundness for every kind and topic, grading, sessions, modes.
- `lib/__tests__/progress.test.ts`, `routes.test.ts` saved data and addresses.
- `components/app/__tests__/App.test.tsx` the whole app: navigation and Back, every practice mode, XP, the mistake queue, the daily bonus, time attack with a fake clock, keyboard shortcuts and the progress screen.
