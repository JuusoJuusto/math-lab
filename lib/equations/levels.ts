/**
 * The solver's learning progression and exercise catalogue.
 *
 * Exercises are authored as plain strings in standard form (x term first), for
 * example "3x - 4 = 20". The parser turns them into exact equations at run
 * time, and the automated tests prove that every exercise parses, has a single
 * whole-number solution and can be solved in the number of steps the level
 * promises. To add an exercise, add a line to a pool; see docs/CONTENT_GUIDE.md.
 *
 * Pools are ordered from easier to harder. A round picks a random subset and
 * keeps this order, so each round ramps up gently.
 *
 * The last level, word problems, has no pool of equations. Its exercises are
 * stories (lib/tasks/stories.ts) where the learner first writes the equation.
 */

import type { Lang, Localised } from "../lang";
import type { Equation } from "./expression";
import { mustParseEquation } from "./parse";

export type LevelId = "one-step" | "two-step" | "both" | "word";

export interface ExerciseDefinition {
  /** Stable identifier. Never reuse an id for a different equation. */
  readonly id: string;
  /** Equation text in standard form, for example "2x + 5 = 17". */
  readonly equation: string;
}

/** Everything a learner reads about a level, in one language. */
export interface LevelText {
  readonly title: string;
  readonly tagline: string;
  readonly intro: {
    readonly lead: string;
    readonly points: readonly string[];
    readonly keyIdea: string;
  };
  /** One sentence introducing the worked example. */
  readonly exampleLead: string;
}

export interface LevelDefinition {
  /** Matches the id of the topic that hosts this level. */
  readonly id: LevelId;
  readonly number: 1 | 2 | 3 | 4;
  /**
   * `equations` levels draw from a pool of equations; `stories` levels give a
   * word problem where the learner first writes the equation.
   */
  readonly kind: "equations" | "stories";
  readonly text: Localised<LevelText>;
  readonly example: {
    /** The equation that is solved in the worked example (and, for stories, the story's own equation). */
    readonly equation: string;
  };
  /** How many equations (or stories) a practice round contains. */
  readonly roundSize: number;
  readonly exercises: readonly ExerciseDefinition[];
}

/** The wording of a level in a language. */
export function levelText(level: LevelDefinition, lang: Lang = "en"): LevelText {
  return level.text[lang];
}

const one = (n: number, equation: string): ExerciseDefinition => ({ id: `one-step-${String(n).padStart(2, "0")}`, equation });
const two = (n: number, equation: string): ExerciseDefinition => ({ id: `two-step-${String(n).padStart(2, "0")}`, equation });
const both = (n: number, equation: string): ExerciseDefinition => ({ id: `both-${String(n).padStart(2, "0")}`, equation });

export const LEVELS: readonly LevelDefinition[] = [
  {
    id: "one-step",
    number: 1,
    kind: "equations",
    text: {
      en: {
        title: "One-step equations",
        tagline: "Undo one operation to find x",
        intro: {
          lead: "In a one-step equation, x has just one operation attached to it. Undo that operation and x is on its own.",
          points: [
            "Addition and subtraction undo each other.",
            "Multiplication and division undo each other.",
            "Whatever you do to one side, you must do to the other side too.",
          ],
          keyIdea: "An equation is like a balanced scale. Do the same thing to both sides and it stays balanced.",
        },
        exampleLead: "Here, 5 has been added to x. To get x alone, we undo the addition.",
      },
      fi: {
        title: "Yhden askeleen yhtälöt",
        tagline: "Kumoa yksi laskutoimitus, niin löydät x:n",
        intro: {
          lead: "Yhden askeleen yhtälössä x:ään on liitetty vain yksi laskutoimitus. Kumoa se, niin x jää yksin.",
          points: [
            "Yhteenlasku ja vähennyslasku kumoavat toisensa.",
            "Kertolasku ja jakolasku kumoavat toisensa.",
            "Mitä teetkin toiselle puolelle, tee myös toiselle.",
          ],
          keyIdea: "Yhtälö on kuin tasapainossa oleva vaaka. Kun teet molemmille puolille saman asian, se pysyy tasapainossa.",
        },
        exampleLead: "Tässä x:ään on lisätty 5. Jotta x jää yksin, kumotaan yhteenlasku.",
      },
    },
    example: { equation: "x + 5 = 12" },
    roundSize: 5,
    exercises: [
      one(1, "x + 9 = 15"),
      one(2, "x - 7 = 9"),
      one(3, "3x = 21"),
      one(4, "x/4 = 6"),
      one(5, "x - 3 = 11"),
      one(6, "5x = 40"),
      one(7, "x/2 = 9"),
      one(8, "x + 12 = 20"),
      one(9, "x - 12 = 8"),
      one(10, "4x = 36"),
      one(11, "x/5 = 4"),
      one(12, "x + 8 = 17"),
    ],
  },
  {
    id: "two-step",
    number: 2,
    kind: "equations",
    text: {
      en: {
        title: "Two-step equations",
        tagline: "Undo two operations, in the right order",
        intro: {
          lead: "In a two-step equation, x has two operations attached to it. Undo them in reverse order: first the adding or subtracting, then the multiplying or dividing.",
          points: [
            "In 2x + 5, x is multiplied by 2 first and then 5 is added.",
            "To undo that, work backwards: subtract 5 first, then divide by 2.",
            "After every step, look at what is still attached to x.",
          ],
          keyIdea: "The last thing done to x is the first thing to undo.",
        },
        exampleLead: "Here, x was multiplied by 2 and then 5 was added. We undo the + 5 first.",
      },
      fi: {
        title: "Kahden askeleen yhtälöt",
        tagline: "Kumoa kaksi laskutoimitusta oikeassa järjestyksessä",
        intro: {
          lead: "Kahden askeleen yhtälössä x:ään on liitetty kaksi laskutoimitusta. Kumoa ne käänteisessä järjestyksessä: ensin yhteen- tai vähennyslasku, sitten kerto- tai jakolasku.",
          points: [
            "Lausekkeessa 2x + 5 x kerrotaan ensin kahdella ja sitten siihen lisätään 5.",
            "Kumoa se takaperin: vähennä ensin 5 ja jaa sitten kahdella.",
            "Katso jokaisen askeleen jälkeen, mitä x:n vieressä on vielä.",
          ],
          keyIdea: "Viimeisenä x:lle tehty asia kumotaan ensimmäisenä.",
        },
        exampleLead: "Tässä x kerrottiin kahdella ja sitten siihen lisättiin 5. Kumoamme ensin + 5:n.",
      },
    },
    example: { equation: "2x + 5 = 17" },
    roundSize: 5,
    exercises: [
      two(1, "3x + 4 = 19"),
      two(2, "5x + 2 = 27"),
      two(3, "4x + 3 = 19"),
      two(4, "3x - 4 = 20"),
      two(5, "6x - 5 = 25"),
      two(6, "2x - 9 = 5"),
      two(7, "x/3 + 4 = 9"),
      two(8, "x/2 - 3 = 4"),
      two(9, "x/4 + 2 = 6"),
      two(10, "7x + 1 = 50"),
      two(11, "x/5 - 2 = 3"),
      two(12, "4x - 10 = 22"),
    ],
  },
  {
    id: "both",
    number: 3,
    kind: "equations",
    text: {
      en: {
        title: "Variables on both sides",
        tagline: "Collect the x terms, then solve",
        intro: {
          lead: "Sometimes x appears on both sides. Collect the x terms on one side first, then solve as before. Take care with the signs when negative numbers appear.",
          points: [
            "Remove one x term by doing the opposite operation to both sides.",
            "A minus sign belongs to the term after it: in 3x − 5, the number being subtracted is 5.",
            "Dividing by a negative number changes the sign of the number on the other side too.",
          ],
          keyIdea: "Get all the x terms on one side and all the plain numbers on the other.",
        },
        exampleLead: "x is on both sides, so first we collect the x terms on one side.",
      },
      fi: {
        title: "Muuttuja molemmilla puolilla",
        tagline: "Kokoa x-termit yhteen ja ratkaise sitten",
        intro: {
          lead: "Joskus x on yhtälön molemmilla puolilla. Kokoa ensin x-termit yhdelle puolelle ja ratkaise sitten kuten ennen. Varo merkkejä, kun mukana on negatiivisia lukuja.",
          points: [
            "Poista yksi x-termi tekemällä molemmille puolille käänteinen laskutoimitus.",
            "Miinusmerkki kuuluu sen jälkeen tulevalle termille: lausekkeessa 3x − 5 vähennettävä luku on 5.",
            "Kun jaat negatiivisella luvulla, myös toisen puolen luvun merkki vaihtuu.",
          ],
          keyIdea: "Kokoa kaikki x-termit yhdelle puolelle ja kaikki pelkät luvut toiselle.",
        },
        exampleLead: "x on molemmilla puolilla, joten kokoamme ensin x-termit yhdelle puolelle.",
      },
    },
    example: { equation: "6x - 4 = 2x + 8" },
    roundSize: 5,
    exercises: [
      both(1, "4x + 1 = 2x + 9"),
      both(2, "6x + 1 = 4x + 11"),
      both(3, "7x - 3 = 4x + 12"),
      both(4, "3x - 5 = x + 7"),
      both(5, "8x - 6 = 5x + 9"),
      both(6, "6x + 4 = 2x + 20"),
      both(7, "5x - 8 = 2x - 2"),
      both(8, "2x + 3 = 5x - 9"),
      both(9, "9x + 2 = 6x - 7"),
      both(10, "-x + 4 = 2x - 8"),
      both(11, "-2x + 7 = 1"),
      both(12, "-2x + 3 = 11"),
    ],
  },
  {
    id: "word",
    number: 4,
    kind: "stories",
    text: {
      en: {
        title: "Word problems",
        tagline: "Write the equation, then solve it",
        intro: {
          lead: "In a word problem the equation is hidden inside a story. First you write the equation yourself, then you solve it with the moves you already know.",
          points: [
            "Decide what x stands for. The story tells you.",
            "Find the number that repeats (for each kilometre, each week) and the number that happens once.",
            "Work out what the total is, and put it after the equals sign.",
          ],
          keyIdea: "Turn the story into maths first. Solve only after the equation says what the story says.",
        },
        exampleLead: "First the story becomes an equation. Only then do we solve it.",
      },
      fi: {
        title: "Sanalliset tehtävät",
        tagline: "Kirjoita yhtälö ja ratkaise se",
        intro: {
          lead: "Sanallisessa tehtävässä yhtälö on piilotettu tarinaan. Kirjoita ensin yhtälö itse ja ratkaise se sitten tutuilla siirroilla.",
          points: [
            "Päätä, mitä x tarkoittaa. Tarina kertoo sen.",
            "Etsi luku, joka toistuu (jokaista kilometriä tai viikkoa kohden), ja luku, joka tapahtuu vain kerran.",
            "Päätä, mikä on yhteensä, ja kirjoita se yhtäsuuruusmerkin jälkeen.",
          ],
          keyIdea: "Muuta tarina ensin matematiikaksi. Ratkaise vasta, kun yhtälö kertoo saman kuin tarina.",
        },
        exampleLead: "Ensin tarinasta tulee yhtälö. Vasta sitten ratkaisemme sen.",
      },
    },
    example: { equation: "2x + 3 = 15" },
    roundSize: 5,
    exercises: [],
  },
];

export function getLevel(id: string): LevelDefinition | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function isLevelId(id: string): id is LevelId {
  return LEVELS.some((level) => level.id === id);
}

/** The level that follows `id`, if any. */
export function getNextLevel(id: LevelId): LevelDefinition | undefined {
  const index = LEVELS.findIndex((level) => level.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}

/** An exercise ready for the workspace: the parsed equation plus its identity. */
export interface Exercise {
  readonly id: string;
  readonly source: string;
  readonly equation: Equation;
}

export function toExercise(definition: ExerciseDefinition): Exercise {
  return { id: definition.id, source: definition.equation, equation: mustParseEquation(definition.equation) };
}
