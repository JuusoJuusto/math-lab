# Learning content guide

## Audience and scope

The initial content is designed for introductory lower-secondary mathematics, with an emphasis on equations and proportional relationships. Content should be understandable without assuming that a learner has already mastered algebraic notation.

## Current topic catalogue

| Topic | Learning goal | Interactive solver |
| --- | --- | --- |
| Understanding equations | Explain equality and the meaning of an unknown | – |
| One-step equations | Undo one operation to isolate a variable | Level 1 |
| Two-step equations | Undo two operations in the right order | Level 2 |
| Variables on both sides | Collect like terms and isolate the variable | Level 3 |
| Equations with brackets | Apply the distributive property | – |
| Proportional relationships | Recognise direct and inverse proportion | – |
| Word problems | Translate a situation into an equation | – |

The topics are defined in `content/topics.ts`. Topic ids are stored in learners' browsers as progress, so never rename an id. Add a new one instead.

Each topic has a module colour, a **Lucide icon name** and a short formula with one highlighted part, which is what the coloured card shows. Never use an emoji as an icon; add the Lucide icon to `components/ui/icons.tsx` instead.

The generated practice tasks (typed answers, true or false, which step, find the mistake, write the equation) are described in [practice](PRACTICE.md). They need no authoring: they come from templates in `lib/tasks`.

## Exercise authoring rules

- Use one clear learning objective per question.
- Ensure the correct answer is mathematically correct and unique.
- Make distractors plausible and tied to common misconceptions.
- Explain the method, not merely the answer.
- Use consistent notation and units.
- Avoid ambiguous wording and unnecessary reading complexity.
- Include a mix of introductory, intermediate and advanced tasks.
- Verify every answer independently before merging content. For equations, the tests do this for you (see below).

## Multiple-choice questions

The question bank is defined in `content/questions.ts`. Each question has:
- A stable `id`.
- A `topic` identifier matching the topic catalogue.
- A `level` of `Beginner`, `Intermediate` or `Advanced`.
- A prompt and a list of answer choices.
- One correct answer, which must also appear in the choices.
- A concise explanation.

`content/__tests__/content.test.ts` checks for duplicate ids, unknown topics, missing practice questions for a topic, invalid answer keys and duplicate choices. It also **solves every question whose prompt starts with `Solve the equation:`**, so the prompt must be written in a form the parser reads (for example `Solve the equation:  3(x − 2) = 2x + 5`) and the answer choices must look like `x = 8`. The test fails if the answer is wrong or if any distractor is also a solution.

## Equation solver exercises

Exercises for the interactive solver live in `lib/equations/levels.ts`. Each level has an `exercises` list (the pool that rounds are drawn from), a worked example and a short introduction.

### Adding an equation

Add one line to the level's `exercises` list, written in **standard form** (x term first, constant second):

```ts
two(13, "6x + 7 = 31"),
```

Use plain ASCII: `-` for minus, `x/3` for division. The workspace shows the true minus sign.

Rules:

| Rule | Why |
| --- | --- |
| Use a **new id** (the number inside `one(…)`, `two(…)`, `both(…)`). Never reuse an id for a different equation. | Ids identify exercises in rounds. |
| Write x first: `-2x + 3 = 11`, not `3 - 2x = 11`. | The workspace always shows standard form, and a test checks that what you wrote is what learners see. |
| The solution must be one **whole number** (negative is fine in level 3). | Fractions are outside the introductory scope. |
| Keep it to the level's step count: 1 step in level 1, 2 in level 2, 2–4 in level 3. | A test checks this. |
| Order the list from easier to harder. | A round keeps this order. |
| Do not repeat the level's worked example. | A test checks this. |

Run `npm test`. If the equation does not parse, is not displayed as written, has no single whole-number solution, or does not take the expected number of steps, a test fails with the exercise id.

Equations with brackets, such as `3(x - 2) = 2x + 5`, parse correctly and are used to verify quiz questions, but the solver has no "expand brackets" operation yet, so do not add them to the solver pools.

### Rounds

A round shows `roundSize` (5) different exercises chosen at random from the pool, avoiding the previous round where possible. Keep at least **twice** `roundSize` exercises per level so that **Practise again** feels fresh. A test enforces this.

### Changing a level's introduction or worked example

Edit the `intro` and `example` fields of the level. The worked example is solved by the engine, so you only choose the equation and write one sentence of lead-in; the steps and explanations are generated and always match the maths. Keep the introduction to a lead sentence and three short points.

### Adding a new level

1. Add the topic to `content/topics.ts` and give the level the **same id**.
2. Add the level to `LEVELS` in `lib/equations/levels.ts` and extend the `LevelId` type.
3. Add exercises and tests for its promised difficulty in `lib/equations/__tests__/levels.test.ts`.
4. Add quiz questions for the topic so that **Quiz** works.

## Feedback wording

Feedback is written in `lib/equations/tutor.ts`. When editing it:

- Explain *why*, not only *what*.
- Never reveal the complete solution when correcting a mistake. Hints do that gradually.
- Keep messages short, friendly and specific. Avoid repeating the same sentence for different mistakes.
- Do not blame the learner. A valid but unhelpful move is "balanced, but not helpful", not "wrong".
