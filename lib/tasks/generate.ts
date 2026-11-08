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
  engineText,
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
  type Lang,
  type Operation,
  type Rng,
} from "../equations";
import { getQuestions } from "../../content/questions";
import { CORRUPTIONS, continueWith, corruptStep, plausibleWrongValues } from "./corruption";
import { displayEquation, int, isEquationTopic, pick, sampleEquation, type Sample } from "./sample";
import { sampleProportion, sampleStory, storyPassage, tiersOfTopic } from "./stories";
import { supports } from "./support";
import { taskText, type TaskText } from "./text";
import type { Task, TaskSpec, WorkedLine } from "./types";

const minus = (text: string) => text.replace(/-/g, "−");
/** An equation as it reads in the language: a true minus, and a decimal comma in Finnish (0,75x). */
const written = (text: string, lang: Lang) => (lang === "fi" ? minus(text).replace(/(\d)\.(\d)/g, "$1,$2") : minus(text));
const xEquals = (value: number) => `x = ${formatFraction(frac(value))}`;

/** The solution written as short lines, e.g. "Subtract 5 from both sides: 2x = 12." */
function workingLines(sample: Sample, lang: Lang): string[] {
  const text = taskText(lang);
  const lines: string[] = [];
  if (sample.text.includes("(")) lines.push(text.expandBrackets(formatEquation(sample.equation)));
  for (const step of solveWithTutor(sample.equation)) {
    lines.push(`${describeOperation(step.operation, lang)}: ${formatEquation(step.after)}.`);
  }
  return lines;
}

function sampleFor(spec: TaskSpec, rng: Rng): Sample {
  if (!isEquationTopic(spec.topic)) throw new Error(`No equations for topic "${spec.topic}"`);
  return sampleEquation(spec.topic, rng);
}

/* ---------------------------- fixed quiz questions --------------------------- */

function bankTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const question = getQuestions(lang).find((item) => item.id === spec.bankId);
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

function chooseTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);
  const sample = sampleFor(spec, rng);
  const steps = solveWithTutor(sample.equation);
  const wrong = plausibleWrongValues(steps, sample.solution, rng).slice(0, 3);
  const values = shuffle([sample.solution, ...wrong], rng);

  return {
    spec,
    kind: "choose",
    topic: spec.topic,
    prompt: text.solveChoice,
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "choice", options: values.map(xEquals), correct: values.indexOf(sample.solution) },
    answerText: xEquals(sample.solution),
    explanation: [...workingLines(sample, lang), text.so(xEquals(sample.solution))],
  };
}

/* -------------------------------- typed answer ------------------------------- */

function solveTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);

  if (spec.topic === "proportion") {
    const problem = sampleProportion(rng);
    const words = problem.i18n[lang];
    return {
      spec,
      kind: "solve",
      topic: spec.topic,
      prompt: words.text,
      input: { type: "number", unit: words.unit },
      answerText: `${problem.solution} ${words.unit}`.trim(),
      answerValue: frac(problem.solution),
      explanation: words.explanation,
    };
  }

  if (spec.topic === "word" || spec.topic === "hard-word") {
    const story = sampleStory(rng, { tiers: tiersOfTopic(spec.topic) });
    const words = story.i18n[lang];
    const sample = { text: story.equations[0], equation: parseEquationOrThrow(story.equations[0]), solution: story.solution };
    return {
      spec,
      kind: "solve",
      topic: spec.topic,
      prompt: `${storyPassage(story, lang)} ${words.question}`,
      input: { type: "number", unit: words.unit },
      answerText: `${story.final ?? story.solution} ${words.unit}`.trim(),
      answerValue: frac(story.final ?? story.solution),
      checkEquation: story.equations[0],
      // When the question asks for something worked out from x, say so: x = 7 is not yet the answer.
      explanation: [words.build, ...workingLines(sample, lang), text.so(`x = ${story.solution}`), ...(story.final !== undefined ? [words.answer] : [])],
    };
  }

  const sample = sampleFor(spec, rng);
  return {
    spec,
    kind: "solve",
    topic: spec.topic,
    prompt: text.solveTyped,
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "number" },
    answerText: xEquals(sample.solution),
    answerValue: frac(sample.solution),
    checkEquation: sample.text,
    explanation: [...workingLines(sample, lang), text.so(xEquals(sample.solution))],
  };
}

function parseEquationOrThrow(text: string): Equation {
  const parsed = parseEquation(text);
  if (!parsed.ok) throw new Error(`Cannot parse "${text}": ${parsed.message}`);
  return parsed.value;
}

/* ------------------------------- solve by hand ------------------------------- */

/** An equation to solve completely, writing every line. It is graded by what happens in the workspace. */
function handTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);
  const sample = sampleFor(spec, rng);
  return {
    spec,
    kind: "hand",
    topic: spec.topic,
    prompt: text.handPrompt,
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "hand", source: sample.text },
    answerText: xEquals(sample.solution),
    answerValue: frac(sample.solution),
    checkEquation: sample.text,
    explanation: [...workingLines(sample, lang), text.so(xEquals(sample.solution))],
  };
}

/* -------------------------------- true or false ------------------------------ */

function checkTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);
  const sample = sampleFor(spec, rng);
  const wrong = plausibleWrongValues(solveWithTutor(sample.equation), sample.solution, rng);
  const claim = rng() < 0.5 || wrong.length === 0 ? sample.solution : wrong[0];
  const isTrue = isSolution(sample.equation, frac(claim));
  const check = checkSolution(sample.equation, frac(claim), lang);
  const value = formatFraction(frac(claim));

  return {
    spec,
    kind: "check",
    topic: spec.topic,
    prompt: text.checkPrompt(value),
    display: { type: "equation", text: displayEquation(sample) },
    input: { type: "choice", options: [...text.trueFalse], correct: isTrue ? 0 : 1 },
    answerText: isTrue ? text.trueFalse[0] : text.trueFalse[1],
    explanation: [
      ...check.lines.slice(1).map((line) => `${line.label}: ${line.text}`),
      isTrue
        ? text.bothEqual(value)
        : text.notSolution(value, formatFraction(check.leftValue), formatFraction(check.rightValue), xEquals(sample.solution)),
    ],
  };
}

/* ------------------------------- which step? --------------------------------- */

/** The right operation and three that are tempting but wrong, all checked against the equation. */
function stepOptions(step: AppliedStep, rng: Rng, lang: Lang): Operation[] {
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
  const seen = new Set([describeOperation(op, lang)]);
  for (const candidate of candidates) {
    const text = describeOperation(candidate, lang);
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

function stepTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const sentences = engineText(lang).session;
  const sample = sampleFor(spec, rng);
  const steps = solveWithTutor(sample.equation);
  const step = steps[int(rng, 0, steps.length - 1)];
  const options = shuffle(stepOptions(step, rng, lang), rng);
  const explanation = explainStep(step, 0, lang);

  return {
    spec,
    kind: "step",
    topic: spec.topic,
    prompt: taskText(lang).stepPrompt,
    display: { type: "change", from: formatEquation(step.before), to: formatEquation(step.after) },
    input: {
      type: "choice",
      options: options.map((candidate) => describeOperation(candidate, lang)),
      correct: options.findIndex((candidate) => candidate === step.operation),
    },
    answerText: describeOperation(step.operation, lang),
    explanation: [
      explanation.why,
      `${sentences.leftSide(explanation.leftWork)}.`,
      `${sentences.rightSide(explanation.rightWork)}.`,
    ],
  };
}

/* ------------------------------ find the mistake ----------------------------- */

function mistakeTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);
  let sample = sampleFor(spec, rng);
  let steps = solveWithTutor(sample.equation);
  for (let attempt = 0; steps.length < 2 && attempt < 20; attempt += 1) {
    sample = sampleFor(spec, rng);
    steps = solveWithTutor(sample.equation);
  }

  const correctLines = steps.map((step) => step.after);
  let lines: Equation[] = correctLines;
  let faultIndex = -1;
  let faultKind: keyof TaskText["errors"] = "wrong-sign";

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
    ...lines.map((line, index) => ({ text: formatEquation(line), note: describeOperation(steps[index].operation, lang) })),
  ];
  const options = [...steps.map((_, index) => text.line(index + 2)), text.noMistake];
  const hasMistake = faultIndex >= 0;
  const correct = hasMistake ? faultIndex : options.length - 1;

  return {
    spec,
    kind: "mistake",
    topic: spec.topic,
    prompt: text.mistakePrompt,
    display: { type: "lines", lines: worked },
    input: { type: "choice", options, correct },
    answerText: options[correct],
    explanation: hasMistake
      ? [
          text.firstWrongLine(faultIndex + 2, describeOperation(steps[faultIndex].operation, lang)),
          text.errors[faultKind],
          text.correctLine(faultIndex + 2, formatEquation(steps[faultIndex].after)),
          text.correctSolution(xEquals(sample.solution)),
        ]
      : [text.allCorrect, text.solutionIs(xEquals(sample.solution))],
  };
}

/* ----------------------------- write the equation ---------------------------- */

function equationTask(spec: TaskSpec, rng: Rng, lang: Lang): Task {
  const text = taskText(lang);
  const story = sampleStory(rng, { tiers: tiersOfTopic(spec.topic) });
  const words = story.i18n[lang];
  const options = shuffle(story.equations, rng);
  const sample = { text: story.equations[0], equation: parseEquationOrThrow(story.equations[0]), solution: story.solution };

  return {
    spec,
    kind: "equation",
    topic: spec.topic,
    prompt: text.equationPrompt(storyPassage(story, lang)),
    input: { type: "choice", options: options.map((option) => written(option, lang)), correct: options.indexOf(story.equations[0]) },
    answerText: written(story.equations[0], lang),
    explanation: [words.build, ...workingLines(sample, lang), text.so(xEquals(story.solution))],
  };
}

/* ------------------------------------ API ------------------------------------ */

/**
 * Builds the task a spec describes. Throws for a kind that does not fit the topic.
 *
 * `lang` only chooses the words. The numbers, the answers and the order of the
 * options come from the spec alone, so the same spec is the same task in every
 * language.
 */
export function generateTask(spec: TaskSpec, lang: Lang = "en"): Task {
  if (spec.kind !== "bank" && !supports(spec.kind, spec.topic)) {
    throw new Error(`"${spec.kind}" tasks are not available for topic "${spec.topic}"`);
  }
  const rng = createRng(spec.seed);
  switch (spec.kind) {
    case "bank":
      return bankTask(spec, rng, lang);
    case "choose":
      return chooseTask(spec, rng, lang);
    case "solve":
      return solveTask(spec, rng, lang);
    case "check":
      return checkTask(spec, rng, lang);
    case "step":
      return stepTask(spec, rng, lang);
    case "mistake":
      return mistakeTask(spec, rng, lang);
    case "equation":
      return equationTask(spec, rng, lang);
    case "hand":
      return handTask(spec, rng, lang);
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
