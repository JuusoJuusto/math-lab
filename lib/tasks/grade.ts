/**
 * Reading and grading a learner's answer.
 *
 * Typed answers are compared as exact values, so "6", "6.0", "x = 6", "12/2"
 * and "6 km" all mean the same thing, and a decimal comma works as well as a
 * point. A wrong answer is shown to fail by substituting it back.
 */

import { checkSolution, equals, formatFraction, parseEquation, parseExpression, type Lang } from "../equations";
import { taskText } from "./text";
import type { Grade, ParsedAnswer, Task } from "./types";

/** `x = 6`, `-3`, `2,5`, `7/2`, `12 km` and similar, as an exact number. */
export function parseAnswer(text: string, lang: Lang = "en"): ParsedAnswer {
  const words = taskText(lang);
  const cleaned = text
    .trim()
    .replace(/[−–]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/^x\s*=\s*/i, "");

  if (cleaned === "") return { ok: false, message: words.typeFirst };

  const match = cleaned.match(/^(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*(?:€|[a-wyz]+)?\.?$/i);
  if (!match) return { ok: false, message: words.justNumber };

  const parsed = parseExpression(match[1]);
  if (!parsed.ok || parsed.value.x.n !== 0) return { ok: false, message: words.notNumber };
  return { ok: true, value: parsed.value.c };
}

export function gradeChoice(task: Task, index: number): Grade {
  if (task.input.type !== "choice") throw new Error("This task is answered by typing");
  return { correct: index === task.input.correct, given: task.input.options[index] ?? "", feedback: [] };
}

/** What happened while a learner solved a task by hand. */
export interface HandOutcome {
  readonly lines: number;
  readonly mistakes: number;
  readonly hints: number;
}

/**
 * Grades a task solved by hand. The equation was solved, since the workspace only
 * finishes on x = a number, so the question is how cleanly: at most one wrong
 * line and no hints counts as right.
 */
export function gradeHand(task: Task, outcome: HandOutcome, lang: Lang = "en"): Grade {
  if (task.input.type !== "hand") throw new Error("This task is not solved by hand");
  const correct = outcome.mistakes <= 1 && outcome.hints === 0;
  const words = taskText(lang);
  return {
    correct,
    given: task.answerText,
    feedback: correct ? [] : [words.handWorked(outcome.lines, outcome.mistakes), words.handNeedsMore],
  };
}

/** Grades a typed answer, or says why it cannot be read yet. */
export function gradeNumber(task: Task, text: string, lang: Lang = "en"): Grade | { readonly invalid: string } {
  if (task.input.type !== "number" || !task.answerValue) throw new Error("This task is answered by choosing");

  const parsed = parseAnswer(text, lang);
  if (!parsed.ok) return { invalid: parsed.message };

  const correct = equals(parsed.value, task.answerValue);
  const given = formatFraction(parsed.value);
  if (correct) return { correct: true, given, feedback: [] };

  // Show why it fails: put it back into the equation.
  const feedback: string[] = [];
  if (task.checkEquation) {
    const equation = parseEquation(task.checkEquation);
    if (equation.ok) {
      const check = checkSolution(equation.value, parsed.value, lang);
      feedback.push(taskText(lang).checkFeedback(given, formatFraction(check.leftValue), formatFraction(check.rightValue)));
    }
  }
  return { correct: false, given, feedback };
}

/** True when a typed task's answer box should be treated as empty. */
export function isInvalid(result: Grade | { readonly invalid: string }): result is { readonly invalid: string } {
  return "invalid" in result;
}
