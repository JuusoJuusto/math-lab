/**
 * Everything the engine says to a learner, as one contract per language.
 *
 * The engine decides *what* is true (a move is helpful, a term cancels, an
 * equation has no solution). These dictionaries decide *how it is said*. Each
 * entry is a full sentence or a function that builds one, because word order
 * differs between languages: a sentence is never assembled from fragments in
 * the calling code.
 *
 * Numbers arrive already formatted (`5`, `3x`, `−2`, `7/2`).
 */

import type { InvalidOperationCode, OperationKind } from "./operations";

export interface ProblemText {
  readonly title: string;
  readonly message: string;
}

export interface FlipExplanation {
  /** Why the term may change sides: it is shorthand for doing the same to both sides. */
  readonly term: (term: string, becomes: string, bar: string, phrase: string) => string;
  readonly factorDivide: (factor: string) => string;
  readonly factorMultiply: (factor: string) => string;
  readonly movedLine: (moved: string) => string;
  readonly sameAs: (bar: string) => string;
  readonly notHelpfulTitle: string;
  readonly notHelpful: (term: string) => string;
}

export interface BuildText {
  readonly exact: { readonly title: string; readonly body: string };
  readonly equivalent: { readonly title: string; readonly body: string };
  readonly answerGiven: { readonly title: string; readonly body: string };
  readonly noVariable: { readonly title: string; readonly body: string };
  readonly sign: { readonly title: string; readonly body: string };
  readonly swapped: { readonly title: string; readonly body: string };
  readonly total: { readonly title: string; readonly body: string };
  readonly general: { readonly title: string; readonly body: string };
}

export interface EngineText {
  /** The multiplication and division signs used in written working. */
  readonly times: string;
  readonly divide: string;
  /** "Add", "Subtract", ... exactly as they appear on the operation buttons. */
  readonly kindNames: Record<OperationKind, string>;
  /** The names of the two ways of moving: the same on both sides, or flipping a term across. */
  readonly modeNames: { readonly balance: string; readonly flip: string };
  /** "add 5 to both sides", lower case, ready for a sentence. */
  readonly phrase: (kind: OperationKind, amount: string) => string;
  /** Rewrites maths text so that screen readers pronounce it sensibly. */
  readonly speech: (text: string) => string;
  readonly problems: Record<InvalidOperationCode, ProblemText>;

  readonly check: {
    readonly original: string;
    readonly replace: (value: string) => string;
    readonly multiplyFirst: string;
    readonly workOut: string;
  };

  readonly tutor: {
    readonly praise: readonly string[];
    /** `x is divided by 3` / `x is multiplied by 2`: what has been done to x. */
    readonly dividedBy: (amount: string) => string;
    readonly multipliedBy: (amount: string) => string;

    readonly cancelsVariable: (kind: OperationKind, amount: string, term: string) => string;
    readonly cancelsSubtracted: (attached: string, amount: string) => string;
    readonly cancelsAdded: (attached: string, amount: string) => string;
    readonly staysEqual: string;
    readonly negativeNote: string;
    readonly orderNote: string;
    readonly undoDivide: (words: string, amount: string) => string;
    readonly undoMultiply: (words: string, amount: string) => string;
    readonly simpler: string;

    readonly solved: (value: string, sameAs: string | null) => string;
    readonly noSolution: (equation: string) => string;
    readonly infinite: (equation: string) => string;
    readonly nextCollect: string;
    readonly nextConstant: string;
    readonly nextCoefficient: (words: string) => string;

    readonly noChange: ProblemText;
    readonly awkward: (kind: OperationKind, amount: string, result: string) => ProblemText;
    readonly wrongDirectionAdditive: (kind: OperationKind, amount: string) => ProblemText;
    readonly wrongDirectionMultiplicative: (kind: OperationKind, amount: string) => ProblemText;
    readonly wrongTermNumber: ProblemText;
    readonly wrongTermVariable: ProblemText;
    readonly wrongAmount: ProblemText;
    readonly movesAway: (differentKind: boolean) => ProblemText;
    readonly noProgress: ProblemText;

    readonly hintCollect1: string;
    readonly hintCollect2: (subtract: boolean) => string;
    readonly hintConstant1: string;
    readonly hintConstant2: (subtracted: boolean, attached: string) => string;
    readonly hintCoefficient1: string;
    readonly hintCoefficient2: (unitFraction: boolean, words: string) => string;
    /** Hint 3: the exact move, written out. */
    readonly worked: (phrase: string, left: string, right: string, howTo: string) => string;
    readonly howToEnter: (kindName: string, amount: string, withVariable: boolean) => string;
    readonly flipTip: (term: string, becomes: string) => string;
  };

  readonly session: {
    readonly leftSide: (work: string) => string;
    readonly rightSide: (work: string) => string;
    readonly alone: string;
    readonly noSolution: string;
    readonly infinite: string;
    readonly repeatedTitle: string;
    readonly repeatedBody: string;
    readonly nowWeHave: (equation: string) => string;
  };

  readonly flip: FlipExplanation;
  readonly build: BuildText;
}
