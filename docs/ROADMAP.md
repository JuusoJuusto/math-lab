# Product roadmap

This roadmap describes the intended evolution of MathLab. Checked items are present in the repository; unchecked items are planned work, not shipped functionality.

## Learning experience

- [x] Topic catalogue with eleven learning areas, in Finnish and English
- [x] Short lesson notes and worked explanations
- [x] Multiple-choice practice with immediate feedback
- [x] End-of-round results screen
- [x] Browser-local progress summary
- [x] Step-by-step equation solver with the same operation applied to both sides (one-step, two-step and both-sides levels)
- [x] Hints that reveal one reasoning step at a time
- [x] Verification of a solution by substitution
- [x] Typed numeric answers
- [ ] Typed algebraic answers (the learner writes an expression or an equation)
- [x] Brackets in the equation solver (clean-up questions: open the brackets, simplify)
- [x] Solver equations with fractions and ratios (clear the denominators first)
- [x] A level on equations with no solution or infinitely many solutions
- [x] Solver word problems: write the whole equation from a blank field, then solve it (two levels, six tiers)
- [x] A challenge level of long mixed equations
- [x] Several ways to solve: both sides with the `| + 5` notation, flipping a term, working backwards, and checking on a graph
- [ ] Solver equations with decimals (decimals work in typed equations, but not as exercises)
- [ ] Trial and improvement ("guess and check") as another way to solve
- [x] Mistake review and retry queue ("Fix your mistakes")
- [x] Varied task types for exam practice: typed answers, true or false, which step, find the mistake, write the equation, time attack, daily challenge
- [x] XP and levels
- [ ] Difficulty selection and adaptive practice
- [ ] More exercises per topic with validated answer keys (equation exercises and quiz equations are already validated by tests)

## Visual mathematics

- [ ] Interactive balance-scale model for equations
- [ ] Proportionality tables with editable values
- [x] A graph of each side of an equation, crossing at the solution
- [ ] Coordinate-plane graphs for direct and inverse proportion
- [ ] Visual fraction and ratio models
- [x] Equation transformation history with undo

## Platform

- [x] Automated tests for the equation engine, content and learning interactions
- [ ] Topic-level mastery and learning streaks
- [ ] Export and import local progress
- [ ] Optional account sync, only if a backend is introduced
- [x] Finnish and English for the whole interface, the tutor, tasks, stories and lessons, with their own addresses (`/fi/`, `/en/`)
- [ ] Further languages (the structure is ready: see the languages guide)
- [ ] Teacher-friendly assignment mode

## Product principles

1. Teach the reasoning, not only the final answer.
2. Give useful feedback that explains why an answer works.
3. Keep navigation obvious and exercises short.
4. Make the interface work well on phones, tablets and school computers.
5. Keep learning progress private and local by default.
6. Prefer original examples, illustrations and interactions.
