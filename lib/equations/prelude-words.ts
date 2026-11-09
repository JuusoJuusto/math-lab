/**
 * What the clean-up questions say, in the learner's language: the name of the
 * stage, the question, and the explanation of the right answer. One place, so
 * a new kind of clean-up step (brackets, simplifying, decimals) only has to be
 * added once. Decimal numbers are drawn with a comma in Finnish.
 */

import type { Lang } from "../lang";
import { localiseDecimals } from "./format";
import type { PreludeStep } from "./prelude";
import { engineText } from "./text";

export interface PreludeWords {
  /** Shows a number or expression in the language's way of writing decimals. */
  readonly local: (text: string) => string;
  readonly stage: (step: PreludeStep) => string;
  /** The question; `part` may be replaced, for instance with a version that does not break across lines. */
  readonly question: (step: PreludeStep, part?: string) => string;
  readonly right: (step: PreludeStep) => string;
}

export function preludeWords(lang: Lang): PreludeWords {
  const words = engineText(lang).prelude;
  const local = (text: string) => localiseDecimals(text, lang);
  return {
    local,
    stage: (step) => (step.kind === "expand" ? words.expandStage : step.kind === "simplify" ? words.simplifyStage : words.decimalsStage),
    question: (step, part = local(step.part)) =>
      step.kind === "expand"
        ? words.expandQuestion(part)
        : step.kind === "simplify"
          ? words.simplifyQuestion(part)
          : words.decimalsQuestion(part, step.factor ?? 10),
    right: (step) => {
      const part = local(step.part);
      const result = local(step.result);
      return step.kind === "expand"
        ? words.expandRight(part, result)
        : step.kind === "simplify"
          ? words.simplifyRight(part, result)
          : words.decimalsRight(part, result, step.factor ?? 10);
    },
  };
}
