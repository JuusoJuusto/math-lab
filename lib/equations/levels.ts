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
import { makePrelude, type Prelude } from "./prelude";

export type LevelId =
  | "one-step"
  | "two-step"
  | "both"
  | "brackets"
  | "fractions"
  | "word"
  | "special"
  | "hard-word"
  | "challenge";

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
  readonly number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  /**
   * `equations` levels draw from a pool of equations; `stories` levels give a
   * word problem where the learner first writes the equation.
   */
  readonly kind: "equations" | "stories";
  /**
   * What the equations of the level have: exactly one whole-number solution, or
   * (the special-cases level) none at all or infinitely many.
   */
  readonly expects: "one" | "special";
  /** For `stories` levels: how hard the word problems are (see lib/tasks/stories.ts). */
  readonly tiers?: readonly (1 | 2 | 3 | 4 | 5 | 6)[];
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
const brk = (n: number, equation: string): ExerciseDefinition => ({ id: `brackets-${String(n).padStart(2, "0")}`, equation });
const fra = (n: number, equation: string): ExerciseDefinition => ({ id: `fractions-${String(n).padStart(2, "0")}`, equation });
const spc = (n: number, equation: string): ExerciseDefinition => ({ id: `special-${String(n).padStart(2, "0")}`, equation });
const chl = (n: number, equation: string): ExerciseDefinition => ({ id: `challenge-${String(n).padStart(2, "0")}`, equation });

export const LEVELS: readonly LevelDefinition[] = [
  {
    id: "one-step",
    number: 1,
    kind: "equations",
    expects: "one",
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
    expects: "one",
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
    expects: "one",
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
    id: "brackets",
    number: 4,
    kind: "equations",
    expects: "one",
    text: {
      en: {
        title: "Equations with brackets",
        tagline: "Open the brackets first, then solve",
        intro: {
          lead: "A number in front of a bracket multiplies everything inside it. Open the brackets first, simplify each side, and then solve the equation you know already.",
          points: [
            "Multiply every term inside the brackets: 3(x − 2) = 3x − 6, not 3x − 2.",
            "Watch the signs: a minus in front of a bracket changes every sign inside.",
            "After opening the brackets, collect x on one side and the numbers on the other.",
          ],
          keyIdea: "Brackets first. Then it is an equation you have solved before.",
        },
        exampleLead: "The 3 multiplies both terms in the bracket. First we open the bracket, then we solve.",
      },
      fi: {
        title: "Sulkulausekkeet yhtälössä",
        tagline: "Poista ensin sulut ja ratkaise sitten",
        intro: {
          lead: "Sulkujen edessä oleva luku kertoo kaiken sulkujen sisällä. Poista ensin sulut, sievennä kumpikin puoli ja ratkaise sitten tuttu yhtälö.",
          points: [
            "Kerro jokainen sulkujen sisällä oleva termi: 3(x − 2) = 3x − 6, ei 3x − 2.",
            "Varo merkkejä: sulkujen edessä oleva miinus vaihtaa jokaisen merkin sulkujen sisällä.",
            "Kun sulut on poistettu, kokoa x yhdelle puolelle ja luvut toiselle.",
          ],
          keyIdea: "Sulut ensin. Sen jälkeen yhtälö on sellainen, jonka olet jo ratkaissut.",
        },
        exampleLead: "Kolmonen kertoo kummankin sulkujen sisällä olevan termin. Ensin poistamme sulut, sitten ratkaisemme.",
      },
    },
    example: { equation: "3(x + 2) = 2x + 9" },
    roundSize: 5,
    exercises: [
      brk(1, "2(x + 3) = 14"),
      brk(2, "3(x - 2) = 15"),
      brk(3, "4(x + 1) = 28"),
      brk(4, "5(x - 3) = 20"),
      brk(5, "2(3x + 1) = 20"),
      brk(6, "3(2x - 1) = 21"),
      brk(7, "2(x + 4) = x + 13"),
      brk(8, "5(x - 1) = 3(x + 3)"),
      brk(9, "4(x - 2) = 2(x + 4)"),
      brk(10, "2(3x - 4) = 4(x + 1)"),
      brk(11, "-2(x - 3) = 10"),
      brk(12, "3(x + 2) - 4 = 11"),
      brk(13, "2(2x - 3) + 5 = 3x + 4"),
      brk(14, "6(x - 2) = 4(x + 1) + 2"),
      brk(15, "10 - 2(x + 1) = 4"),
      brk(16, "5(2x - 1) = 3(3x + 2)"),
    ],
  },
  {
    id: "fractions",
    number: 5,
    kind: "equations",
    expects: "one",
    text: {
      en: {
        title: "Fractions and ratios",
        tagline: "Clear the denominators, then solve",
        intro: {
          lead: "When an equation has fractions, the easiest way is to get rid of them. Multiply both sides by a number that every denominator divides into. Then you are back to whole numbers.",
          points: [
            "Find the common denominator: the smallest number every denominator divides into.",
            "Multiply both sides, and so every term, by it. The fractions disappear.",
            "A ratio such as x/6 = 4/3 is solved the same way: multiply both sides by 6.",
          ],
          keyIdea: "Fractions are in the way. Multiply them out of the equation first.",
        },
        exampleLead: "The denominators are 2 and 3, so we first combine the x terms, then multiply both sides by 6.",
      },
      fi: {
        title: "Murtolausekkeet ja verranto",
        tagline: "Poista nimittäjät ja ratkaise sitten",
        intro: {
          lead: "Kun yhtälössä on murtolukuja, helpointa on päästä niistä eroon. Kerro molemmat puolet luvulla, johon jokainen nimittäjä sopii. Sitten ollaan taas kokonaislukujen parissa.",
          points: [
            "Etsi yhteinen nimittäjä: pienin luku, johon jokainen nimittäjä sopii.",
            "Kerro sillä molemmat puolet ja siis jokainen termi. Murtoluvut häviävät.",
            "Verranto, kuten x/6 = 4/3, ratkeaa samalla tavalla: kerro molemmat puolet luvulla 6.",
          ],
          keyIdea: "Murtoluvut ovat tiellä. Kerro ne ensin pois yhtälöstä.",
        },
        exampleLead: "Nimittäjät ovat 2 ja 3, joten yhdistämme ensin x-termit ja kerromme sitten molemmat puolet luvulla 6.",
      },
    },
    example: { equation: "x/2 + x/3 = 5" },
    roundSize: 5,
    exercises: [
      fra(1, "x/2 + x/4 = 6"),
      fra(2, "x/3 + x/6 = 4"),
      fra(3, "(x + 1)/2 = 4"),
      fra(4, "(x - 3)/4 = 2"),
      fra(5, "2x/3 + 1 = 5"),
      fra(6, "3x/4 - 2 = 7"),
      fra(7, "x/6 = 4/3"),
      fra(8, "(x + 4)/5 = 6/2"),
      fra(9, "(2x + 1)/3 = 5"),
      fra(10, "x/2 = x/3 + 1"),
      fra(11, "x/2 + 1/3 = 5/6"),
      fra(12, "2x/3 = x/2 + 1"),
      fra(13, "x/2 - x/5 + 1 = 4"),
      fra(14, "(3x - 1)/2 = x + 2"),
      fra(15, "(x + 2)/3 = (x - 1)/2"),
      fra(16, "x/3 + x/4 = x/2 + 1"),
    ],
  },
  {
    id: "word",
    number: 6,
    kind: "stories",
    expects: "one",
    tiers: [1, 2, 3],
    text: {
      en: {
        title: "Word problems",
        tagline: "Write the equation, then solve it",
        intro: {
          lead: "In a word problem the equation is hidden inside a story. First you write the equation yourself, then you solve it with the moves you already know.",
          points: [
            "Read the story. Call one thing you are asked about x and write the others with x (“3 more than x” is x + 3).",
            "Write the equation from the facts of the story, then solve it.",
            "Check that it fits the story, then answer in words with the unit. The answer is not always x.",
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
            "Lue tarina. Merkitse yhtä kysyttyä asiaa x:llä ja kirjoita muut x:n avulla (”3 enemmän kuin x” on x + 3).",
            "Kirjoita yhtälö tarinan tiedoista ja ratkaise se.",
            "Tarkista, että vastaus sopii tarinaan, ja vastaa sanallisesti yksikön kanssa. Vastaus ei aina ole x.",
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
  {
    id: "special",
    number: 7,
    kind: "equations",
    expects: "special",
    text: {
      en: {
        title: "No solution or infinitely many",
        tagline: "What if x disappears?",
        intro: {
          lead: "Sometimes x cancels out completely. Then the equation is either never true (no solution) or always true (every number is a solution). Solve it as usual and look at what is left.",
          points: [
            "If you end with something false, such as 3 = 5, there is no solution.",
            "If you end with something always true, such as 4 = 4, every number works: infinitely many solutions.",
            "Try two different numbers for x in the original equation to see which case you have.",
          ],
          keyIdea: "When x disappears, the numbers that are left decide.",
        },
        exampleLead: "Both sides have 2x. Watch what happens when we take it away from both sides.",
      },
      fi: {
        title: "Ei ratkaisua tai äärettömän monta",
        tagline: "Entä jos x katoaa?",
        intro: {
          lead: "Joskus x supistuu kokonaan pois. Silloin yhtälö ei pidä koskaan paikkaansa (ei ratkaisua) tai pitää aina paikkansa (jokainen luku on ratkaisu). Ratkaise tavalliseen tapaan ja katso, mitä jää jäljelle.",
          points: [
            "Jos lopputulos on epätosi, esimerkiksi 3 = 5, ratkaisua ei ole.",
            "Jos lopputulos on aina tosi, esimerkiksi 4 = 4, jokainen luku kelpaa: ratkaisuja on äärettömän monta.",
            "Kokeile alkuperäiseen yhtälöön kahta eri lukua x:n tilalle, niin näet, kumpi tapaus on kyseessä.",
          ],
          keyIdea: "Kun x katoaa, jäljelle jäävät luvut ratkaisevat.",
        },
        exampleLead: "Kummallakin puolella on 2x. Katso, mitä tapahtuu, kun se otetaan pois molemmilta puolilta.",
      },
    },
    example: { equation: "2x + 3 = 2x + 7" },
    roundSize: 5,
    exercises: [
      spc(1, "x + 4 = x - 2"),
      spc(2, "2(x + 3) = 2x + 6"),
      spc(3, "3x + 1 = 3x + 5"),
      spc(4, "5x - 5 = 5(x - 1)"),
      spc(5, "3(x + 1) = 3x + 5"),
      spc(6, "x/2 + x/2 = x"),
      spc(7, "4x - 1 = 4(x + 2)"),
      spc(8, "2(x + 1) + 3 = 2x + 5"),
      spc(9, "3(x - 2) = 3x - 5"),
      spc(10, "x/3 + x/3 = 2x/3 + 4"),
      spc(11, "6(x + 2) - 12 = 6x"),
      spc(12, "2(3x - 1) = 6x + 5"),
    ],
  },
  {
    id: "hard-word",
    number: 8,
    kind: "stories",
    expects: "one",
    tiers: [4, 5, 6],
    text: {
      en: {
        title: "Hard word problems",
        tagline: "Longer stories. You write the whole equation.",
        intro: {
          lead: "These stories need brackets, percentages, consecutive numbers or two things moving. Nothing is filled in for you: read the story, decide what x is, and write the whole equation yourself.",
          points: [
            "Say in words what each part of the story is worth, then turn the words into x.",
            "Two quantities that change together (two people, two plans) usually give x on both sides.",
            "For a percentage, use the decimal: 25 % off is 0.75 of the price. A total of consecutive numbers is x + (x + 1) + (x + 2).",
          ],
          keyIdea: "The equation is the story in mathematical shorthand. If it says what the story says, solving is the easy part.",
        },
        exampleLead: "Three consecutive numbers add up to 48. We write what each number is, then the sum.",
      },
      fi: {
        title: "Vaativat sanalliset tehtävät",
        tagline: "Pidempiä tarinoita. Kirjoitat koko yhtälön itse.",
        intro: {
          lead: "Näissä tarinoissa tarvitaan sulkuja, prosentteja, peräkkäisiä lukuja tai kahta liikkuvaa asiaa. Mitään ei ole valmiiksi täytetty: lue tarina, päätä mitä x on ja kirjoita koko yhtälö itse.",
          points: [
            "Kerro sanoin, mitä jokainen tarinan osa on, ja muuta sanat sitten x:n avulla lausekkeiksi.",
            "Kaksi yhdessä muuttuvaa suuretta (kaksi henkilöä, kaksi liittymää) antaa yleensä x:n molemmille puolille.",
            "Prosentille käytä desimaalilukua: 25 %:n alennus tarkoittaa 0,75-kertaista hintaa. Peräkkäisten lukujen summa on x + (x + 1) + (x + 2).",
          ],
          keyIdea: "Yhtälö on tarina matemaattisena lyhennyksenä. Kun se kertoo saman kuin tarina, ratkaiseminen on helppoa.",
        },
        exampleLead: "Kolme peräkkäistä lukua on yhteensä 48. Kirjoitamme ensin, mikä kukin luku on, ja sitten summan.",
      },
    },
    example: { equation: "x + (x + 1) + (x + 2) = 48" },
    roundSize: 5,
    exercises: [],
  },
  {
    id: "challenge",
    number: 9,
    kind: "equations",
    expects: "one",
    text: {
      en: {
        title: "Challenge",
        tagline: "The hardest equations: use every method",
        intro: {
          lead: "Brackets on both sides, fractions, negative numbers: all in one equation. Take it in the order you know: open the brackets, clear the fractions, collect x, then divide.",
          points: [
            "Open every bracket first and simplify each side.",
            "If there are fractions, multiply both sides by the common denominator.",
            "Then collect x on one side and the numbers on the other, and finish. Check by substituting.",
          ],
          keyIdea: "A long equation is the same moves in a row. Take one step at a time.",
        },
        exampleLead: "Two brackets, one of them after a minus. We open both, simplify, and then collect x.",
      },
      fi: {
        title: "Haastetaso",
        tagline: "Vaikeimmat yhtälöt: käytä kaikkia menetelmiä",
        intro: {
          lead: "Sulkuja molemmilla puolilla, murtolukuja ja negatiivisia lukuja: kaikki samassa yhtälössä. Etene tutussa järjestyksessä: poista sulut, poista murtoluvut, kokoa x ja jaa.",
          points: [
            "Poista ensin kaikki sulut ja sievennä kumpikin puoli.",
            "Jos mukana on murtolukuja, kerro molemmat puolet yhteisellä nimittäjällä.",
            "Kokoa sitten x yhdelle puolelle ja luvut toiselle ja viimeistele. Tarkista sijoittamalla.",
          ],
          keyIdea: "Pitkä yhtälö on samoja siirtoja peräkkäin. Etene yksi askel kerrallaan.",
        },
        exampleLead: "Kaksi sulkulauseketta, toinen miinuksen jäljessä. Poistamme molemmat, sievennämme ja kokoamme sitten x:n.",
      },
    },
    example: { equation: "4(x - 3) - 2(x - 5) = 14" },
    roundSize: 5,
    exercises: [
      chl(1, "3(2x - 1) + 2(x + 4) = 5x + 23"),
      chl(2, "4(x - 3) - 2(x - 5) = x + 6"),
      chl(3, "2(3x - 1) - 3(x + 2) = x + 8"),
      chl(4, "(x + 5)/3 + (x - 1)/2 = 7"),
      chl(5, "x/2 + x/3 - x/6 = 4"),
      chl(6, "5(x - 2) - 3 = 2(x + 4)"),
      chl(7, "-3(x - 4) = 2(x - 1) + 4"),
      chl(8, "(3x - 2)/4 = (x + 6)/2"),
      chl(9, "2x/3 - (x - 3)/2 = 1"),
      chl(10, "7 - 2(x - 3) = 3x - 7"),
      chl(11, "4(x + 2) - 3(x - 1) = 2(x + 5) - 4"),
      chl(12, "x/4 + (x - 2)/3 = 4"),
      chl(13, "(x + 3)/2 - (x - 1)/3 = 3"),
    ],
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
  /** The equation as written, which may have brackets or fractions to deal with first. */
  readonly source: string;
  /** The same equation in simple form, which the balance moves start from. */
  readonly equation: Equation;
  /** The clean-up questions (open brackets, simplify) before the balance moves; empty if the equation is already simple. */
  readonly prelude: Prelude;
}

export function toExercise(definition: ExerciseDefinition): Exercise {
  return {
    id: definition.id,
    source: definition.equation,
    equation: mustParseEquation(definition.equation),
    prelude: makePrelude(definition.equation),
  };
}
