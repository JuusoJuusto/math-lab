/**
 * The multiple-choice question bank used by practice rounds.
 *
 * Every question belongs to a topic (see content/topics.ts) and has exactly one
 * correct answer. Each question is written once per language; the correct
 * answer is stored as a position in `choices`, so both languages always agree
 * on which choice is right. The tests in content/__tests__ check this, and also
 * solve every "Solve the equation" prompt to prove that the answer key is
 * mathematically right, in both languages.
 */

import type { Lang, Localised } from "../lib/lang";

export type QuestionLevel = "Beginner" | "Intermediate" | "Advanced";

export interface QuestionText {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly explanation: string;
}

export interface QuestionDefinition {
  readonly id: string;
  readonly topic: string;
  readonly level: QuestionLevel;
  /** Position of the correct choice. The same in every language. */
  readonly correct: number;
  readonly text: Localised<QuestionText>;
}

/** A question in one language, ready to show. */
export interface Question {
  id: string;
  topic: string;
  level: QuestionLevel;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
}

/** The words that start an "equation to solve" prompt, in each language. */
export const SOLVE_PREFIX: Localised<string> = { en: "Solve the equation:", fi: "Ratkaise yhtälö:" };

const def = (
  id: string,
  topic: string,
  level: QuestionLevel,
  correct: number,
  en: QuestionText,
  fi: QuestionText,
): QuestionDefinition => ({ id, topic, level, correct, text: { en, fi } });

/**
 * Equation questions. The choices are usually the same numbers in both
 * languages; pass `{ en, fi }` when they differ (a decimal comma in Finnish).
 */
const equationQuestion = (
  id: string,
  topic: string,
  level: QuestionLevel,
  equation: string,
  choices: readonly string[] | Localised<readonly string[]>,
  correct: number,
  explanation: Localised<string>,
): QuestionDefinition => {
  const byLanguage: Localised<readonly string[]> = Array.isArray(choices) ? { en: choices, fi: choices } : (choices as Localised<readonly string[]>);
  return def(
    id,
    topic,
    level,
    correct,
    { prompt: `${SOLVE_PREFIX.en}  ${equation}`, choices: byLanguage.en, explanation: explanation.en },
    { prompt: `${SOLVE_PREFIX.fi}  ${equation}`, choices: byLanguage.fi, explanation: explanation.fi },
  );
};

export const questionDefinitions: readonly QuestionDefinition[] = [
  equationQuestion(
    "q1",
    "one-step",
    "Beginner",
    "x + 7 = 15",
    ["x = 8", "x = 22", "x = 7", "x = 9"],
    0,
    { en: "Subtract 7 from both sides: x = 15 − 7 = 8.", fi: "Vähennä molemmilta puolilta 7: x = 15 − 7 = 8." },
  ),
  equationQuestion(
    "q2",
    "one-step",
    "Beginner",
    "4x = 28",
    ["x = 24", "x = 7", "x = 32", "x = 6"],
    1,
    { en: "Divide both sides by 4: x = 28 / 4 = 7.", fi: "Jaa molemmat puolet luvulla 4: x = 28 : 4 = 7." },
  ),
  equationQuestion(
    "q3",
    "one-step",
    "Beginner",
    "x − 9 = 4",
    ["x = −5", "x = 13", "x = 36", "x = 5"],
    1,
    { en: "Add 9 to both sides: x = 4 + 9 = 13.", fi: "Lisää molemmille puolille 9: x = 4 + 9 = 13." },
  ),
  equationQuestion(
    "q13",
    "one-step",
    "Beginner",
    "x / 5 = 4",
    { en: ["x = 20", "x = 9", "x = 1", "x = 0.8"], fi: ["x = 20", "x = 9", "x = 1", "x = 0,8"] },
    0,
    {
      en: "x is divided by 5, so multiply both sides by 5: x = 4 × 5 = 20.",
      fi: "x on jaettu luvulla 5, joten kerro molemmat puolet luvulla 5: x = 4 · 5 = 20.",
    },
  ),
  equationQuestion(
    "q14",
    "two-step",
    "Intermediate",
    "2x + 5 = 17",
    { en: ["x = 6", "x = 12", "x = 11", "x = 8.5"], fi: ["x = 6", "x = 12", "x = 11", "x = 8,5"] },
    0,
    {
      en: "Subtract 5 from both sides: 2x = 12. Then divide both sides by 2: x = 6.",
      fi: "Vähennä molemmilta puolilta 5: 2x = 12. Jaa sitten molemmat puolet luvulla 2: x = 6.",
    },
  ),
  equationQuestion(
    "q15",
    "two-step",
    "Intermediate",
    "3x − 4 = 20",
    ["x = 8", "x = 24", "x = 16", "x = 7"],
    0,
    {
      en: "Add 4 to both sides: 3x = 24. Then divide both sides by 3: x = 8.",
      fi: "Lisää molemmille puolille 4: 3x = 24. Jaa sitten molemmat puolet luvulla 3: x = 8.",
    },
  ),
  equationQuestion(
    "q16",
    "two-step",
    "Intermediate",
    "x / 3 + 4 = 9",
    ["x = 15", "x = 5", "x = 39", "x = 13"],
    0,
    {
      en: "Subtract 4 from both sides: x / 3 = 5. Then multiply both sides by 3: x = 15.",
      fi: "Vähennä molemmilta puolilta 4: x / 3 = 5. Kerro sitten molemmat puolet luvulla 3: x = 15.",
    },
  ),
  equationQuestion(
    "q17",
    "two-step",
    "Intermediate",
    "5x + 2 = 27",
    ["x = 5", "x = 25", "x = 29", "x = 6"],
    0,
    {
      en: "Subtract 2 from both sides: 5x = 25. Then divide both sides by 5: x = 5.",
      fi: "Vähennä molemmilta puolilta 2: 5x = 25. Jaa sitten molemmat puolet luvulla 5: x = 5.",
    },
  ),
  equationQuestion(
    "q4",
    "both",
    "Intermediate",
    "5x + 2 = 3x + 12",
    ["x = 5", "x = 7", "x = 10", "x = 2"],
    0,
    {
      en: "Subtract 3x and 2: 2x = 10. Divide by 2: x = 5.",
      fi: "Vähennä 3x ja 2: 2x = 10. Jaa luvulla 2: x = 5.",
    },
  ),
  equationQuestion(
    "q5",
    "both",
    "Intermediate",
    "7x − 4 = 4x + 11",
    ["x = 3", "x = 5", "x = 7", "x = 15"],
    1,
    {
      en: "Subtract 4x and add 4: 3x = 15, so x = 5.",
      fi: "Vähennä 4x ja lisää 4: 3x = 15, joten x = 5.",
    },
  ),
  equationQuestion(
    "q6",
    "brackets",
    "Intermediate",
    "2(x + 3) = 18",
    ["x = 6", "x = 9", "x = 12", "x = 3"],
    0,
    {
      en: "Expand the brackets: 2x + 6 = 18. Subtract 6, then divide by 2: x = 6.",
      fi: "Poista sulut: 2x + 6 = 18. Vähennä 6 ja jaa sitten luvulla 2: x = 6.",
    },
  ),
  equationQuestion(
    "q7",
    "brackets",
    "Advanced",
    "3(x − 2) = 2x + 5",
    ["x = 9", "x = 11", "x = 7", "x = 1"],
    1,
    {
      en: "Expand the brackets: 3x − 6 = 2x + 5. Subtract 2x and add 6: x = 11.",
      fi: "Poista sulut: 3x − 6 = 2x + 5. Vähennä 2x ja lisää 6: x = 11.",
    },
  ),
  def(
    "q8",
    "proportion",
    "Beginner",
    2,
    {
      prompt: "2 kg of apples cost €6. How much do 5 kg cost at the same price per kilogram?",
      choices: ["10 €", "12 €", "15 €", "18 €"],
      explanation: "One kilogram costs €6 / 2 = €3. Five kilograms cost 5 × €3 = €15.",
    },
    {
      prompt: "2 kg omenoita maksaa 6 €. Paljonko 5 kg maksaa samalla kilohinnalla?",
      choices: ["10 €", "12 €", "15 €", "18 €"],
      explanation: "Yksi kilo maksaa 6 € : 2 = 3 €. Viisi kiloa maksaa 5 · 3 € = 15 €.",
    },
  ),
  def(
    "q9",
    "proportion",
    "Intermediate",
    2,
    {
      prompt: "On a map, 1 cm represents 4 km. What distance does 3.5 cm represent?",
      choices: ["7 km", "12 km", "14 km", "16 km"],
      explanation: "Distance is directly proportional to map length: 3.5 × 4 km = 14 km.",
    },
    {
      prompt: "Kartalla 1 cm vastaa 4 km:ä. Mitä etäisyyttä 3,5 cm vastaa?",
      choices: ["7 km", "12 km", "14 km", "16 km"],
      explanation: "Etäisyys on suoraan verrannollinen kartan pituuteen: 3,5 · 4 km = 14 km.",
    },
  ),
  def(
    "q10",
    "word",
    "Intermediate",
    1,
    {
      prompt: "Three identical pens cost €6 in total. What is the price of one pen?",
      choices: ["1 €", "2 €", "3 €", "6 €"],
      explanation: "Let x be the price of one pen: 3x = 6. Divide by three to get x = €2.",
    },
    {
      prompt: "Kolme samanlaista kynää maksaa yhteensä 6 €. Mikä on yhden kynän hinta?",
      choices: ["1 €", "2 €", "3 €", "6 €"],
      explanation: "Olkoon x yhden kynän hinta: 3x = 6. Jaa luvulla kolme, jolloin x = 2 €.",
    },
  ),
  def(
    "q11",
    "basics",
    "Beginner",
    1,
    {
      prompt: "Which of the following is an equation?",
      choices: ["3x + 2", "3x + 2 = 11", "x > 4", "2 + 5"],
      explanation: "An equation has an equals sign and two expressions with the same value.",
    },
    {
      prompt: "Mikä seuraavista on yhtälö?",
      choices: ["3x + 2", "3x + 2 = 11", "x > 4", "2 + 5"],
      explanation: "Yhtälössä on yhtäsuuruusmerkki ja kaksi lauseketta, joilla on sama arvo.",
    },
  ),
  def(
    "q12",
    "proportion",
    "Advanced",
    1,
    {
      prompt: "Four workers complete a job in 12 hours. How long would eight workers take at the same rate?",
      choices: ["3 hours", "6 hours", "12 hours", "24 hours"],
      explanation:
        "The number of workers and the time are inversely proportional. Doubling the workforce halves the time: 12 / 2 = 6 hours.",
    },
    {
      prompt: "Neljä työntekijää tekee työn 12 tunnissa. Kuinka kauan kahdeksalta työntekijältä kestäisi samalla vauhdilla?",
      choices: ["3 tuntia", "6 tuntia", "12 tuntia", "24 tuntia"],
      explanation:
        "Työntekijöiden määrä ja aika ovat kääntäen verrannolliset. Kun työntekijöitä on kaksi kertaa enemmän, aika puolittuu: 12 : 2 = 6 tuntia.",
    },
  ),
];

const cache: Partial<Record<Lang, Question[]>> = {};

/** The whole question bank in one language. The list is built once per language; do not change it. */
export function getQuestions(lang: Lang = "en"): Question[] {
  return (cache[lang] ??= buildQuestions(lang));
}

function buildQuestions(lang: Lang): Question[] {
  return questionDefinitions.map((definition) => {
    const text = definition.text[lang];
    return {
      id: definition.id,
      topic: definition.topic,
      level: definition.level,
      prompt: text.prompt,
      choices: [...text.choices],
      answer: text.choices[definition.correct],
      explanation: text.explanation,
    };
  });
}

/** The English question bank. Other languages: {@link getQuestions}. */
export const questions: Question[] = getQuestions("en");

/** The questions that belong to a topic, or the whole bank for the mixed round. */
export function questionsFor(topicId: string, lang: Lang = "en"): Question[] {
  return getQuestions(lang).filter((question) => topicId === "all" || question.topic === topicId);
}
