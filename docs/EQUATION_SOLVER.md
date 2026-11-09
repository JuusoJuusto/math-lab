# Equation solver

The equation solver is MathLab's interactive way of learning to solve linear equations in one variable. It is part of the normal topic navigation: nine topics each host one solver level, from one-step equations to the hardest mixed equations and word problems. Everything it says is available in Finnish and English.

This document explains how the solver teaches, how the equation engine works, how every move is validated, and how to extend or test it.

## Ways to solve

An equation can be solved in more than one way, and MathLab teaches the ones that are common in Finnish teaching of equations. The notation and the order of the topics follow what Finnish lower-secondary textbooks do (the double bar `||`, `:` and `·` for division and multiplication, checking by substitution with *tosi / epätosi*, brackets first, denominators last). No text or exercise is copied from any textbook: the wording and every exercise are MathLab's own.

| Way | What the learner does | Written like this |
| --- | --- | --- |
| **Both sides** (vaakamenetelmä) | Chooses an operation and a number and does it to both sides | `3x − 5 = 6 \|\| + 5` |
| **Flip a term** (siirtomenetelmä) | Taps a term; it crosses the equals sign and its sign changes | `3x = 6 + 5` |
| **Work backwards** (käänteisoperaatiot) | Writes what happens to x as a chain, then undoes it from the end | `x → · 2 → + 5 → 17`, then `17 → − 5 → : 2 → x` |
| **Guess and check** (kokeilu) | Tries a value for x, sees both sides, and improves the guess | a table of guesses, with "try a larger / smaller x" |
| **On a graph** | Looks at each side as a line; the solution is where they cross | check after solving |

The first two are the same rule: a flip *is* the balance operation it stands for, shown in a shorter form. It is never applied by its own arithmetic. `flipOperation` turns the tap into an ordinary operation, `applyOperation` validates it, and the tutor judges it (`lib/equations/flip.ts`). The notebook notation `|| + 5` is written beside the equation while a step is applied and in the step history. Work backwards (`lib/equations/methods.ts`) is available when x appears once on one side; its answer is accepted only if the engine agrees. The graph (`graphOf`) shows two lines that cross at one point, parallel lines (no solution) or one line twice (infinitely many).

**Guess and check.** `guessVerdict` (`lib/equations/methods.ts`) says whether a guess is right, or whether x has to be larger or smaller. Each side of a linear equation is a straight line in x, so the sign of the difference between the sides and the sign of the slope (the x of the left side minus the x of the right side) decide the direction. A test checks the advice against the real solution for 4,000 random equations and guesses. A wrong guess is not a mistake; only a guess that makes both sides equal ends the exercise, and it goes through the same `answer` action as working backwards, so the engine still has to agree. It is offered only for an equation with exactly one solution.

**Another way (Tapa 2).** The order of the steps is a choice: `4x − 1 = x − 7` can start by taking x away or by adding 1. `waysToSolve` (`lib/equations/ways.ts`) builds the tutor's route and, when one exists, a second route that begins with a different move the tutor also recommends. The worked example shows it once the first route is solved. A test builds both routes for 2,000 random equations and checks that each ends with x alone and keeps the solution.

**The balance picture (vaaka).** `BalanceScale` draws balls marked x and numbered weights on two pans, for equations whose terms are all whole numbers that are not negative. It is a picture of the equation shown above it (hidden from screen readers), and it is not drawn for an equation that is never true, because a scale in balance cannot show one.

**When x is not the answer.** Some stories ask for something worked out from x (the dearer of two prices, the longest side). Such a story has a `final` value; after solving, the learner must answer the question itself, and typing x is explained as "not the answer yet". Practice tasks grade `final` too.

**Arrows over a bracket.** While the brackets of `3(x − 2)` are opened, an arrow is drawn from the number to every term inside (`DistributeArrows`), as in a textbook, so no term is forgotten. `distributionOf` reads the part; a division such as `(x + 1)/2` has no arrows.

**True or false.** When x has dropped out (`3 = 7`, `4 = 4`), the equation display says whether the statement is true or false (*tosi* / *epätosi*), and the explanation calls the equation identically true or identically false.

Equations that are written with brackets or fractions begin with a **clean-up**: the order Finnish textbooks use is *brackets first, then simplify, then balance*.

## The worksheet

Every finished step stays on the screen, stacked above the current equation, written as in a notebook: the equation with its `||` bar (`2x + 5 = 17 || − 5`), then the same line with the step done on both sides (`2x + 5 − 5 = 17 − 5`). The current equation is the last card, with an arrow pointing down to it, and each new line slides in. Undo and Start over sit under the sheet. After "work out both sides" the screen spells out the real numbers (`Left side: 2x + 5 − 5 becomes 2x`), so the step is never a mystery.

## Solving by hand

`HandWorkspace` has no operation buttons and no terms to tap. The learner types each line of the solution; `judgeLine` (`lib/equations/hand.ts`) compares it with the line above: it is accepted when one step on both sides (or a flip) gives it, or when it is the same equation written more simply (brackets opened, like terms put together). It says so when a line is the same as before, jumps over a step, changes the solution, or cannot be read. A note beside the line (`|| − 5`) is allowed and read. Four in five exercises of every round are solved this way (`roundVariant` in `lib/equations/hand.ts`): the first uses the buttons, so a learner can try the ways of solving, and the rest rotate through three formats so the work stays varied, with whole solutions the most common:

| Format | What the learner does |
| --- | --- |
| **full** | writes every line of the solution |
| **continue** | the first lines are written; writes the rest |
| **write** | does the one step they are told to do (`Subtract 5 from both sides`) and writes the equation it gives |

`planHand` builds each format from the tutor's own solution, so every task can be finished. The practice test is built the same way: four tasks in five are written by hand (`handShare` in `lib/tasks/modes.ts`), in the same three formats, and every fifth task comes from the other kinds in turn (short questions, true or false, which step, find the mistake). A test checks every line of the tutor's own solution of 1,500 equations is accepted, and a changed copy of each is not. "I am stuck" gives the usual three hints and counts as hints.

### Writing a line: the key pad

A line is written in a text box, and a hardware keyboard works as always. Under it is a key pad (`components/solver/MathPad.tsx`, shared with the word-problem screen) for phones, where numbers, x, brackets and the equals sign hide behind keyboard layers: the digits 0 to 9, a decimal sign (a comma in Finnish), x, `+ − × ÷`, brackets, `=`, delete, clear, and on the by-hand screen the two bars `||` for the step beside a line. The keys write at the caret and do not take the focus, so a phone's own keyboard stays down.

The **fraction key** is for writing x over 3 the way it looks. It opens two boxes, one above the other. The top is ready for the first key; tap the bottom to switch; press the numbers; **Put in the line** adds `x/3` (or `(x + 2)/3` when the top is longer than one term) at the caret. If a part of the line is picked out first, it becomes the top. A hardware keyboard works in the boxes as well: keys fill the active box, Enter puts it in, Escape cancels. Nothing about the engine changes: the line is text, `readWritten` reads `x/3` as it always did.

Under the box the line is drawn as it will look, with fractions stacked (`MathLine`), from the first key. The space is always there, so the keys do not move down when the first key is pressed.

### The final answer: counting the number yourself

A solution has not ended just because x is alone. `x = 12 : 2` has x alone, but nobody has counted 12 : 2, and `x = 6/4` is not as simple as it gets. When the last line still has something to count (`needsWorkingOut` in `lib/equations/answer.ts`), the by-hand screen asks for the answer before anything else: **Your final answer**, with the last line shown, a number pad (digits, a minus sign, a decimal sign, the fraction key) and **Check my answer**. The number has to be right, and a fraction has to be in its simplest form (`6/4` is told to be written as `3/2`, and is not counted as a mistake). After two wrong tries the part still to be counted is shown as a hint. A wrong try counts as a mistake in the round; only then does **Check by substituting** appear.

When the last line is already a plain number (`x = 6`), nothing is asked twice: the card just shows the **Final answer**, and the check follows. `FinalAnswer` is in `components/solver/FinalAnswer.tsx`.

### Counting both sides yourself

With the buttons, the learner chooses an operation and it is written on both sides (`2x + 5 − 5 = 17 − 5`). Next to **Work out both sides**, which counts for them, is **I will count it myself**: the learner writes the equation that is left, and it is checked by the engine (`CountMyself`, `components/solver/CountMyself.tsx`). It has to be the right equation (`2x = 12`, or `12 = 2x`) and it has to be counted: `2x = 17 − 5` is the right equation, but the subtraction is still to do, and `isWorkedOut` says so without counting it as a mistake. A wrong equation counts as a mistake, and after the second one each side's working is shown. Above the operation buttons is a switch, **I will count the results myself**, so the choice is made before the answer is on the screen: with it on, the field opens by itself after every step. While the learner counts, nothing on the screen may do the counting for them, so the lines that say how each side goes (`Left side: 2x + 5 − 5 = 2x`, in the feedback and in the explanation under the buttons) are left out; they come back as a hint after the second wrong try. Once opened, the field stays open for the rest of the equation. The button that counts for the learner is always there.

The same rule holds on the by-hand screen: a last line such as `x = 1 · 2` is shown in the learner's own lines, but the screen does not draw it as `x = 2`, does not say **Solved**, and does not say "check your answer" until the learner has worked the number out. A test in `HandWorkspace.test.tsx` and one in `CountMyself.test.tsx` hold both.

### Doing the whole equation yourself

A by-hand task can give some lines (**continue**) or ask for one step (**write**). Both have **I want to work out the whole equation myself** until the learner has written a line of their own: it takes the given lines away and the task becomes the whole equation, from the first line to the final answer.

## Decimals

An equation written with decimals (`0.5x + 1.2 = 3.7`, `0.25x + 1 = 2.5`) has one clean-up question: *multiply every term by 10 (or 100) so that the decimals disappear*. `decimalFactor` picks 10 for one decimal place and 100 for two. The balance moves then start from the whole-number equation (`startEquation`: `5x + 12 = 37`), which has the same solution. The wrong answers are the usual slips (a term left as it was written, a decimal point moved one place too far, a lost sign, an arithmetic slip), and a test checks that none of them is an alternative right answer. Inside the engine numbers use a point; Finnish shows them with a comma (`localiseDecimals`). Decimal exercises are in the fractions level, written with a point in `levels.ts`, and are chosen so that the answer is a whole number.

## Clean-up questions (the prelude)

An equation such as `3(x − 2) = 2x + 5` or `x/2 + x/3 = 5` is not yet in the form the balance moves work on. `makePrelude` (`lib/equations/prelude.ts`) turns the authored text into small questions:

1. **Open the brackets** (`3(x − 2)` → `3x − 6`), left to right. Brackets after a minus (`− 2(x + 4)`), a negative number in front (`−2(x − 3)`) and a division (`(x + 1)/2`) are handled.
2. **Simplify** each side that is still written out (`3x + 6 − 4` → `3x + 2`, `x/2 + x/3` → `5x/6`).

Each is multiple choice with three plausible wrong answers, each with a *reason*: forgot to multiply a term (`3(x − 2) = 3x − 2`), lost a sign (`3x + 6`), added the denominators (`1/2 + 1/3 = 2/5`), or slipped in the arithmetic. A wrong choice is explained by its reason, counted as a mistake, and disabled; the learner tries again. Until the questions are answered, balance moves, flips, hints and undo are not available. The tests check, for every authored equation, that **every step is a true restatement of the equation** and that exactly one option equals the part it replaces.

## Fractions

With fractions, the first move is to multiply both sides by the common denominator (`commonDenominator`), so that everything is a whole number; then it is solved as before. `x/2 + 1/2 = 4` × 2 gives `x + 1 = 8`. A fraction as the *answer* (`x = 3/7`) is fine. A step such as dividing `2x + 5 = 17` by 2, which creates fractions where a whole-number route exists, is allowed but called "messy". Ratios (`x/6 = 4/3`) are solved the same way.

## What the learner experiences

Each level has the same four stages, switchable at any time from the stage bar:

1. **Learn** – a short introduction, three key points and the balance rule shown on a real equation.
2. **Example** – a worked example. The tutor chooses each move, one click at a time, and explains it. It ends with a substitution check.
3. **Practise** – a round of five equations, each solved interactively.
4. **Complete** – a recap of the round, a link to the next level, **Practise again** (a fresh set of equations) and a link to the multiple-choice quiz for the topic.

### Solving one equation

1. The learner picks an **operation** (add, subtract, multiply, divide) and a **number**. For add and subtract they can switch on the **x button**, so that the amount is an x term such as `3x`.
2. If the choice is good, the operation appears **written on both sides in the same highlighted colour**: `2x + 5 − 5 = 17 − 5`. The feedback panel explains why it works and shows the arithmetic on each side.
3. The learner presses **Work out both sides** to collapse it into the next equation, `2x = 12`.
4. If the choice is not good, nothing changes. The learner gets an explanation and tries again; the full solution is never revealed.
5. When x is alone the learner can **check by substituting** the answer into the original equation.

Help is always available without giving the answer away:

- **Hints** reveal one at a time: (1) what is in the way, (2) which inverse operation to use, (3) a worked explanation of the exact move.
- **Undo** removes the last step, **Start over** returns to the original equation, and **Choose again** cancels an operation that has been applied but not simplified.
- The **step history** lists every equation with the operation used and how it looked on both sides.

## Learning levels

| Level | Topic id | Equations | What it teaches |
| --- | --- | --- | --- |
| 1. One-step | `one-step` | `x + 5 = 12`, `3x = 21`, `x/4 = 6` | Inverse operations; isolating x |
| 2. Two-step | `two-step` | `2x + 5 = 17`, `x/3 + 4 = 9` | Undoing operations in reverse order |
| 3. Both sides | `both` | `5x + 2 = 3x + 12`, `−2x + 3 = 11` | Collecting x terms; negative numbers |
| 4. Brackets | `brackets` | `3(x − 2) = 2x + 5`, `10 − 2(x + 1) = 4` | Opening brackets, signs, then balance |
| 5. Fractions and ratios | `fractions` | `x/2 + x/3 = 5`, `(x + 1)/2 = 4`, `x/6 = 4/3` | Combining fractions, clearing denominators |
| 6. Word problems | `word` | stories, tiers 1 to 3 | Writing the equation from a story, then solving it |
| 7. No solution or infinitely many | `special` | `2x + 3 = 2x + 7`, `3(x + 1) = 3x + 3` | What it means when x disappears |
| 8. Hard word problems | `hard-word` | stories, tiers 4 to 6 | Percentages, consecutive numbers, movement, ages, work |
| 9. Challenge | `challenge` | `4(x − 3) − 2(x − 5) = x + 6`, `(x + 2)/3 = (x − 1)/2` | All of it together |

A topic and its level share the same id. Levels are defined in `lib/equations/levels.ts`.

## Word problems: the equation is written from scratch

In the two word-problem levels the learner reads a story, **writes the whole equation in a blank field**, and only then solves it. Nothing is filled in: no boxes, no template, no starting text. The same key pad as in solving by hand (digits, x, signs, brackets, a decimal sign and the fraction key; see above) is there for phones. What was typed is read by `readWritten`, which accepts what people write (`2x+3=15`, `0,75x`, `x : 2`, `3(x + 1)`, a capital `X`) and says in the learner's language what cannot be read (no equals sign, a different letter, x times x).

### Learning to write the equation

The story is not only the question; it is the teacher. Every story carries `letX` (what x stands for), `build` (how its equation is built, in its own words) and `answer` (the finished sentence), in both languages, and the screens use them:

- **The hints are the story's own.** The first says what x is and what to look for ("Start with x. Let x be the number of slices in the pizza. Then find the two things the story says are equal."). The second is `build` without the equation (`explainBuild` in `lib/tasks/story-text.ts` takes the words in front of the equation). The third is the equation. A story whose `build` already says both sides (`ages`, `ella-age`, `plans`, `race`) has no second hint of its own, and the general one is used; a test checks that no hint ever gives both sides away.
- **A right equation is explained.** The notice says why: "Why this equation: The start fee €3 is added once, and €2 is paid for each of the x kilometres: 2x + 3 = 15."
- **The answer is said by the learner.** After the equation is solved, the story's answer sentence is shown with a gap where the number goes (`answerFrame`), and the learner fills it in (`AnswerSentence`). A wrong number is sent back to the story ("Put your number into the story and read it again"). A story whose question asks for something worked out from x (the dearer of two prices) first asks for that number, as before.
- **The lesson shows the way in six steps.** The worked example of both word lessons is `StoryWalkthrough`: read the story, say what x is, find what is equal to what, write the equation, solve it with the tutor, answer in a sentence. Each step stays on the screen when the next one arrives, and the focus moves to it. The lesson page shows the same road as a notebook (`LessonExample`): the story, what x is, the equation and the story's reason for it, the solving lines, the answer, the answer sentence and the check.

`judgeBuiltEquation` compares what the learner wrote with the story's own equation:

| Verdict | Meaning |
| --- | --- |
| exact | The same equation, sides and terms in any order, with brackets opened or not |
| equivalent | A different equation with the same solution, such as `2x = 12` for `2x + 3 = 15`; accepted, and then *the learner's* equation is solved |
| answer given | x is already alone (`x = 6`): not accepted, because nothing is left to write |
| wrong | A different solution, with a hint at what to look at: a sign, the two numbers swapped, or the total |

Stories (`lib/tasks/stories.ts`) have six tiers, from `x/4 = 3` to "In 6 years Ella will be 3 times as old as she was 4 years ago". Every story carries a verified correct equation and wrong ones with other solutions, and says the same numbers in Finnish and English.

## The equation engine

The engine lives in `lib/equations/` and is plain TypeScript with no React or browser code, so it is tested on its own.

| File | Responsibility |
| --- | --- |
| `fraction.ts` | Exact rational arithmetic. No floating point is used anywhere in the engine. |
| `expression.ts` | A linear expression is `coefficient × x + constant`; an equation is two of them. |
| `parse.ts` | Parses strings such as `"3(x - 2) = 2x + 5"` into equations and rejects anything that is not linear. |
| `operations.ts` | The four operations, and the validation that decides whether an operation is allowed. |
| `solve.ts` | Solves equations and classifies them: one solution, no solution, or infinitely many. |
| `check.ts` | Verification by substitution, laid out line by line. |
| `format.ts` | Turns equations and operations into text and display tokens (one source for visuals, screen readers and feedback). |
| `tutor.ts` | Judges moves, explains them, suggests the next move and writes the hints. |
| `session.ts` | The state machine behind the workspace: the clean-up questions, apply, flip, simplify, hint, undo, restart, check, and answers found by working backwards. |
| `flip.ts` | Flipping a term across the equals sign, and how it is shown. |
| `prelude.ts` | The clean-up questions for brackets and fractions. |
| `build.ts` | Reading an equation typed from scratch, and judging it against a story. |
| `methods.ts` | Working backwards (the chain) and the graph. |
| `text-*.ts` | Everything the tutor says, in each language. |
| `levels.ts` | The nine learning levels and the exercise catalogue. |
| `round.ts` | Picks the equations for a round and summarises it. |

### Exact numbers

All numbers are `Fraction` values made of two safe integers, always in lowest terms with a positive denominator. This removes display errors such as `0.30000000000000004`, makes equality checks exact, and lets `x/3` be a real coefficient (`1/3`) rather than an approximation. A fraction part larger than one million is rejected before it can overflow, so intermediate results always stay exact. `NaN` and `Infinity` cannot occur.

### How transformations are validated

`applyOperation` in `operations.ts` is the only way an equation changes. It applies the same operation to the left and right side and enforces these rules:

| Operation | Rule |
| --- | --- |
| Add or subtract a number, or an x term such as `3x` | Always allowed. The same quantity on both sides never changes the solution. |
| Multiply by a number | Allowed, except **0**, which would turn both sides into 0 and make every x look like a solution. |
| Divide by a number | Allowed, except **0**, which is undefined. |
| Multiply or divide by an x term | Rejected. It can change which values work, or lose a solution. |
| A result too large to represent exactly | Rejected with a clear message. |

As a final safety net, after every operation the engine solves the equation before and after and checks that the solution (one value, none, or infinitely many) is identical. A step that fails this check is never returned, so a non-equivalent step cannot be presented as valid.

Operations are *allowed* by the engine but may still be *unhelpful*. That is the tutor's job.

### How the tutor judges a move

The tutor accepts any valid move that gets closer to a solved equation, instead of comparing with one scripted answer. It does this with a **distance to solved**:

- one move if x must be collected onto a single side,
- one move if a constant is next to x,
- one move to undo a coefficient such as `3x` or `x/3`.

Every move is then sorted into one of three groups:

| Verdict | Meaning | What happens |
| --- | --- | --- |
| `invalid` | Not allowed mathematically (divide by 0, multiply by 0, multiply by x, too large). | An explanation is shown. The equation is not changed. |
| `not-helpful` | Allowed and balanced, but it does not move towards `x = …`. | A specific explanation is shown. The equation is not changed. |
| `helpful` | Makes progress. | The operation is shown on both sides, with the reason it works. |

`not-helpful` moves are diagnosed so the feedback is useful. Examples: the opposite operation (`add 5` instead of `subtract 5`), the right operation with the wrong number, a plain number where an x term was needed, a move that only introduces fractions while a whole-number move exists, a move that changes nothing, and a move that makes the equation harder.

When x is on both sides there are several equally good routes (keep x on the left or the right, remove constants first or last). A move counts as progress if it advances **any** of them, so valid textbook steps are never wrongly rejected. Dividing everything first (for example `2x + 6 = 18` ÷ 2) is accepted when every term divides evenly, with a note that undoing the `+` or `−` first also works.

### Special outcomes

If x disappears from both sides, the remaining statement decides the outcome: `3 = 5` means **no solution**, and `4 = 4` means **infinitely many solutions**. The session handles both, shows an explanation and offers undo. The built-in exercises all have exactly one solution; these outcomes appear if an equation with none is added to the catalogue, and the engine is tested against them.

### Verification by substitution

`checkSolution` replaces x with a value and shows the working a learner would write:

```text
2x + 5 = 17          Original equation
2(6) + 5 = 17        Replace x with 6
12 + 5 = 17          Do the multiplication first
17 = 17              Work out each side
```

Identical consecutive lines are merged. The check works for any candidate, and a wrong candidate reports that the sides differ.

## The workspace

The React components are in `components/solver/` and contain no mathematics. They render engine output and send actions to the session reducer.

| Component | Role |
| --- | --- |
| `SolverView` | One level: stage bar and stage content. Moves focus to the new stage. |
| `LevelIntro`, `WorkedExample`, `PracticeRound`, `LevelComplete` | The four stages. |
| `SolverWorkspace` | One interactive exercise. |
| `EquationDisplay` | The large equation. Two matching side panels, the operation highlighted on both. |
| `OperationPicker` | Operation radio buttons, number field with steppers, x button. |
| `FeedbackPanel` | Feedback and hints in a polite live region. |
| `StepHistory` | The worked solution, with undo and start over. |
| `SubstitutionCheck` | The verification panel. |

Accessibility and design details worth knowing:

- Operations are native radio buttons, so arrow keys and screen readers work without custom code. The form submits with Enter.
- The equation is shown visually and read out through a hidden text version, e.g. “x over 3 plus 4 minus 4 equals 9 minus 4”.
- Feedback is in an `aria-live="polite"` region. Every message has an icon and a title, so colour is never the only signal.
- After applying a step, focus moves to **Simplify**; after simplifying it returns to the operations; on a stage change it moves to the new stage marker.
- Motion is limited to short fades, and the global `prefers-reduced-motion` rule turns it off.
- The equation font scales with the width of its own card and the length of the equation, so it fits phones, tablets and laptops.
- Controls are at least 44 px high. Button text meets WCAG AA contrast (white on `#13826f` is 4.7:1).

## Progress

Finishing a practice round stores the level id in `solverLevels` inside the existing `mathlab:progress:v1` entry. This is additive: older stored data is still read correctly, and unreadable data falls back to empty progress. The retired topic id `simple` is mapped to `one-step`. A topic counts as finished when its solver level, an older quiz round or enough good practice is done. Each solved equation earns 10 XP and a finished level earns 20 XP the first time. Solver moves do not change the practice accuracy statistics.

## Adding or changing exercises

See [“Equation solver exercises”](CONTENT_GUIDE.md#equation-solver-exercises) in the content guide.

## Running the tests

```bash
npm test             # run every test once
npm run test:watch   # re-run on change
npm run check        # lint, type check, tests and production build
```

The test runner is [Vitest](https://vitest.dev/). It needs **Node.js 22.22 or newer** (building and running the app only needs 20.9). There are two projects, configured in `vitest.config.mts`:

| Project | Environment | Covers |
| --- | --- | --- |
| `engine` | Node | `lib/**` and `content/**`: arithmetic, parsing, operation validation, solving, substitution, formatting, tutor, session, levels, progress, content validation |
| `ui` | jsdom | `components/**`, `hooks/**`: the workspace, operation picker, level flow, storage hook and the whole app |

Highlights of what is checked:

- Valid transformations, invalid transformations (zero, x multipliers, overflow), negative numbers and exact fractions.
- Randomised checks: thousands of random equations and operations never change the solution, and the tutor's own suggestion is always judged helpful and always reaches a solution.
- Every catalogue exercise parses, is displayed exactly as authored, has one whole-number solution, and takes the number of steps its level promises.
- Every “Solve the equation” quiz question is solved to prove the answer key, and every wrong choice is shown to be wrong.
- Learning interactions: a mistake is explained and not applied, hints escalate and stop, an applied step is highlighted on both sides, focus moves to the next action, undo and restart keep the effort record, a full round completes and is recorded once.
