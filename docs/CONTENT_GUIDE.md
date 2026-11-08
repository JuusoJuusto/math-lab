# Learning content guide

## Audience and scope

The initial content is designed for introductory lower-secondary mathematics, with an emphasis on equations and proportional relationships. Content should be understandable without assuming that a learner has already mastered algebraic notation.

## Current topic catalogue

| Topic | Learning goal |
| --- | --- |
| Understanding equations | Explain equality and the meaning of an unknown |
| One-step and two-step equations | Undo operations while preserving equality |
| Variables on both sides | Collect like terms and isolate the variable |
| Equations with brackets | Apply the distributive property |
| Proportional relationships | Recognise direct and inverse proportion |
| Word problems | Translate a situation into an equation |

## Exercise authoring rules

- Use one clear learning objective per question.
- Ensure the correct answer is mathematically correct and unique.
- Make distractors plausible and tied to common misconceptions.
- Explain the method, not merely the answer.
- Use consistent notation and units.
- Avoid ambiguous wording and unnecessary reading complexity.
- Include a mix of introductory, intermediate and advanced tasks.
- Verify every answer independently before merging content.

## Question data

The current question bank is defined in `app/page.tsx`. Each question has:
- A stable `id`.
- A `topic` identifier matching the topic catalogue.
- A `level` of `Beginner`, `Intermediate` or `Advanced`.
- A prompt and a list of answer choices.
- One correct answer.
- A concise explanation.

When the content grows, move the catalogue and question bank into dedicated typed files under `content/` and add automated validation for duplicate IDs, missing topics and invalid answer keys.
