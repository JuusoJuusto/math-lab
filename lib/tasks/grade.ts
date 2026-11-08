/**
 * Reading and grading a learner's answer.
 *
 * Typed answers are compared as exact values, so "6", "6.0", "x = 6", "12/2"
 * and "6 km" all mean the same thing, and a decimal comma works as well as a
 * point. A wrong answer is shown to fail by substituting it back.
 */

import { checkSolution, equals, formatFraction, parseEquation, parseExpression } from "../equations";
import type { Grade, ParsedAnswer, Task } from "./types";

/** `x = 6`, `-3`, `2,5`, `7/2`, `12 km` and similar, as an exact number. */
export function parseAnswer(text: string): ParsedAnswer {
  const cleaned = text
    .trim()
    .replace(/[−–]/g, "-")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/^x\s*=\s*/i, "");

  if (cleaned === "") return { ok: false, message: "Type your answer first." };

  const match = cleaned.match(/^(-?\d+(?:\.\d+)?(?:\s*\/\s*\d+)?)\s*(?:€|[a-wyz]+)?\.?$/i);
  if (!match) return { ok: false, message: "Type just a number, like 6, −3 or 7/2." };

  const parsed = parseExpression(match[1]);
  if (!parsed.ok || parsed.value.x.n !== 0) return { ok: false, message: "That does not look like a number." };
  return { ok: true, value: parsed.value.c };
}

export function gradeChoice(task: Task, index: number): Grade {
  if (task.input.type !== "choice") throw new Error("This task is answered by typing");
  return { correct: index === task.input.correct, given: task.input.options[index] ?? "", feedback: [] };
}

/** Grades a typed answer, or says why it cannot be read yet. */
export function gradeNumber(task: Task, text: string): Grade | { readonly invalid: string } {
  if (task.input.type !== "number" || !task.answerValue) throw new Error("This task is answered by choosing");

  const parsed = parseAnswer(text);
  if (!parsed.ok) return { invalid: parsed.message };

  const correct = equals(parsed.value, task.answerValue);
  const given = formatFraction(parsed.value);
  if (correct) return { correct: true, given, feedback: [] };

  // Show why it fails: put it back into the equation.
  const feedback: string[] = [];
  if (task.checkEquation) {
    const equation = parseEquation(task.checkEquation);
    if (equation.ok) {
      const check = checkSolution(equation.value, parsed.value);
      feedback.push(
        `Check: with x = ${given} the left side is ${formatFraction(check.leftValue)} and the right side is ${formatFraction(check.rightValue)}. They are not equal.`,
      );
    }
  }
  return { correct: false, given, feedback };
}

/** True when a typed task's answer box should be treated as empty. */
export function isInvalid(result: Grade | { readonly invalid: string }): result is { readonly invalid: string } {
  return "invalid" in result;
}
