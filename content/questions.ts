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
    "q26",
    "basics",
    "Beginner",
    2,
    {
      prompt: "Which of these is an expression, not an equation?",
      choices: ["2x + 7 = 15", "x = 4", "5x − 3", "3 + 4 = 7"],
      explanation: "An expression has no equals sign. The other three each have an equals sign, so they are equations.",
    },
    {
      prompt: "Mikä näistä on lauseke eikä yhtälö?",
      choices: ["2x + 7 = 15", "x = 4", "5x − 3", "3 + 4 = 7"],
      explanation: "Lausekkeessa ei ole yhtäsuuruusmerkkiä. Kolmessa muussa on, joten ne ovat yhtälöitä.",
    },
  ),
  def(
    "q27",
    "basics",
    "Beginner",
    1,
    {
      prompt: "In the equation 4x − 5 = −2x + 9, what is the right-hand side?",
      choices: ["4x − 5", "−2x + 9", "9", "4x − 5 = −2x"],
      explanation: "The equals sign splits an equation into a left side and a right side. The right side is everything after it: −2x + 9.",
    },
    {
      prompt: "Mikä on yhtälön 4x − 5 = −2x + 9 oikea puoli?",
      choices: ["4x − 5", "−2x + 9", "9", "4x − 5 = −2x"],
      explanation: "Yhtäsuuruusmerkki jakaa yhtälön vasempaan ja oikeaan puoleen. Oikea puoli on kaikki sen jälkeen: −2x + 9.",
    },
  ),
  def(
    "q28",
    "basics",
    "Beginner",
    0,
    {
      prompt: "Is x = 3 a solution of 2x − 1 = x + 2?",
      choices: ["Yes: both sides equal 5", "No: the left side is 5 and the right side is 6", "No: the left side is 7 and the right side is 5", "Only if x is negative"],
      explanation: "Substitute 3 for x. Left: 2 · 3 − 1 = 5. Right: 3 + 2 = 5. Both sides are equal, so the equation is true and 3 is a solution.",
    },
    {
      prompt: "Onko x = 3 yhtälön 2x − 1 = x + 2 ratkaisu?",
      choices: ["On: kummankin puolen arvo on 5", "Ei: vasen puoli on 5 ja oikea puoli 6", "Ei: vasen puoli on 7 ja oikea puoli 5", "Vain jos x on negatiivinen"],
      explanation: "Sijoita x:n paikalle 3. Vasen: 2 · 3 − 1 = 5. Oikea: 3 + 2 = 5. Puolet ovat yhtä suuret, joten yhtälö on tosi ja 3 on ratkaisu.",
    },
  ),
  def(
    "q29",
    "basics",
    "Beginner",
    1,
    {
      prompt: "Is x = 4 a solution of 3x − 5 = x + 2?",
      choices: ["Yes: both sides equal 7", "No: the left side is 7 and the right side is 6", "No: the left side is 12 and the right side is 6", "Yes: both sides equal 6"],
      explanation: "Substitute 4 for x. Left: 3 · 4 − 5 = 7. Right: 4 + 2 = 6. The sides differ, so the equation is false and 4 is not a solution.",
    },
    {
      prompt: "Onko x = 4 yhtälön 3x − 5 = x + 2 ratkaisu?",
      choices: ["On: kummankin puolen arvo on 7", "Ei: vasen puoli on 7 ja oikea puoli 6", "Ei: vasen puoli on 12 ja oikea puoli 6", "On: kummankin puolen arvo on 6"],
      explanation: "Sijoita x:n paikalle 4. Vasen: 3 · 4 − 5 = 7. Oikea: 4 + 2 = 6. Puolet eroavat, joten yhtälö on epätosi eikä 4 ole ratkaisu.",
    },
  ),
  def(
    "q30",
    "basics",
    "Intermediate",
    1,
    {
      prompt: "Is x = −2 a solution of 3x + 4 = x?",
      choices: ["No: the left side is 10 and the right side is −2", "Yes: both sides equal −2", "No: the left side is −2 and the right side is 2", "Yes: both sides equal 2"],
      explanation: "Substitute −2 for x, in brackets. Left: 3 · (−2) + 4 = −6 + 4 = −2. Right: −2. Both sides are −2, so the equation is true.",
    },
    {
      prompt: "Onko x = −2 yhtälön 3x + 4 = x ratkaisu?",
      choices: ["Ei: vasen puoli on 10 ja oikea puoli −2", "On: kummankin puolen arvo on −2", "Ei: vasen puoli on −2 ja oikea puoli 2", "On: kummankin puolen arvo on 2"],
      explanation: "Sijoita x:n paikalle −2 sulkeisiin. Vasen: 3 · (−2) + 4 = −6 + 4 = −2. Oikea: −2. Puolet ovat −2, joten yhtälö on tosi.",
    },
  ),
  def(
    "q31",
    "basics",
    "Intermediate",
    2,
    {
      prompt: "You substitute x = −3 into 4x + 1. How should you write it?",
      choices: ["4 − 3 + 1", "43 + 1", "4 · (−3) + 1", "−(4 · 3) − 1"],
      explanation: "A negative number goes in brackets when it replaces x: 4 · (−3) + 1 = −12 + 1 = −11. Without brackets the sign gets lost.",
    },
    {
      prompt: "Sijoitat x = −3 lausekkeeseen 4x + 1. Miten kirjoitat sen?",
      choices: ["4 − 3 + 1", "43 + 1", "4 · (−3) + 1", "−(4 · 3) − 1"],
      explanation: "Negatiivinen luku kirjoitetaan sulkeisiin, kun se sijoitetaan x:n paikalle: 4 · (−3) + 1 = −12 + 1 = −11. Ilman sulkeita etumerkki katoaa.",
    },
  ),
  def(
    "q32",
    "basics",
    "Beginner",
    2,
    {
      prompt: "A balance has three x-balls and a weight of 2 on the left pan, and one x-ball and a weight of 8 on the right pan. Which equation does it show?",
      choices: ["3x + 8 = x + 2", "2x + 3 = 8x + 1", "3x + 2 = x + 8", "5x = 10"],
      explanation: "Each ball is x and each weight is its number. The left pan is 3x + 2 and the right pan is x + 8, so the balance shows 3x + 2 = x + 8.",
    },
    {
      prompt: "Vaa'an vasemmalla vaakakupilla on kolme x-kuulaa ja paino 2, oikealla vaakakupilla yksi x-kuula ja paino 8. Mitä yhtälöä vaaka esittää?",
      choices: ["3x + 8 = x + 2", "2x + 3 = 8x + 1", "3x + 2 = x + 8", "5x = 10"],
      explanation: "Jokainen kuula on x ja jokainen paino on sen luku. Vasen kuppi on 3x + 2 ja oikea kuppi x + 8, joten vaaka esittää yhtälöä 3x + 2 = x + 8.",
    },
  ),
  def(
    "q33",
    "basics",
    "Beginner",
    1,
    {
      prompt: "Write an equation whose left side is 5x − 2 and whose right side is −x + 7.",
      choices: ["5x − 2 − x + 7", "5x − 2 = −x + 7", "5x − 2 = x + 7", "5 − 2x = −x + 7"],
      explanation: "Put the left side, an equals sign and the right side in that order: 5x − 2 = −x + 7. Without the equals sign it would only be an expression.",
    },
    {
      prompt: "Kirjoita yhtälö, jonka vasen puoli on 5x − 2 ja oikea puoli −x + 7.",
      choices: ["5x − 2 − x + 7", "5x − 2 = −x + 7", "5x − 2 = x + 7", "5 − 2x = −x + 7"],
      explanation: "Kirjoita vasen puoli, yhtäsuuruusmerkki ja oikea puoli tässä järjestyksessä: 5x − 2 = −x + 7. Ilman yhtäsuuruusmerkkiä se olisi vain lauseke.",
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
  equationQuestion(
    "q18",
    "fractions",
    "Intermediate",
    "x / 2 + x / 3 = 5",
    { en: ["x = 6", "x = 5", "x = 10", "x = 2.5"], fi: ["x = 6", "x = 5", "x = 10", "x = 2,5"] },
    0,
    {
      en: "The common denominator is 6. Multiply both sides by 6: 3x + 2x = 30, so 5x = 30 and x = 6.",
      fi: "Yhteinen nimittäjä on 6. Kerro molemmat puolet luvulla 6: 3x + 2x = 30, joten 5x = 30 ja x = 6.",
    },
  ),
  equationQuestion(
    "q19",
    "fractions",
    "Advanced",
    "(x + 1) / 2 = 4",
    ["x = 7", "x = 8", "x = 3", "x = 9"],
    0,
    {
      en: "Multiply both sides by 2: x + 1 = 8. Subtract 1: x = 7.",
      fi: "Kerro molemmat puolet luvulla 2: x + 1 = 8. Vähennä 1: x = 7.",
    },
  ),
  def(
    "q20",
    "special",
    "Intermediate",
    0,
    {
      prompt: "How many solutions does 2x + 3 = 2x + 7 have?",
      choices: ["None", "One", "Two", "Infinitely many"],
      explanation: "Subtract 2x from both sides: 3 = 7. That is never true, so the equation has no solution.",
    },
    {
      prompt: "Montako ratkaisua yhtälöllä 2x + 3 = 2x + 7 on?",
      choices: ["Ei yhtään", "Yksi", "Kaksi", "Äärettömän monta"],
      explanation: "Vähennä molemmilta puolilta 2x: 3 = 7. Se ei pidä koskaan paikkaansa, joten yhtälöllä ei ole ratkaisua.",
    },
  ),
  def(
    "q21",
    "special",
    "Advanced",
    3,
    {
      prompt: "How many solutions does 3(x + 1) = 3x + 3 have?",
      choices: ["None", "One", "Two", "Infinitely many"],
      explanation: "Open the brackets: 3x + 3 = 3x + 3. Both sides are always the same, so every number is a solution.",
    },
    {
      prompt: "Montako ratkaisua yhtälöllä 3(x + 1) = 3x + 3 on?",
      choices: ["Ei yhtään", "Yksi", "Kaksi", "Äärettömän monta"],
      explanation: "Poista sulut: 3x + 3 = 3x + 3. Puolet ovat aina samat, joten jokainen luku on ratkaisu.",
    },
  ),
  def(
    "q22",
    "hard-word",
    "Advanced",
    1,
    {
      prompt: "The sum of three consecutive whole numbers is 48. What is the smallest of them?",
      choices: ["14", "15", "16", "17"],
      explanation: "Let the numbers be x, x + 1 and x + 2. Then 3x + 3 = 48, so 3x = 45 and x = 15.",
    },
    {
      prompt: "Kolmen peräkkäisen kokonaisluvun summa on 48. Mikä on pienin niistä?",
      choices: ["14", "15", "16", "17"],
      explanation: "Olkoot luvut x, x + 1 ja x + 2. Silloin 3x + 3 = 48, joten 3x = 45 ja x = 15.",
    },
  ),
  def(
    "q23",
    "hard-word",
    "Advanced",
    1,
    {
      prompt: "A jacket costs €60 after a 25 % discount. What was the price before the discount?",
      choices: ["75 €", "80 €", "85 €", "90 €"],
      explanation: "After a 25 % discount the price is 0.75 of the original: 0.75x = 60, so x = 80.",
    },
    {
      prompt: "Takki maksaa 60 € 25 %:n alennuksen jälkeen. Mikä oli hinta ennen alennusta?",
      choices: ["75 €", "80 €", "85 €", "90 €"],
      explanation: "25 %:n alennuksen jälkeen hinta on 0,75-kertainen alkuperäiseen: 0,75x = 60, joten x = 80.",
    },
  ),
  equationQuestion(
    "q24",
    "challenge",
    "Advanced",
    "2(x + 3) − 4 = x + 9",
    ["x = 7", "x = 5", "x = 11", "x = 3"],
    0,
    {
      en: "Open the brackets: 2x + 6 − 4 = x + 9, so 2x + 2 = x + 9. Subtract x and 2: x = 7.",
      fi: "Poista sulut: 2x + 6 − 4 = x + 9, joten 2x + 2 = x + 9. Vähennä x ja 2: x = 7.",
    },
  ),
  equationQuestion(
    "q25",
    "challenge",
    "Advanced",
    "(x + 2) / 3 = (x − 1) / 2",
    ["x = 7", "x = 1", "x = 4", "x = 8"],
    0,
    {
      en: "Multiply both sides by 6: 2(x + 2) = 3(x − 1). Open the brackets: 2x + 4 = 3x − 3, so x = 7.",
      fi: "Kerro molemmat puolet luvulla 6: 2(x + 2) = 3(x − 1). Poista sulut: 2x + 4 = 3x − 3, joten x = 7.",
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
