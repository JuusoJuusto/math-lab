# Learning content guide

## Positive and negative numbers

Every generator mixes signs (`lib/tasks/sample.ts`, tested in `lib/tasks/__tests__/signs.test.ts`): coefficients, constants and answers are positive or negative with similar chances, in one-step, two-step, both-sides, bracket and fraction equations. When you write an exercise by hand in `lib/equations/levels.ts`, give a level both kinds too. Word problems with a negative answer (a temperature below zero) are in the stories.

## Audience and scope

The initial content is designed for introductory lower-secondary mathematics, with an emphasis on equations and proportional relationships. Content should be understandable without assuming that a learner has already mastered algebraic notation.

## Current topic catalogue

| Topic | Learning goal | Interactive solver |
| --- | --- | --- |
| Understanding equations | Explain equality and the meaning of an unknown | – |
| One-step equations | Undo one operation to isolate a variable | Level 1 |
| Two-step equations | Undo two operations in the right order | Level 2 |
| Variables on both sides | Collect like terms and isolate the variable | Level 3 |
| Equations with brackets | Open brackets, then solve | Level 4 |
| Fractions and ratios | Clear denominators, then solve | Level 5 |
| No solution or infinitely many | Recognise what it means when x disappears | Level 7 |
| Proportional relationships | Recognise direct and inverse proportion | – |
| Word problems | Write the equation from a story, then solve it | Level 6 |
| Hard word problems | The same with percentages, consecutive numbers, movement, ages, work | Level 8 |
| Challenge | Brackets, fractions and negatives in one equation | Level 9 |

The topics are defined in `content/topics.ts`. Topic ids are stored in learners' browsers as progress, so never rename an id. Add a new one instead.

Every text is written **in both languages** (Finnish and English), next to each other: topics and lessons here, questions in `content/questions.ts`, level introductions in `lib/equations/levels.ts`, stories in `lib/tasks/stories.ts`. The compiler rejects a missing translation, and the tests reject English left in Finnish text. See [languages and addresses](LANGUAGES_AND_ROUTING.md).

Every topic also has two short notes at the end of its lesson page, written for that lesson (never a sentence shared between lessons): **`remember`**, the one thing to hold on to, and **`watchOut`**, the mistake that is most often made, with a small example (`x + 5 = 12 means subtract 5, not add 5`). Each is one or two sentences, at most about 250 characters, and says something the key ideas above it do not already say word for word; the tests check the length, that both languages have them, and that Finnish has no English in it. Write the maths with ordinary spaces (`2x + 5 = 17`): the lesson page keeps an expression in one piece when a line wraps (`lib/mathText.ts`).

Each topic has a module colour, a **Lucide icon name** and a short formula with one highlighted part, which is what the coloured card shows. Keep the formula to about twelve characters; it shrinks to fit, but a short one reads better on a phone. Never use an emoji as an icon; add the Lucide icon to `components/ui/icons.tsx` instead.

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
- A stable `id` and a `topic` identifier matching the topic catalogue.
- A `level` of `Beginner`, `Intermediate` or `Advanced`.
- The position of the correct choice (`correct`), the same in both languages.
- For each language: a prompt, the list of answer choices (a Finnish decimal comma where needed) and a concise explanation.

`content/__tests__/content.test.ts` checks for duplicate ids, unknown topics, missing practice questions for a topic, invalid answer keys and duplicate choices. It also **solves every question whose prompt starts with `Solve the equation:` (Finnish: `Ratkaise yhtälö:`)**, so the prompt must be written in a form the parser reads (for example `Solve the equation:  3(x − 2) = 2x + 5`) and the answer choices must look like `x = 8`. The test fails if the answer is wrong or if any distractor is also a solution.

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
| The solution must be one **whole number** (negative is fine), except in the special-cases level, where x must disappear. | The tests check it. |
| Keep it to the level's promise: 1 step in level 1, 2 in level 2, 2–4 in level 3; later levels count the clean-up questions too. | Tests check this. |
| Order the list from easier to harder. | A round keeps this order. |
| Do not repeat the level's worked example. | A test checks this. |

Run `npm test`. If the equation does not parse, is not displayed as written, has no single whole-number solution, or does not take the expected number of steps, a test fails with the exercise id.

Equations with **brackets or fractions** are welcome in the levels that teach them (brackets, fractions, challenge). Write them as a student would: `3(x - 2) = 2x + 5`, `x/2 + x/3 = 5`, `(x + 1)/2 = 4`, `10 - 2(x + 1) = 4`. The learner first answers clean-up questions made from the text (see the [solver doc](EQUATION_SOLVER.md#clean-up-questions-the-prelude)), and the tests check that each question leads to the same equation. A bracket after a minus is written with a space (`- 2(x + 4)`); do not write `-(x + 1)` without a number. The levels `one-step`, `two-step` and `both` stay in plain standard form, shown exactly as written.

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

The logic that decides *what* to say is in `lib/equations/tutor.ts`; the words are in `lib/equations/text-en.ts` and `text-fi.ts`. When editing them:

- Explain *why*, not only *what*.
- Never reveal the complete solution when correcting a mistake. Hints do that gradually.
- Keep messages short, friendly and specific. Avoid repeating the same sentence for different mistakes.
- Do not blame the learner. A valid but unhelpful move is "balanced, but not helpful", not "wrong".

## Word-problem stories

Stories are in `lib/tasks/stories.ts`. A story is a small function from numbers to a `Story`: the equation that is right (first), three wrong equations a learner might write, the solution, and for **each language** the situation, what x stands for, the question, the unit, one sentence on how the equation is built, and the finished answer. Rules:

- Give it a tier (`difficulty`): 1 one step, 2 two steps, 3 x on both sides or brackets, 4 consecutive numbers, percentages and triangles, 5 brackets with two moving things, 6 fractions, ages and work.
- The answer is a whole number. `sampleStory` re-solves the right equation and every wrong one, and a story whose wrong equation has the right solution is never shown.
- Say the same numbers in both languages (a test compares them). Write decimals with a comma in Finnish (`0,75x`) and a point in English.
- Add the story to `TEMPLATES` with the ranges its numbers are drawn from, and to the `StoryId` list.
