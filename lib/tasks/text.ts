/**
 * The words of the practice tasks, in each language.
 *
 * Generators decide the maths and call these functions for the sentences.
 */

import type { Lang } from "../lang";
import type { Corruption } from "./corruption";

export interface TaskText {
  readonly expandBrackets: (equation: string) => string;
  readonly solveChoice: string;
  readonly solveTyped: string;
  readonly handPrompt: string;
  readonly handContinue: string;
  readonly handWrite: string;
  readonly handWorked: (lines: number, mistakes: number) => string;
  readonly handNeedsMore: string;
  readonly so: (answer: string) => string;
  readonly trueFalse: readonly [string, string];
  readonly checkPrompt: (value: string) => string;
  readonly bothEqual: (value: string) => string;
  readonly notSolution: (value: string, left: string, right: string, answer: string) => string;
  readonly stepPrompt: string;
  readonly mistakePrompt: string;
  readonly line: (n: number) => string;
  readonly noMistake: string;
  readonly firstWrongLine: (n: number, step: string) => string;
  readonly correctLine: (n: number, equation: string) => string;
  readonly correctSolution: (answer: string) => string;
  readonly allCorrect: string;
  readonly solutionIs: (answer: string) => string;
  readonly errors: Record<Corruption, string>;
  readonly equationPrompt: (story: string) => string;
  /** Typed answers: messages for an answer that cannot be read. */
  readonly typeFirst: string;
  readonly justNumber: string;
  readonly notNumber: string;
  readonly checkFeedback: (value: string, left: string, right: string) => string;
}

const en: TaskText = {
  expandBrackets: (equation) => `Expand the brackets: ${equation}.`,
  solveChoice: "Solve the equation.",
  solveTyped: "Solve the equation. Type the value of x.",
  handPrompt: "Solve the whole equation. Write every line of the solution yourself.",
  handContinue: "Finish the solution. The first lines are written; write the rest yourself.",
  handWrite: "Do the one step you are asked for, and write the equation it gives.",
  handWorked: (lines, mistakes) => `You wrote ${lines} ${lines === 1 ? "line" : "lines"} and made ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}.`,
  handNeedsMore: "A task like this counts as right when it is solved with at most one wrong line and no hints.",
  so: (answer) => `So ${answer}.`,
  trueFalse: ["True", "False"],
  checkPrompt: (value) => `Is x = ${value} a solution of this equation?`,
  bothEqual: (value) => `Both sides are equal, so x = ${value} is a solution.`,
  notSolution: (value, left, right, answer) =>
    `The sides are ${left} and ${right}, so x = ${value} is not a solution. The solution is ${answer}.`,
  stepPrompt: "What was done to both sides?",
  mistakePrompt: "Here is a worked solution. Which line has the first mistake?",
  line: (n) => `Line ${n}`,
  noMistake: "There is no mistake",
  firstWrongLine: (n, step) => `Line ${n} is the first wrong line. The step "${step}" must be done to both sides.`,
  correctLine: (n, equation) => `The correct line ${n} is ${equation}.`,
  correctSolution: (answer) => `The correct solution is ${answer}.`,
  allCorrect: "Every line is correct: each step does the same operation to both sides.",
  solutionIs: (answer) => `The solution is ${answer}, and substituting it gives the same number on both sides.`,
  errors: {
    "wrong-sign":
      "The left side got the right operation, but the right side got the opposite one. Both sides need exactly the same operation.",
    "one-side":
      "The operation was only done on the left side. Whatever you do to one side, you must do to the other side too.",
    arithmetic: "Both sides got the right operation, but the arithmetic on the right side is a little off.",
  },
  equationPrompt: (story) => `${story} Which equation matches the story?`,
  typeFirst: "Type your answer first.",
  justNumber: "Type just a number, like 6, −3 or 7/2.",
  notNumber: "That does not look like a number.",
  checkFeedback: (value, left, right) =>
    `Check: with x = ${value} the left side is ${left} and the right side is ${right}. They are not equal.`,
};

const fi: TaskText = {
  expandBrackets: (equation) => `Poista sulut: ${equation}.`,
  solveChoice: "Ratkaise yhtälö.",
  solveTyped: "Ratkaise yhtälö. Kirjoita x:n arvo.",
  handPrompt: "Ratkaise koko yhtälö. Kirjoita ratkaisun jokainen rivi itse.",
  handContinue: "Viimeistele ratkaisu. Ensimmäiset rivit on kirjoitettu; kirjoita loput itse.",
  handWrite: "Tee yksi pyydetty vaihe ja kirjoita yhtälö, jonka se antaa.",
  handWorked: (lines, mistakes) => `Kirjoitit ${lines} ${lines === 1 ? "rivin" : "riviä"} ja teit ${mistakes} ${mistakes === 1 ? "virheen" : "virhettä"}.`,
  handNeedsMore: "Tällainen tehtävä lasketaan oikeaksi, kun se ratkaistaan enintään yhdellä väärällä rivillä ja ilman vihjeitä.",
  so: (answer) => `Siis ${answer}.`,
  trueFalse: ["Tosi", "Epätosi"],
  checkPrompt: (value) => `Onko x = ${value} tämän yhtälön ratkaisu?`,
  bothEqual: (value) => `Molemmat puolet ovat yhtä suuret, joten x = ${value} on ratkaisu.`,
  notSolution: (value, left, right, answer) =>
    `Puolet ovat ${left} ja ${right}, joten x = ${value} ei ole ratkaisu. Ratkaisu on ${answer}.`,
  stepPrompt: "Mitä molemmille puolille tehtiin?",
  mistakePrompt: "Tässä on ratkaisu vaihe vaiheelta. Missä rivissä on ensimmäinen virhe?",
  line: (n) => `Rivi ${n}`,
  noMistake: "Ei virhettä",
  firstWrongLine: (n, step) => `Rivi ${n} on ensimmäinen väärä rivi. Vaihe ”${step}” täytyy tehdä molemmille puolille.`,
  correctLine: (n, equation) => `Oikea rivi ${n} on ${equation}.`,
  correctSolution: (answer) => `Oikea ratkaisu on ${answer}.`,
  allCorrect: "Jokainen rivi on oikein: jokaisessa vaiheessa molemmille puolille tehdään sama laskutoimitus.",
  solutionIs: (answer) => `Ratkaisu on ${answer}, ja sijoittamalla se saadaan molemmille puolille sama luku.`,
  errors: {
    "wrong-sign":
      "Vasen puoli sai oikean laskutoimituksen, mutta oikea puoli sai vastakkaisen. Molemmille puolille täytyy tehdä täsmälleen sama laskutoimitus.",
    "one-side":
      "Laskutoimitus tehtiin vain vasemmalle puolelle. Mitä tahansa teetkin toiselle puolelle, sinun täytyy tehdä sama myös toiselle.",
    arithmetic: "Molemmat puolet saivat oikean laskutoimituksen, mutta oikean puolen laskussa on pieni virhe.",
  },
  equationPrompt: (story) => `${story} Mikä yhtälö vastaa tarinaa?`,
  typeFirst: "Kirjoita ensin vastauksesi.",
  justNumber: "Kirjoita pelkkä luku, esimerkiksi 6, −3, 2,5 tai 7/2.",
  notNumber: "Tuo ei näytä luvulta.",
  checkFeedback: (value, left, right) =>
    `Tarkistus: kun x = ${value}, vasen puoli on ${left} ja oikea puoli on ${right}. Ne eivät ole yhtä suuret.`,
};

const TEXTS: Record<Lang, TaskText> = { en, fi };

export function taskText(lang: Lang = "en"): TaskText {
  return TEXTS[lang];
}
