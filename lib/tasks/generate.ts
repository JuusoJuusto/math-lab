/**
 * Turns a `TaskSpec` into a complete, verified task.
 *
 * The same spec always gives the same task. All mathematics comes from the
 * equation engine: answers are solved, not hard-coded, and the wrong options
 * are real mistakes (see corruption.ts).
 */

import {
  applyOperation,
  checkSolution,
  createRng,
  describeOperation,
  equalsEquation,
  explainStep,
  formatEquation,
  formatFraction,
  frac,
  inverseOperation,
  isSolution,
  operation,
  parseEquation,
  shuffle,
  solveWithTutor,
  solvedValue,
  terminalState,
  type AppliedStep,
  type Equation,
  type Operation,
  type Rng,
} from "../equations";
import { questions } from "../../content/questions";
import { CORRUPTIONS, continueWith, corruptStep, plausibleWrongValues, type Corruption } from "./corruption";
import { displayEquation, int, isEquationTopic, pick, sampleEquation, type Sample } from "./sample";
import { sampleProportion, sampleStory } from "./stories";
import { supports } from "./support";
import type { Task, TaskSpec, WorkedLine } from "./types";

const minus = (text: string) => text.replace(/-/g, "−");
const xEquals = (value: number) => `x = ${formatFraction(frac(value))}`;

/** The solution written as short lines, e.g. "Subtract 5 from both sides: 2x = 12." */
function workingLines(sample: Sample): string[] {
  const lines: string[] = [];
  if (sample.text.includes("(")) lines.push(`Expand the brackets: ${formatEquation(sample.equation)}.`);
  for (const step of solveWithTutor(sample.equation)) {
    lines.push(`${describeOperation(step.operation)}: ${formatEquation(step.after)}.`);
  }
  return lines;
}

function sampleFor(spec: TaskSpec, rng: Rng): Sample {
  if (!isEquationTopic(spec.topic)) throw new Error(`No equations for topic "${spec.topic}"`);
  return sampleEquation(spec.topic, rng);
}

/* ---------------------------- fixed quiz questions --------------------------- */

function bankTask(spec: TaskSpec, rng: Rng): Task {
  const question = questions.find((item) => item.id === spec.bankId);
  if (!question) throw new Error(`Unknown quiz question "${spec.bankId}"`);
  const options = shuffle(question.choices, rng);
  return {
    spec,
    kind: "bank",
    topic: question.topic,
    prompt: question.prompt.replace(/\s{2,}/g, " "),
    input: { type: "choice", options, correct: options.indexOf(question.answer) },
    answerText: question.answer,
    explanation: [question.explanation],
  };
}

/* ------------------------------ multiple choice ------------------------------ */

function chooseTask(spec: TaskSpec, rng: Rng): Task {
  const sample = sampleFor(spec, rng);
  const steps = solveWithTutor(sample.equation);
  const wrong = plausibleWrongValues(steps, sample.solution, rng).slice(0, 3);
  const values = shuffle([sample.solution, ...wrong], rng);

  return {
    spec,
    kind: "choose",
    topic: spec.topic,
    prompt: "Solve the equation.",
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "choice", options: values.map(xEquals), correct: values.indexOf(sample.solution) },
    answerText: xEquals(sample.solution),
    explanation: [...workingLines(sample), `So ${xEquals(sample.solution)}.`],
  };
}

/* -------------------------------- typed answer ------------------------------- */

function solveTask(spec: TaskSpec, rng: Rng): Task {
  if (spec.topic === "proportion") {
    const problem = sampleProportion(rng);
    return {
      spec,
      kind: "solve",
      topic: spec.topic,
      prompt: problem.text,
      input: { type: "number", unit: problem.unit },
      answerText: `${problem.solution} ${problem.unit}`.trim(),
      answerValue: frac(problem.solution),
      explanation: problem.explanation,
    };
  }

  if (spec.topic === "word") {
    const story = sampleStory(rng);
    const sample = { text: story.equations[0], equation: parseEquationOrThrow(story.equations[0]), solution: story.solution };
    return {
      spec,
      kind: "solve",
      topic: spec.topic,
      prompt: `${story.text} ${story.question}`,
      input: { type: "number", unit: story.unit },
      answerText: `${story.solution} ${story.unit}`.trim(),
      answerValue: frac(story.solution),
      checkEquation: story.equations[0],
      explanation: [story.build, ...workingLines(sample), `So x = ${story.solution}.`],
    };
  }

  const sample = sampleFor(spec, rng);
  return {
    spec,
    kind: "solve",
    topic: spec.topic,
    prompt: "Solve the equation. Type the value of x.",
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "number" },
    answerText: xEquals(sample.solution),
    answerValue: frac(sample.solution),
    checkEquation: sample.text,
    explanation: [...workingLines(sample), `So ${xEquals(sample.solution)}.`],
  };
}

function parseEquationOrThrow(text: string): Equation {
  const parsed = parseEquation(text);
  if (!parsed.ok) throw new Error(`Cannot parse "${text}": ${parsed.message}`);
  return parsed.value;
}

/* -------------------------------- true or false ------------------------------ */

function checkTask(spec: TaskSpec, rng: Rng): Task {
  const sample = sampleFor(spec, rng);
  const wrong = plausibleWrongValues(solveWithTutor(sample.equation), sample.solution, rng);
  const claim = rng() < 0.5 || wrong.length === 0 ? sample.solution : wrong[0];
  const isTrue = isSolution(sample.equation, frac(claim));
  const check = checkSolution(sample.equation, frac(claim));

  return {
    spec,
    kind: "check",
    topic: spec.topic,
    prompt: `Is x = ${formatFraction(frac(claim))} a solution of this equation?`,
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "choice", options: ["True", "False"], correct: isTrue ? 0 : 1 },
    answerText: isTrue ? "True" : "False",
    explanation: [
      ...check.lines.slice(1).map((line) => `${line.label}: ${line.text}`),
      isTrue
        ? `Both sides are equal, so x = ${formatFraction(frac(claim))} is a solution.`
        : `The sides are ${formatFraction(check.leftValue)} and ${formatFraction(check.rightValue)}, so x = ${formatFraction(frac(claim))} is not a solution. The solution is ${xEquals(sample.solution)}.`,
    ],
  };
}

/* ------------------------------- which step? --------------------------------- */

/** The right operation and three that are tempting but wrong, all checked against the equation. */
function stepOptions(step: AppliedStep, rng: Rng): Operation[] {
  const op = step.operation;
  const base = op.amount.n;
  const additive = op.kind === "add" || op.kind === "subtract";
  const otherKind = additive ? pick(rng, ["multiply", "divide"] as const) : pick(rng, ["add", "subtract"] as const);
  // A nearby number that is never zero.
  const nudge = (delta: number) => (base + delta === 0 ? base + delta + 1 : base + delta);

  const candidates: Operation[] = [
    inverseOperation(op),
    operation(op.kind, nudge(pick(rng, [1, 2, -1, -2])), op.withVariable),
    operation(otherKind, Math.abs(base), false),
    operation(op.kind, nudge(pick(rng, [3, 4, -3])), op.withVariable),
    operation(otherKind, Math.abs(base) + 1, false),
    operation(op.kind, nudge(5), op.withVariable),
  ];

  const chosen: Operation[] = [op];
  const seen = new Set([describeOperation(op)]);
  for (const candidate of candidates) {
    const text = describeOperation(candidate);
    const result = applyOperation(step.before, candidate);
    // Every wrong option must really lead somewhere else, so only one answer fits.
    const leadsElsewhere = result.ok && !equalsEquation(result.step.after, step.after);
    const sensible = candidate.amount.n !== 0 && Math.abs(candidate.amount.n) <= 99;
    if (!seen.has(text) && leadsElsewhere && sensible) {
      seen.add(text);
      chosen.push(candidate);
    }
    if (chosen.length === 4) break;
  }
  return chosen;
}

function stepTask(spec: TaskSpec, rng: Rng): Task {
  const sample = sampleFor(spec, rng);
  const steps = solveWithTutor(sample.equation);
  const step = steps[int(rng, 0, steps.length - 1)];
  const options = shuffle(stepOptions(step, rng), rng);
  const explanation = explainStep(step);

  return {
    spec,
    kind: "step",
    topic: spec.topic,
    prompt: "What was done to both sides?",
    display: { type: "change", from: formatEquation(step.before), to: formatEquation(step.after) },
    input: { type: "choice", options: options.map(describeOperation), correct: options.findIndex((candidate) => candidate === step.operation) },
    answerText: describeOperation(step.operation),
    explanation: [explanation.why, `Left side: ${explanation.leftWork}.`, `Right side: ${explanation.rightWork}.`],
  };
}

/* ------------------------------ find the mistake ----------------------------- */

const ERROR_TEXT: Record<Corruption, string> = {
  "wrong-sign": "The left side got the right operation, but the right side got the opposite one. Both sides need exactly the same operation.",
  "one-side": "The operation was only done on the left side. Whatever you do to one side, you must do to the other side too.",
  arithmetic: "Both sides got the right operation, but the arithmetic on the right side is a little off.",
};

function mistakeTask(spec: TaskSpec, rng: Rng): Task {
  let sample = sampleFor(spec, rng);
  let steps = solveWithTutor(sample.equation);
  for (let attempt = 0; steps.length < 2 && attempt < 20; attempt += 1) {
    sample = sampleFor(spec, rng);
    steps = solveWithTutor(sample.equation);
  }

  const correctLines = steps.map((step) => step.after);
  let lines: Equation[] = correctLines;
  let faultIndex = -1;
  let faultKind: Corruption = "wrong-sign";

  if (rng() < 0.7) {
    for (let attempt = 0; attempt < 30 && faultIndex < 0; attempt += 1) {
      const index = int(rng, 0, steps.length - 1);
      const kind = pick(rng, CORRUPTIONS);
      const faulty = corruptStep(steps[index], kind, rng);
      if (!faulty) continue;
      const rest = continueWith(faulty, steps.slice(index + 1));
      const final = rest.length ? rest[rest.length - 1] : faulty;
      const value = solvedValue(final);
      // Keep it tidy: the wrong working should still end in a whole number.
      if (terminalState(final) !== "solved" || !value || value.d !== 1) continue;
      lines = [...correctLines.slice(0, index), faulty, ...rest];
      faultIndex = index;
      faultKind = kind;
    }
  }

  const worked: WorkedLine[] = [
    { text: displayEquation(sample) },
    ...lines.map((line, index) => ({ text: formatEquation(line), note: describeOperation(steps[index].operation) })),
  ];
  const options = [...steps.map((_, index) => `Line ${index + 2}`), "There is no mistake"];
  const hasMistake = faultIndex >= 0;
  const correct = hasMistake ? faultIndex : options.length - 1;

  return {
    spec,
    kind: "mistake",
    topic: spec.topic,
    prompt: "Here is a worked solution. Which line has the first mistake?",
    display: { type: "lines", lines: worked },
    input: { type: "choice", options, correct },
    answerText: options[correct],
    explanation: hasMistake
      ? [
          `Line ${faultIndex + 2} is the first wrong line. The step "${describeOperation(steps[faultIndex].operation)}" must be done to both sides.`,
          ERROR_TEXT[faultKind],
          `The correct line ${faultIndex + 2} is ${formatEquation(steps[faultIndex].after)}.`,
          `The correct solution is ${xEquals(sample.solution)}.`,
        ]
      : [
          "Every line is correct: each step does the same operation to both sides.",
          `The solution is ${xEquals(sample.solution)}, and substituting it gives the same number on both sides.`,
        ],
  };
}

/* ----------------------------- write the equation ---------------------------- */

function equationTask(spec: TaskSpec, rng: Rng): Task {
  const story = sampleStory(rng);
  const options = shuffle(story.equations, rng);
  const sample = { text: story.equations[0], equation: parseEquationOrThrow(story.equations[0]), solution: story.solution };

  return {
    spec,
    kind: "equation",
    topic: "word",
    prompt: `${story.text} Which equation matches the story?`,
    input: { type: "choice", options: options.map(minus), correct: options.indexOf(story.equations[0]) },
    answerText: minus(story.equations[0]),
    explanation: [story.build, ...workingLines(sample), `So ${xEquals(story.solution)}.`],
  };
}

/* ------------------------------------ API ------------------------------------ */

/** Builds the task a spec describes. Throws for a kind that does not fit the topic. */
export function generateTask(spec: TaskSpec): Task {
  if (spec.kind !== "bank" && !supports(spec.kind, spec.topic)) {
    throw new Error(`"${spec.kind}" tasks are not available for topic "${spec.topic}"`);
  }
  const rng = createRng(spec.seed);
  switch (spec.kind) {
    case "bank":
      return bankTask(spec, rng);
    case "choose":
      return chooseTask(spec, rng);
    case "solve":
      return solveTask(spec, rng);
    case "check":
      return checkTask(spec, rng);
    case "step":
      return stepTask(spec, rng);
    case "mistake":
      return mistakeTask(spec, rng);
    case "equation":
      return equationTask(spec, rng);
  }
}

/** A text fingerprint, used to avoid showing the same task twice in one session. */
export function taskFingerprint(task: Task): string {
  const display = task.display;
  const shown = !display
    ? ""
    : display.type === "equation"
      ? display.text
      : display.type === "change"
        ? `${display.from}>${display.to}`
        : display.lines.map((line) => line.text).join(">");
  return `${task.kind}|${task.prompt}|${shown}`;
}
