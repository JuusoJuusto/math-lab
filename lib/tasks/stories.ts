/**
 * Word problems and proportion problems with whole-number answers.
 *
 * A story template picks numbers from the random generator and returns the
 * story in *every* language at once, together with the correct equation and
 * tempting wrong ones. The numbers never depend on the language, so a recipe
 * (kind, topic, seed) gives the same maths in Finnish and English.
 *
 * `sampleStory` re-checks every option with the engine, so a template whose
 * wrong equation accidentally has the right solution is rejected, not shown.
 */

import { frac, parseEquation, solveEquation, type Lang, type Rng } from "../equations";
import type { Localised } from "../lang";
import { int, pick } from "./sample";

export type StoryId =
  | "notebooks"
  | "stickers"
  | "birthday"
  | "taxi"
  | "saving"
  | "puzzle"
  | "ages"
  | "plans"
  | "rectangle";

export interface StoryText {
  /** The situation, without saying what x is. */
  readonly situation: string;
  /** What x stands for, e.g. "Let x be the number of kilometres." */
  readonly letX: string;
  /** The typed-answer version of the question. */
  readonly question: string;
  /** Shown next to the answer box, e.g. "km". */
  readonly unit: string;
  /** One sentence on how the correct equation is built. */
  readonly build: string;
  /** The finished answer as a sentence, e.g. "The ride was 6 km long." */
  readonly answer: string;
}

export interface Story {
  readonly id: StoryId;
  /** 1 is a one-step equation, 2 is two steps, 3 has x on both sides or brackets. */
  readonly difficulty: 1 | 2 | 3;
  /** Equation options in standard ASCII form. The first one is correct. */
  readonly equations: readonly string[];
  readonly solution: number;
  readonly i18n: Localised<StoryText>;
}

/** The story as one passage, ending with what x stands for. */
export function storyPassage(story: Story, lang: Lang): string {
  const text = story.i18n[lang];
  return `${text.situation} ${text.letX}`;
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                  */
/* -------------------------------------------------------------------------- */

export function notebooksStory(n: number, p: number): Story {
  const c = n * p;
  return {
    id: "notebooks",
    difficulty: 1,
    equations: [`${n}x = ${c}`, `x/${n} = ${c}`, `x + ${n} = ${c}`, `x - ${n} = ${c}`],
    solution: p,
    i18n: {
      en: {
        situation: `${n} identical notebooks cost €${c} altogether.`,
        letX: "Let x be the price of one notebook in euros.",
        question: "What does one notebook cost?",
        unit: "€",
        build: `${n} notebooks at x euros each cost ${n} times x: ${n}x = ${c}.`,
        answer: `One notebook costs €${p}.`,
      },
      fi: {
        situation: `${n} samanlaista vihkoa maksaa yhteensä ${c} €.`,
        letX: "Olkoon x yhden vihon hinta euroina.",
        question: "Mitä yksi vihko maksaa?",
        unit: "€",
        build: `${n} vihkoa, joiden hinta on x euroa kappale, maksavat ${n} kertaa x: ${n}x = ${c}.`,
        answer: `Yksi vihko maksaa ${p} €.`,
      },
    },
  };
}

export function stickersStory(m: number, k: number): Story {
  const s = m + k;
  return {
    id: "stickers",
    difficulty: 1,
    equations: [`x - ${m} = ${k}`, `x + ${m} = ${k}`, `${m} - x = ${k}`, `${m}x = ${k}`],
    solution: s,
    i18n: {
      en: {
        situation: `Ella gave away ${m} stickers and has ${k} left.`,
        letX: "Let x be the number of stickers she had at first.",
        question: "How many stickers did Ella have at first?",
        unit: "stickers",
        build: `Ella had x stickers, gave away ${m} and has ${k} left: x − ${m} = ${k}.`,
        answer: `Ella had ${s} stickers at first.`,
      },
      fi: {
        situation: `Ella antoi ${m} tarraa pois, ja hänellä on ${k} tarraa jäljellä.`,
        letX: "Olkoon x tarrojen määrä aluksi.",
        question: "Montako tarraa Ellalla oli aluksi?",
        unit: "tarraa",
        build: `Ellalla oli x tarraa, hän antoi ${m} pois ja jäljellä on ${k}: x − ${m} = ${k}.`,
        answer: `Ellalla oli aluksi ${s} tarraa.`,
      },
    },
  };
}

export function birthdayStory(m: number, s: number): Story {
  const k = s + m;
  return {
    id: "birthday",
    difficulty: 1,
    equations: [`x + ${m} = ${k}`, `x - ${m} = ${k}`, `${m}x = ${k}`, `x/${m} = ${k}`],
    solution: s,
    i18n: {
      en: {
        situation: `Max had some money. He got €${m} for his birthday and now has €${k}.`,
        letX: "Let x be the money he had before, in euros.",
        question: "How much did Max have before his birthday?",
        unit: "€",
        build: `Max had x euros, got ${m} euros more and now has ${k}: x + ${m} = ${k}.`,
        answer: `Max had €${s} before his birthday.`,
      },
      fi: {
        situation: `Maxilla oli vähän rahaa. Hän sai syntymäpäivälahjaksi ${m} € ja hänellä on nyt ${k} €.`,
        letX: "Olkoon x hänen rahamääränsä aiemmin euroina.",
        question: "Paljonko Maxilla oli rahaa ennen syntymäpäivää?",
        unit: "€",
        build: `Maxilla oli x euroa, hän sai ${m} euroa lisää ja nyt rahaa on ${k}: x + ${m} = ${k}.`,
        answer: `Maxilla oli ennen syntymäpäivää ${s} €.`,
      },
    },
  };
}

export function taxiStory(a: number, b: number, s: number): Story {
  const c = a + b * s;
  return {
    id: "taxi",
    difficulty: 2,
    equations: [`${b}x + ${a} = ${c}`, `${b}x - ${a} = ${c}`, `${a + b}x = ${c}`, `${a}x + ${b} = ${c}`],
    solution: s,
    i18n: {
      en: {
        situation: `A taxi charges €${a} to start and €${b} for every kilometre. One ride costs €${c} in total.`,
        letX: "Let x be the number of kilometres.",
        question: "How many kilometres was the ride?",
        unit: "km",
        build: `The start fee €${a} is added once, and €${b} is paid for each of the x kilometres: ${b}x + ${a} = ${c}.`,
        answer: `The ride was ${s} km long.`,
      },
      fi: {
        situation: `Taksi veloittaa ${a} € aloitusmaksua ja ${b} € jokaiselta kilometriltä. Yksi ajo maksaa yhteensä ${c} €.`,
        letX: "Olkoon x kilometrien määrä.",
        question: "Kuinka monta kilometriä ajo oli?",
        unit: "km",
        build: `Aloitusmaksu ${a} € maksetaan kerran, ja jokaiselta x kilometriltä maksetaan ${b} €: ${b}x + ${a} = ${c}.`,
        answer: `Ajo oli ${s} km pitkä.`,
      },
    },
  };
}

export function savingStory(a: number, b: number, s: number): Story {
  const c = a + b * s;
  return {
    id: "saving",
    difficulty: 2,
    equations: [`${b}x + ${a} = ${c}`, `${b}x = ${c} + ${a}`, `${a}x + ${b} = ${c}`, `${b}x - ${a} = ${c}`],
    solution: s,
    i18n: {
      en: {
        situation: `Leo has €${a} saved. Each week he adds €${b}. After some weeks he has €${c}.`,
        letX: "Let x be the number of weeks.",
        question: `After how many weeks does Leo have €${c}?`,
        unit: "weeks",
        build: `Leo starts with €${a} and adds €${b} for each of the x weeks: ${b}x + ${a} = ${c}.`,
        answer: `Leo has €${c} after ${s} weeks.`,
      },
      fi: {
        situation: `Leolla on säästössä ${a} €. Joka viikko hän lisää ${b} €. Muutaman viikon kuluttua hänellä on ${c} €.`,
        letX: "Olkoon x viikkojen määrä.",
        question: `Monenko viikon kuluttua Leolla on ${c} €?`,
        unit: "viikkoa",
        build: `Leo aloittaa ${a} eurolla ja lisää ${b} € jokaisella x viikolla: ${b}x + ${a} = ${c}.`,
        answer: `Leolla on ${c} € ${s} viikon kuluttua.`,
      },
    },
  };
}

export function puzzleStory(n: number, m: number, s: number): Story {
  const k = n * s - m;
  return {
    id: "puzzle",
    difficulty: 2,
    equations: [`${n}x - ${m} = ${k}`, `${n}x + ${m} = ${k}`, `${n}(x - ${m}) = ${k}`, `x/${n} - ${m} = ${k}`],
    solution: s,
    i18n: {
      en: {
        situation: `I think of a number, multiply it by ${n} and then subtract ${m}. The result is ${k}.`,
        letX: "Let x be my number.",
        question: "What number am I thinking of?",
        unit: "",
        build: `Multiply x by ${n}, then subtract ${m}, and the result is ${k}: ${n}x − ${m} = ${k}.`,
        answer: `My number is ${s}.`,
      },
      fi: {
        situation: `Ajattelen jotakin lukua, kerron sen luvulla ${n} ja vähennän tuloksesta ${m}. Lopputulos on ${k}.`,
        letX: "Olkoon x ajattelemani luku.",
        question: "Mitä lukua ajattelen?",
        unit: "",
        build: `Kerro x luvulla ${n}, vähennä ${m}, ja tulos on ${k}: ${n}x − ${m} = ${k}.`,
        answer: `Ajattelemani luku on ${s}.`,
      },
    },
  };
}

export function agesStory(d: number, s: number): Story {
  const total = 2 * s + d;
  return {
    id: "ages",
    difficulty: 2,
    equations: [`2x + ${d} = ${total}`, `x + ${d} = ${total}`, `2x - ${d} = ${total}`, `2x = ${total}`],
    solution: s,
    i18n: {
      en: {
        situation: `Mia is ${d} years older than her brother Ben. Together they are ${total} years old.`,
        letX: "Let x be Ben's age in years.",
        question: "How old is Ben?",
        unit: "years",
        build: `Ben is x and Mia is x + ${d}. Together: x + (x + ${d}) = ${total}, which is 2x + ${d} = ${total}.`,
        answer: `Ben is ${s} years old.`,
      },
      fi: {
        situation: `Mia on ${d} vuotta vanhempi kuin hänen veljensä Ben. Yhdessä he ovat ${total} vuotta.`,
        letX: "Olkoon x Benin ikä vuosina.",
        question: "Kuinka vanha Ben on?",
        unit: "vuotta",
        build: `Ben on x vuotta ja Mia x + ${d} vuotta. Yhdessä: x + (x + ${d}) = ${total}, eli 2x + ${d} = ${total}.`,
        answer: `Ben on ${s}-vuotias.`,
      },
    },
  };
}

export function plansStory(b: number, e: number, s: number): Story {
  const d = b + e;
  const a = e * s;
  return {
    id: "plans",
    difficulty: 3,
    equations: [`${b}x + ${a} = ${d}x`, `${b}x = ${d}x + ${a}`, `${b}x + ${a} = ${d}`, `${b + d}x = ${a}`],
    solution: s,
    i18n: {
      en: {
        situation: `Plan A costs €${a} a month plus €${b} for each GB. Plan B costs €${d} for each GB and has no monthly fee.`,
        letX: "Let x be the number of GB.",
        question: "For how many GB do both plans cost the same?",
        unit: "GB",
        build: `Plan A costs ${b}x + ${a} and plan B costs ${d}x. They are equal when ${b}x + ${a} = ${d}x.`,
        answer: `Both plans cost the same at ${s} GB.`,
      },
      fi: {
        situation: `Liittymä A maksaa ${a} € kuukaudessa ja lisäksi ${b} € jokaisesta gigatavusta. Liittymä B maksaa ${d} € jokaisesta gigatavusta eikä siinä ole kuukausimaksua.`,
        letX: "Olkoon x gigatavujen määrä.",
        question: "Kuinka monella gigatavulla liittymät maksavat saman?",
        unit: "GB",
        build: `Liittymä A maksaa ${b}x + ${a} ja liittymä B maksaa ${d}x. Hinnat ovat yhtä suuret, kun ${b}x + ${a} = ${d}x.`,
        answer: `Liittymät maksavat saman ${s} gigatavulla.`,
      },
    },
  };
}

export function rectangleStory(s: number, n: number): Story {
  const perimeter = 4 * s + 2 * n;
  return {
    id: "rectangle",
    difficulty: 3,
    equations: [
      `2x + 2(x + ${n}) = ${perimeter}`,
      `x + (x + ${n}) = ${perimeter}`,
      `2x + (x + ${n}) = ${perimeter}`,
      `4x + ${n} = ${perimeter}`,
    ],
    solution: s,
    i18n: {
      en: {
        situation: `A rectangle is ${n} cm longer than it is wide. Its perimeter is ${perimeter} cm.`,
        letX: "Let x be the width in centimetres.",
        question: "How wide is the rectangle?",
        unit: "cm",
        build: `The width is x and the length is x + ${n}. The perimeter is two widths plus two lengths: 2x + 2(x + ${n}) = ${perimeter}.`,
        answer: `The rectangle is ${s} cm wide.`,
      },
      fi: {
        situation: `Suorakulmio on ${n} cm leveyttään pidempi. Sen piiri on ${perimeter} cm.`,
        letX: "Olkoon x leveys senttimetreinä.",
        question: "Kuinka leveä suorakulmio on?",
        unit: "cm",
        build: `Leveys on x ja pituus on x + ${n}. Piiri on kaksi leveyttä ja kaksi pituutta: 2x + 2(x + ${n}) = ${perimeter}.`,
        answer: `Suorakulmio on ${s} cm leveä.`,
      },
    },
  };
}

type Template = (rng: Rng) => Story | null;

const TEMPLATES: readonly Template[] = [
  (rng) => notebooksStory(int(rng, 3, 8), int(rng, 2, 9)),
  (rng) => stickersStory(int(rng, 2, 9), int(rng, 3, 15)),
  (rng) => birthdayStory(int(rng, 5, 30), int(rng, 4, 40)),
  (rng) => {
    const a = int(rng, 2, 8);
    const b = int(rng, 2, 5);
    const s = int(rng, 3, 12);
    return a === b ? null : taxiStory(a, b, s);
  },
  (rng) => {
    const a = int(rng, 5, 30);
    const b = int(rng, 2, 9);
    const s = int(rng, 3, 10);
    return a === b ? null : savingStory(a, b, s);
  },
  (rng) => {
    const n = int(rng, 2, 6);
    const s = int(rng, 2, 10);
    const m = int(rng, 1, Math.min(9, n * s - 1));
    return puzzleStory(n, m, s);
  },
  (rng) => agesStory(int(rng, 2, 9), int(rng, 5, 20)),
  (rng) => {
    const b = int(rng, 1, 3);
    const e = int(rng, 1, 3);
    return plansStory(b, e, int(rng, 3, 10));
  },
  (rng) => {
    const s = int(rng, 3, 12);
    const n = int(rng, 2, 8);
    return s === n ? null : rectangleStory(s, n);
  },
];

/** True when the equation text has exactly one solution and it equals `expected`. */
function solvesTo(text: string, expected: number): boolean {
  const parsed = parseEquation(text);
  if (!parsed.ok) return false;
  const solution = solveEquation(parsed.value);
  return solution.kind === "one" && solution.value.d === 1 && solution.value.n === expected;
}

/** Whether a story's intended equation can be written without brackets, as the equation builder requires. */
export function isBracketFree(story: Story): boolean {
  return !story.equations[0].includes("(");
}

export interface StoryOptions {
  /** Only stories of this difficulty. */
  readonly difficulty?: 1 | 2 | 3;
  /** Only stories whose equation can be built from `ax + b = cx + d` (no brackets). */
  readonly bracketFree?: boolean;
}

/** A verified word problem: the first option is the only one that gives the intended answer. */
export function sampleStory(rng: Rng, options: StoryOptions = {}): Story {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const story = pick(rng, TEMPLATES)(rng);
    if (!story) continue;
    if (options.difficulty && story.difficulty !== options.difficulty) continue;
    if (options.bracketFree && !isBracketFree(story)) continue;
    const [correct, ...wrong] = story.equations;
    if (solvesTo(correct, story.solution) && wrong.every((text) => !solvesTo(text, story.solution))) return story;
  }
  throw new Error("Could not build a valid word problem");
}

/** The story used for the worked example: fixed, so it reads the same every time. */
export const EXAMPLE_STORY: Story = taxiStory(3, 2, 6);

/**
 * The stories of one round of the word-problem level: easy ones first, never
 * the same situation twice in a row, and always with an equation that can be
 * written without brackets.
 */
export function pickStoryRound(rng: Rng, count: number): Story[] {
  const stories: Story[] = [];
  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0 : index / (count - 1);
    const difficulty = ratio < 0.4 ? 1 : ratio < 0.8 ? 2 : 3;
    let story = sampleStory(rng, { difficulty, bracketFree: true });
    for (let retry = 0; retry < 10 && stories.some((earlier) => earlier.id === story.id); retry += 1) {
      story = sampleStory(rng, { difficulty, bracketFree: true });
    }
    stories.push(story);
  }
  return stories;
}

/* -------------------------------------------------------------------------- */
/* Proportion                                                                 */
/* -------------------------------------------------------------------------- */

export interface ProportionText {
  readonly text: string;
  readonly unit: string;
  readonly explanation: readonly string[];
}

export interface Proportion {
  readonly solution: number;
  readonly i18n: Localised<ProportionText>;
}

/** Direct and inverse proportion with whole-number answers. */
export function sampleProportion(rng: Rng): Proportion {
  switch (int(rng, 0, 3)) {
    case 0: {
      const unitPrice = int(rng, 2, 9);
      const k = int(rng, 2, 5);
      const m = int(rng, k + 1, 12);
      return {
        solution: m * unitPrice,
        i18n: {
          en: {
            text: `${k} kg of apples cost €${k * unitPrice}. How much do ${m} kg cost at the same price per kilogram?`,
            unit: "€",
            explanation: [`One kilogram costs €${k * unitPrice} ÷ ${k} = €${unitPrice}.`, `${m} kg cost ${m} × €${unitPrice} = €${m * unitPrice}.`],
          },
          fi: {
            text: `${k} kg omenoita maksaa ${k * unitPrice} €. Paljonko ${m} kg maksaa samalla kilohinnalla?`,
            unit: "€",
            explanation: [`Yksi kilo maksaa ${k * unitPrice} € : ${k} = ${unitPrice} €.`, `${m} kg maksaa ${m} · ${unitPrice} € = ${m * unitPrice} €.`],
          },
        },
      };
    }
    case 1: {
      const kmPerCm = int(rng, 2, 9);
      const m = int(rng, 2, 15);
      return {
        solution: m * kmPerCm,
        i18n: {
          en: {
            text: `On a map, 1 cm represents ${kmPerCm} km. A road is ${m} cm long on the map. How long is the road in real life?`,
            unit: "km",
            explanation: [`Every centimetre stands for ${kmPerCm} km.`, `${m} cm stand for ${m} × ${kmPerCm} km = ${m * kmPerCm} km.`],
          },
          fi: {
            text: `Kartalla 1 cm vastaa ${kmPerCm} km:ä. Tie on kartalla ${m} cm pitkä. Kuinka pitkä tie on todellisuudessa?`,
            unit: "km",
            explanation: [`Jokainen senttimetri vastaa ${kmPerCm} km:ä.`, `${m} cm vastaa ${m} · ${kmPerCm} km = ${m * kmPerCm} km.`],
          },
        },
      };
    }
    case 2: {
      const workers = pick(rng, [2, 3, 4, 5, 6, 8]);
      const hours = int(rng, 2, 12);
      const total = workers * hours;
      const options = [1, 2, 3, 4, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24].filter((w) => w !== workers && total % w === 0 && w <= 24);
      const other = pick(rng, options.length ? options : [workers * 2]);
      return {
        solution: total / other,
        i18n: {
          en: {
            text: `${workers} workers finish a job in ${hours} hours. How many hours would ${other} workers need at the same rate?`,
            unit: "hours",
            explanation: [
              `The job needs ${workers} × ${hours} = ${total} worker-hours. More workers means less time.`,
              `${other} workers need ${total} ÷ ${other} = ${total / other} hours.`,
            ],
          },
          fi: {
            text: `${workers} työntekijää tekee työn ${hours} tunnissa. Kuinka monta tuntia ${other} työntekijää tarvitsisi samalla vauhdilla?`,
            unit: "tuntia",
            explanation: [
              `Työhön tarvitaan ${workers} · ${hours} = ${total} työtuntia. Mitä enemmän työntekijöitä, sitä vähemmän aikaa.`,
              `${other} työntekijää tarvitsee ${total} : ${other} = ${total / other} tuntia.`,
            ],
          },
        },
      };
    }
    default: {
      const people = int(rng, 2, 5);
      const perPerson = int(rng, 20, 60);
      const m = int(rng, people + 1, 12);
      return {
        solution: m * perPerson,
        i18n: {
          en: {
            text: `A recipe for ${people} people needs ${people * perPerson} g of flour. How many grams are needed for ${m} people?`,
            unit: "g",
            explanation: [
              `One person needs ${people * perPerson} g ÷ ${people} = ${perPerson} g.`,
              `${m} people need ${m} × ${perPerson} g = ${m * perPerson} g.`,
            ],
          },
          fi: {
            text: `Resepti ${people} hengelle vaatii ${people * perPerson} g jauhoja. Montako grammaa jauhoja tarvitaan ${m} hengelle?`,
            unit: "g",
            explanation: [
              `Yksi henkilö tarvitsee ${people * perPerson} g : ${people} = ${perPerson} g.`,
              `${m} henkilöä tarvitsee ${m} · ${perPerson} g = ${m * perPerson} g.`,
            ],
          },
        },
      };
    }
  }
}

/** Exposed so tests can state the intended answer as an exact fraction. */
export function storySolution(story: Story) {
  return frac(story.solution);
}
