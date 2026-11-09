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
  | "sharing"
  | "race"
  | "consecutive"
  | "discount"
  | "triangle"
  | "pair-prices"
  | "temperature"
  | "temperature-fall"
  | "coins"
  | "fruit-mix"
  | "triangle-sides"
  | "bracket-puzzle"
  | "cyclists"
  | "trains"
  | "parts"
  | "ella-age"
  | "sale-fee"
  | "work-together"
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
  /**
   * 1 one step, 2 two steps, 3 x on both sides or brackets, 4 consecutive numbers and percentages,
   * 5 brackets with two moving things, 6 fractions, ages and work (the hardest).
   */
  readonly difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  /** Equation options in standard ASCII form. The first one is correct. */
  readonly equations: readonly string[];
  readonly solution: number;
  /**
   * The number the question asks for, when that is not x itself. The equation
   * gives x (the price of the cheaper item), but the question asks for something
   * worked out from x (the price of the dearer one). Missing means the answer is x.
   */
  readonly final?: number;
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

/* -------------------------------------------------------------------------- */
/* Harder stories: percentages, consecutive numbers, movement, ages, work      */
/* -------------------------------------------------------------------------- */

/** Decimal as written in each language: 0.75 and 0,75. */
const dec = (value: number, lang: Lang) => (lang === "fi" ? String(value).replace(".", ",") : String(value));
const both = (text: (lang: Lang) => StoryText): Localised<StoryText> => ({ en: text("en"), fi: text("fi") });

export function sharingStory(n: number, m: number): Story {
  const s = n * m;
  return {
    id: "sharing",
    difficulty: 1,
    equations: [`x/${n} = ${m}`, `x + ${n} = ${m}`, `${n}x = ${m}`, `x - ${n} = ${m}`],
    solution: s,
    i18n: {
      en: {
        situation: `A pizza is shared equally between ${n} friends. Each friend gets ${m} slices.`,
        letX: "Let x be the number of slices in the pizza.",
        question: "How many slices does the pizza have?",
        unit: "slices",
        build: `Sharing x slices between ${n} friends gives x/${n} each: x/${n} = ${m}.`,
        answer: `The pizza has ${s} slices.`,
      },
      fi: {
        situation: `Pizza jaetaan tasan ${n} ystävän kesken. Jokainen saa ${m} palaa.`,
        letX: "Olkoon x pizzan palojen määrä.",
        question: "Montako palaa pizzassa on?",
        unit: "palaa",
        build: `Kun x palaa jaetaan ${n} ystävälle, jokainen saa x/${n}: x/${n} = ${m}.`,
        answer: `Pizzassa on ${s} palaa.`,
      },
    },
  };
}

export function raceStory(b: number, p: number, q: number, s: number): Story {
  const a = b + (q - p) * s;
  const total = p * s + a;
  return {
    id: "race",
    difficulty: 3,
    equations: [`${p}x + ${a} = ${q}x + ${b}`, `${p}x + ${a} = ${b}`, `${p}x + ${b} = ${q}x + ${a}`, `${p + q}x = ${a} + ${b}`],
    solution: s,
    i18n: {
      en: {
        situation: `Aino has €${a} and saves €${p} every week. Ben has €${b} and saves €${q} every week.`,
        letX: "Let x be the number of weeks until they have the same amount.",
        question: "After how many weeks do they have the same amount?",
        unit: "weeks",
        build: `After x weeks Aino has ${p}x + ${a} and Ben has ${q}x + ${b}. They are equal when ${p}x + ${a} = ${q}x + ${b}.`,
        answer: `After ${s} weeks they both have €${total}.`,
      },
      fi: {
        situation: `Ainolla on ${a} € ja hän säästää ${p} € viikossa. Benillä on ${b} € ja hän säästää ${q} € viikossa.`,
        letX: "Olkoon x viikkojen määrä, kunnes heillä on yhtä paljon.",
        question: "Monenko viikon kuluttua heillä on yhtä paljon?",
        unit: "viikkoa",
        build: `x viikon jälkeen Ainolla on ${p}x + ${a} ja Benillä ${q}x + ${b}. Ne ovat yhtä suuret, kun ${p}x + ${a} = ${q}x + ${b}.`,
        answer: `${s} viikon kuluttua heillä on kummallakin ${total} €.`,
      },
    },
  };
}

export function consecutiveStory(s: number): Story {
  const total = 3 * s + 3;
  return {
    id: "consecutive",
    difficulty: 4,
    equations: [`x + (x + 1) + (x + 2) = ${total}`, `3x = ${total}`, `x + (x + 1) + (x + 2) = ${total + 3}`, `x + 1 + 2 = ${total}`],
    solution: s,
    i18n: {
      en: {
        situation: `The sum of three consecutive whole numbers is ${total}.`,
        letX: "Let x be the smallest of them.",
        question: "What is the smallest number?",
        unit: "",
        build: `The numbers are x, x + 1 and x + 2, so x + (x + 1) + (x + 2) = ${total}.`,
        answer: `The smallest number is ${s}.`,
      },
      fi: {
        situation: `Kolmen peräkkäisen kokonaisluvun summa on ${total}.`,
        letX: "Olkoon x niistä pienin.",
        question: "Mikä on pienin luku?",
        unit: "",
        build: `Luvut ovat x, x + 1 ja x + 2, joten x + (x + 1) + (x + 2) = ${total}.`,
        answer: `Pienin luku on ${s}.`,
      },
    },
  };
}

export function discountStory(p: number, s: number): Story {
  const factor = (100 - p) / 100;
  const sale = (s * (100 - p)) / 100;
  return {
    id: "discount",
    difficulty: 4,
    equations: [`${factor}x = ${sale}`, `x - ${p}x = ${sale}`, `${p / 100}x = ${sale}`, `x - ${p} = ${sale}`],
    solution: s,
    i18n: both((lang) =>
      lang === "en"
        ? {
            situation: `A jacket is on sale with ${p} % off. The sale price is €${sale}.`,
            letX: "Let x be the original price in euros.",
            question: "What was the original price?",
            unit: "€",
            build: `After ${p} % off the price is ${factor} of the original: ${factor}x = ${sale}.`,
            answer: `The original price was €${s}.`,
          }
        : {
            situation: `Takki on alennusmyynnissä ${p} %:n alennuksella. Alennettu hinta on ${sale} €.`,
            letX: "Olkoon x alkuperäinen hinta euroina.",
            question: "Mikä oli alkuperäinen hinta?",
            unit: "€",
            build: `${p} %:n alennuksen jälkeen hinta on ${dec(factor, "fi")}-kertainen alkuperäiseen: ${dec(factor, "fi")}x = ${sale}.`,
            answer: `Alkuperäinen hinta oli ${s} €.`,
          },
    ),
  };
}

export function triangleStory(k: number, s: number): Story {
  const perimeter = 3 * s - k;
  return {
    id: "triangle",
    difficulty: 4,
    equations: [`x + x + (x - ${k}) = ${perimeter}`, `3x = ${perimeter}`, `x + x + (x + ${k}) = ${perimeter}`, `x + (x - ${k}) = ${perimeter}`],
    solution: s,
    i18n: {
      en: {
        situation: `An isosceles triangle has two equal sides. The third side is ${k} cm shorter than each of them. The perimeter is ${perimeter} cm.`,
        letX: "Let x be the length of one of the equal sides in centimetres.",
        question: "How long is one of the equal sides?",
        unit: "cm",
        build: `The sides are x, x and x − ${k}. The perimeter is their sum: x + x + (x − ${k}) = ${perimeter}.`,
        answer: `Each of the equal sides is ${s} cm.`,
      },
      fi: {
        situation: `Tasakylkisessä kolmiossa on kaksi yhtä pitkää sivua. Kolmas sivu on ${k} cm lyhyempi kuin kumpikaan niistä. Piiri on ${perimeter} cm.`,
        letX: "Olkoon x toisen yhtä pitkän sivun pituus senttimetreinä.",
        question: "Kuinka pitkä on toinen yhtä pitkistä sivuista?",
        unit: "cm",
        build: `Sivut ovat x, x ja x − ${k}. Piiri on niiden summa: x + x + (x − ${k}) = ${perimeter}.`,
        answer: `Kumpikin yhtä pitkistä sivuista on ${s} cm.`,
      },
    },
  };
}

/** Two prices that add up to a total. x is the cheaper one, but the question asks for the dearer one. */
export function pairPricesStory(cheap: number, extra: number): Story {
  const total = 2 * cheap + extra;
  return {
    id: "pair-prices",
    difficulty: 2,
    final: cheap + extra,
    equations: [`x + (x + ${extra}) = ${total}`, `x + ${extra} = ${total}`, `2x = ${total} + ${extra}`, `x + (x - ${extra}) = ${total}`],
    solution: cheap,
    i18n: {
      en: {
        situation: `A sandwich and a juice cost ${total} euros together. The sandwich costs ${extra} euros more than the juice.`,
        letX: "Let x be the price of the juice in euros.",
        question: "How much does the sandwich cost?",
        unit: "€",
        build: `The juice costs x and the sandwich costs x + ${extra}. Together they cost x + (x + ${extra}) = ${total}.`,
        answer: `The juice costs ${cheap} euros, so the sandwich costs ${cheap} + ${extra} = ${cheap + extra} euros.`,
      },
      fi: {
        situation: `Voileipä ja mehu maksavat yhteensä ${total} euroa. Voileipä maksaa ${extra} euroa enemmän kuin mehu.`,
        letX: "Olkoon x mehun hinta euroina.",
        question: "Paljonko voileipä maksaa?",
        unit: "€",
        build: `Mehu maksaa x ja voileipä maksaa x + ${extra}. Yhdessä ne maksavat x + (x + ${extra}) = ${total}.`,
        answer: `Mehu maksaa ${cheap} euroa, joten voileipä maksaa ${cheap} + ${extra} = ${cheap + extra} euroa.`,
      },
    },
  };
}

/** A triangle with three different sides. x is the first side, but the question asks for the longest one. */
export function triangleSidesStory(a: number, b: number, s: number): Story | null {
  if (a === b || 2 * s - b <= 0) return null;
  const perimeter = 4 * s + a - b;
  const sides = [s, s + a, 2 * s - b];
  const longest = Math.max(...sides);
  return {
    id: "triangle-sides",
    difficulty: 4,
    final: longest,
    equations: [
      `x + (x + ${a}) + (2x - ${b}) = ${perimeter}`,
      `x + (x + ${a}) + (2x + ${b}) = ${perimeter}`,
      `x + (x + ${a}) + 2x = ${perimeter}`,
      `4x = ${perimeter}`,
    ],
    solution: s,
    i18n: {
      en: {
        situation: `A triangle has three sides. The second side is ${a} cm longer than the first. The third side is ${b} cm shorter than twice the first. The perimeter is ${perimeter} cm.`,
        letX: "Let x be the length of the first side in centimetres.",
        question: "How long is the longest side?",
        unit: "cm",
        build: `The sides are x, x + ${a} and 2x − ${b}. The perimeter is their sum: x + (x + ${a}) + (2x − ${b}) = ${perimeter}.`,
        answer: `The sides are ${sides[0]} cm, ${sides[1]} cm and ${sides[2]} cm, so the longest side is ${longest} cm.`,
      },
      fi: {
        situation: `Kolmiolla on kolme sivua. Toinen sivu on ${a} cm pidempi kuin ensimmäinen. Kolmas sivu on ${b} cm lyhyempi kuin ensimmäisen sivun kaksinkertainen pituus. Piiri on ${perimeter} cm.`,
        letX: "Olkoon x ensimmäisen sivun pituus senttimetreinä.",
        question: "Kuinka pitkä on pisin sivu?",
        unit: "cm",
        build: `Sivut ovat x, x + ${a} ja 2x − ${b}. Piiri on niiden summa: x + (x + ${a}) + (2x − ${b}) = ${perimeter}.`,
        answer: `Sivut ovat ${sides[0]} cm, ${sides[1]} cm ja ${sides[2]} cm, joten pisin sivu on ${longest} cm.`,
      },
    },
  };
}

/** A number as it is written in a story: a real minus sign for negative temperatures. */
const written = (n: number) => (n < 0 ? `−${-n}` : String(n));

/** The temperature goes up (or down) by some degrees and ends below zero, so the answer may be negative too. */
export function temperatureStory(change: number, end: number, rising: boolean): Story {
  const start = rising ? end - change : end + change;
  const e = written(end);
  return {
    id: "temperature",
    difficulty: 2,
    equations: rising
      ? [`x + ${change} = ${end}`, `x - ${change} = ${end}`, `x + ${end} = ${change}`, `${change} - x = ${end}`]
      : [`x - ${change} = ${end}`, `x + ${change} = ${end}`, `x - ${end} = ${change}`, `${change} - x = ${end}`],
    solution: start,
    i18n: {
      en: {
        situation: rising
          ? `At night the temperature was some degrees. By morning it had risen ${change} degrees, and then it was ${e} °C.`
          : `At noon the temperature was some degrees. By evening it had fallen ${change} degrees, and then it was ${e} °C.`,
        letX: rising ? "Let x be the temperature at night in degrees Celsius." : "Let x be the temperature at noon in degrees Celsius.",
        question: rising ? "What was the temperature at night?" : "What was the temperature at noon?",
        unit: "°C",
        build: rising ? `The temperature rose ${change}: x + ${change} = ${end}.` : `The temperature fell ${change}: x − ${change} = ${end}.`,
        answer: rising ? `The temperature at night was ${written(start)} °C.` : `The temperature at noon was ${written(start)} °C.`,
      },
      fi: {
        situation: rising
          ? `Yöllä lämpötila oli jokin määrä asteita. Aamuun mennessä se oli noussut ${change} astetta, ja silloin lämpötila oli ${e} °C.`
          : `Keskipäivällä lämpötila oli jokin määrä asteita. Iltaan mennessä se oli laskenut ${change} astetta, ja silloin lämpötila oli ${e} °C.`,
        letX: rising ? "Olkoon x yön lämpötila celsiusasteina." : "Olkoon x keskipäivän lämpötila celsiusasteina.",
        question: rising ? "Mikä oli lämpötila yöllä?" : "Mikä oli lämpötila keskipäivällä?",
        unit: "°C",
        build: rising ? `Lämpötila nousi ${change}: x + ${change} = ${end}.` : `Lämpötila laski ${change}: x − ${change} = ${end}.`,
        answer: rising ? `Yön lämpötila oli ${written(start)} °C.` : `Keskipäivän lämpötila oli ${written(start)} °C.`,
      },
    },
  };
}

/** The temperature falls the same number of degrees each hour. The answer is the fall per hour. */
export function temperatureFallStory(hours: number, perHour: number, from: number): Story {
  const end = from - hours * perHour;
  return {
    id: "temperature-fall",
    difficulty: 3,
    equations: [`${from} - ${hours}x = ${end}`, `${from} + ${hours}x = ${end}`, `${hours}x = ${end}`, `${from} - x = ${end}`],
    solution: perHour,
    i18n: {
      en: {
        situation: `The temperature was ${written(from)} °C. During ${hours} hours it fell by the same number of degrees every hour, and then it was ${written(end)} °C.`,
        letX: "Let x be how many degrees the temperature fell each hour.",
        question: "By how many degrees did it fall each hour?",
        unit: "°",
        build: `It fell ${hours} times x degrees in all: ${written(from)} − ${hours}x = ${written(end)}.`,
        answer: `The temperature fell ${perHour} degrees every hour.`,
      },
      fi: {
        situation: `Lämpötila oli ${written(from)} °C. ${hours} tunnin aikana se laski joka tunti saman verran, ja silloin lämpötila oli ${written(end)} °C.`,
        letX: "Olkoon x se, montako astetta lämpötila laski joka tunti.",
        question: "Montako astetta lämpötila laski tunnissa?",
        unit: "°",
        build: `Se laski yhteensä ${hours} kertaa x astetta: ${written(from)} − ${hours}x = ${written(end)}.`,
        answer: `Lämpötila laski ${perHour} astetta tunnissa.`,
      },
    },
  };
}

/** Two kinds of coin, a known number of coins, a known total: how many of the dearer kind? */
export function coinsStory(coins: number, twos: number): Story | null {
  if ((coins - twos) % 2 !== 0 || twos < 2 || coins - twos < 2) return null;
  const total = 2 * twos + (coins - twos) / 2;
  return {
    id: "coins",
    difficulty: 5,
    equations: [`2x + (${coins} - x)/2 = ${total}`, `2x + (${coins} - x) = ${total}`, `2x + x/2 = ${total}`, `x/2 + 2(${coins} - x) = ${total}`],
    solution: twos,
    i18n: {
      en: {
        situation: `A box holds ${coins} coins. Some are 2-euro coins and the rest are 50-cent coins. Together they are worth ${total} euros.`,
        letX: "Let x be the number of 2-euro coins.",
        question: "How many 2-euro coins are there?",
        unit: "",
        build: `x coins of 2 euros are worth 2x. The other ${coins} − x coins are worth half a euro each: (${coins} − x)/2. Together: 2x + (${coins} − x)/2 = ${total}.`,
        answer: `There are ${twos} 2-euro coins and ${coins - twos} 50-cent coins.`,
      },
      fi: {
        situation: `Rasiassa on ${coins} kolikkoa. Osa on 2 euron kolikoita ja loput 50 sentin kolikoita. Yhteensä ne ovat arvoltaan ${total} euroa.`,
        letX: "Olkoon x 2 euron kolikoiden määrä.",
        question: "Montako 2 euron kolikkoa on?",
        unit: "",
        build: `x kpl 2 euron kolikkoa on arvoltaan 2x. Loput ${coins} − x kolikkoa ovat puoli euroa kappale: (${coins} − x)/2. Yhteensä: 2x + (${coins} − x)/2 = ${total}.`,
        answer: `Kolikoita on ${twos} kpl 2 euron ja ${coins - twos} kpl 50 sentin kolikkoa.`,
      },
    },
  };
}

/** Two fruits at different prices, a known weight and a known bill: how many kilograms of the dearer one? */
export function fruitMixStory(dear: number, cheap: number, kilos: number, dearKilos: number): Story {
  const total = dear * dearKilos + cheap * (kilos - dearKilos);
  return {
    id: "fruit-mix",
    difficulty: 6,
    equations: [
      `${dear}x + ${cheap}(${kilos} - x) = ${total}`,
      `${dear}x + ${cheap}x = ${total}`,
      `${dear}x + ${cheap}(${kilos} + x) = ${total}`,
      `${dear}(${kilos} - x) + ${cheap}x = ${total}`,
    ],
    solution: dearKilos,
    i18n: {
      en: {
        situation: `Cherries cost €${dear} a kilo and plums cost €${cheap} a kilo. Mia buys ${kilos} kilos of fruit altogether and pays €${total}.`,
        letX: "Let x be the number of kilos of cherries.",
        question: "How many kilos of cherries did Mia buy?",
        unit: "kg",
        build: `Cherries: x kilos at €${dear} cost ${dear}x. Plums: ${kilos} − x kilos at €${cheap} cost ${cheap}(${kilos} − x). Together: ${dear}x + ${cheap}(${kilos} − x) = ${total}.`,
        answer: `Mia bought ${dearKilos} kilos of cherries and ${kilos - dearKilos} kilos of plums.`,
      },
      fi: {
        situation: `Kirsikat maksavat ${dear} € kilolta ja luumut ${cheap} € kilolta. Mia ostaa hedelmiä yhteensä ${kilos} kiloa ja maksaa ${total} €.`,
        letX: "Olkoon x kirsikoiden määrä kiloina.",
        question: "Montako kiloa kirsikoita Mia osti?",
        unit: "kg",
        build: `Kirsikat: x kiloa hintaan ${dear} € maksaa ${dear}x. Luumut: ${kilos} − x kiloa hintaan ${cheap} € maksaa ${cheap}(${kilos} − x). Yhteensä: ${dear}x + ${cheap}(${kilos} − x) = ${total}.`,
        answer: `Mia osti ${dearKilos} kiloa kirsikoita ja ${kilos - dearKilos} kiloa luumuja.`,
      },
    },
  };
}

export function bracketPuzzleStory(a: number, b: number, s: number): Story {
  const result = a * (s + b);
  return {
    id: "bracket-puzzle",
    difficulty: 5,
    equations: [`${a}(x + ${b}) = ${result}`, `${a}x + ${b} = ${result}`, `x + ${a * b} = ${result}`, `${a}(x - ${b}) = ${result}`],
    solution: s,
    i18n: {
      en: {
        situation: `I think of a number, add ${b} to it and multiply the result by ${a}. I get ${result}.`,
        letX: "Let x be my number.",
        question: "What number am I thinking of?",
        unit: "",
        build: `First add ${b}: (x + ${b}). Then multiply all of it by ${a}: ${a}(x + ${b}) = ${result}.`,
        answer: `My number is ${s}.`,
      },
      fi: {
        situation: `Ajattelen jotakin lukua, lisään siihen ${b} ja kerron tuloksen luvulla ${a}. Saan ${result}.`,
        letX: "Olkoon x ajattelemani luku.",
        question: "Mitä lukua ajattelen?",
        unit: "",
        build: `Lisää ensin ${b}: (x + ${b}). Kerro sitten koko lauseke luvulla ${a}: ${a}(x + ${b}) = ${result}.`,
        answer: `Ajattelemani luku on ${s}.`,
      },
    },
  };
}

export function cyclistsStory(v1: number, v2: number, t: number): Story {
  const distance = (v1 + v2) * t;
  return {
    id: "cyclists",
    difficulty: 5,
    equations: [`${v1}x + ${v2}x = ${distance}`, `${v1}x = ${distance}`, `${v1}x - ${v2}x = ${distance}`, `${v1 * v2}x = ${distance}`],
    solution: t,
    i18n: {
      en: {
        situation: `Two cyclists start at the same time from two towns ${distance} km apart and ride towards each other. One rides at ${v1} km/h and the other at ${v2} km/h.`,
        letX: "Let x be the number of hours until they meet.",
        question: "After how many hours do they meet?",
        unit: "hours",
        build: `In x hours they ride ${v1}x km and ${v2}x km. Together that is the whole distance: ${v1}x + ${v2}x = ${distance}.`,
        answer: `They meet after ${t} hours.`,
      },
      fi: {
        situation: `Kaksi pyöräilijää lähtee yhtä aikaa kahdesta ${distance} km:n päässä toisistaan olevasta kaupungista ja ajaa toisiaan kohti. Toinen ajaa nopeudella ${v1} km/h ja toinen nopeudella ${v2} km/h.`,
        letX: "Olkoon x tuntien määrä, kunnes he kohtaavat.",
        question: "Kuinka monen tunnin kuluttua he kohtaavat?",
        unit: "tuntia",
        build: `x tunnissa he ajavat ${v1}x km ja ${v2}x km. Yhteensä se on koko matka: ${v1}x + ${v2}x = ${distance}.`,
        answer: `He kohtaavat ${t} tunnin kuluttua.`,
      },
    },
  };
}

export function trainsStory(d: number, k: number, h: number): Story {
  const v1 = d * k;
  const v2 = v1 + d;
  return {
    id: "trains",
    difficulty: 5,
    equations: [`${v1}(x + ${h}) = ${v2}x`, `${v1}x = ${v2}(x + ${h})`, `${v1}(x + ${h}) = ${v2}`, `${v1}x + ${h} = ${v2}x`],
    solution: k * h,
    i18n: {
      en: {
        situation: `A train leaves a station at ${v1} km/h. ${h} hours later a second train leaves the same station on the same track at ${v2} km/h.`,
        letX: "Let x be the number of hours the second train travels before it catches up with the first.",
        question: "After how many hours does the second train catch up?",
        unit: "hours",
        build: `The second train travels x hours and the first x + ${h} hours. They have gone the same distance: ${v1}(x + ${h}) = ${v2}x.`,
        answer: `The second train catches up after ${k * h} hours.`,
      },
      fi: {
        situation: `Juna lähtee asemalta nopeudella ${v1} km/h. ${h} tuntia myöhemmin toinen juna lähtee samalta asemalta samaa rataa nopeudella ${v2} km/h.`,
        letX: "Olkoon x tuntien määrä, jonka toinen juna ajaa ennen kuin se saavuttaa ensimmäisen.",
        question: "Kuinka monen tunnin kuluttua toinen juna saavuttaa ensimmäisen?",
        unit: "tuntia",
        build: `Toinen juna ajaa x tuntia ja ensimmäinen x + ${h} tuntia. Ne ovat kulkeneet saman matkan: ${v1}(x + ${h}) = ${v2}x.`,
        answer: `Toinen juna saavuttaa ensimmäisen ${k * h} tunnin kuluttua.`,
      },
    },
  };
}

const PART_EN: Record<number, string> = { 2: "half", 3: "a third", 4: "a quarter", 6: "a sixth" };
const PART_FI: Record<number, string> = { 2: "puolikas", 3: "kolmasosa", 4: "neljäsosa", 6: "kuudesosa" };

export function partsStory(a: number, b: number, c: number): Story {
  const s = (c * a * b) / (a - b);
  const first = PART_EN[a];
  return {
    id: "parts",
    difficulty: 6,
    equations: [`x/${a} + ${c} = x/${b}`, `x/${a} - ${c} = x/${b}`, `${a}x + ${c} = ${b}x`, `x/${a} + ${c} = x/${b} + ${c}`],
    solution: s,
    i18n: {
      en: {
        situation: `${first.charAt(0).toUpperCase()}${first.slice(1)} of a number plus ${c} is the same as ${PART_EN[b]} of the number.`,
        letX: "Let x be the number.",
        question: "What is the number?",
        unit: "",
        build: `${first.charAt(0).toUpperCase()}${first.slice(1)} of x is x/${a}, and ${PART_EN[b]} of x is x/${b}: x/${a} + ${c} = x/${b}.`,
        answer: `The number is ${s}.`,
      },
      fi: {
        situation: `Luvun ${PART_FI[a]} lisättynä luvulla ${c} on yhtä suuri kuin luvun ${PART_FI[b]}.`,
        letX: "Olkoon x luku.",
        question: "Mikä luku on?",
        unit: "",
        build: `Luvun x ${PART_FI[a]} on x/${a} ja luvun x ${PART_FI[b]} on x/${b}: x/${a} + ${c} = x/${b}.`,
        answer: `Luku on ${s}.`,
      },
    },
  };
}

export function ellaAgeStory(k: number, m: number, s: number): Story {
  const n = s * (k - 1) - k * m;
  return {
    id: "ella-age",
    difficulty: 6,
    equations: [`x + ${n} = ${k}(x - ${m})`, `x + ${n} = ${k}x - ${m}`, `x + ${n} = ${k}(x + ${m})`, `x - ${n} = ${k}(x - ${m})`],
    solution: s,
    i18n: {
      en: {
        situation: `In ${n} years Ella will be ${k} times as old as she was ${m} years ago.`,
        letX: "Let x be Ella's age now, in years.",
        question: "How old is Ella now?",
        unit: "years",
        build: `In ${n} years she is x + ${n}. ${m} years ago she was x − ${m}, and ${k} times that is ${k}(x − ${m}): x + ${n} = ${k}(x − ${m}).`,
        answer: `Ella is ${s} years old.`,
      },
      fi: {
        situation: `${n} vuoden kuluttua Ella on ${k} kertaa niin vanha kuin hän oli ${m} vuotta sitten.`,
        letX: "Olkoon x Ellan ikä nyt vuosina.",
        question: "Kuinka vanha Ella on nyt?",
        unit: "vuotta",
        build: `${n} vuoden kuluttua hän on x + ${n}. ${m} vuotta sitten hän oli x − ${m}, ja ${k}-kertainen on ${k}(x − ${m}): x + ${n} = ${k}(x − ${m}).`,
        answer: `Ella on ${s}-vuotias.`,
      },
    },
  };
}

export function saleFeeStory(p: number, s: number, fee: number): Story {
  const factor = (100 - p) / 100;
  const total = (s * (100 - p)) / 100 + fee;
  return {
    id: "sale-fee",
    difficulty: 6,
    equations: [`${factor}x + ${fee} = ${total}`, `${factor}x = ${total}`, `${p / 100}x + ${fee} = ${total}`, `${factor}(x + ${fee}) = ${total}`],
    solution: s,
    i18n: both((lang) =>
      lang === "en"
        ? {
            situation: `A shirt is sold with ${p} % off. Delivery costs €${fee}. Altogether the customer pays €${total}.`,
            letX: "Let x be the original price of the shirt in euros.",
            question: "What was the original price of the shirt?",
            unit: "€",
            build: `The shirt costs ${factor}x after the discount, and the delivery is added once: ${factor}x + ${fee} = ${total}.`,
            answer: `The shirt originally cost €${s}.`,
          }
        : {
            situation: `Paita myydään ${p} %:n alennuksella. Toimitus maksaa ${fee} €. Asiakas maksaa yhteensä ${total} €.`,
            letX: "Olkoon x paidan alkuperäinen hinta euroina.",
            question: "Mikä oli paidan alkuperäinen hinta?",
            unit: "€",
            build: `Paita maksaa alennuksen jälkeen ${dec(factor, "fi")}x, ja toimitus lisätään kerran: ${dec(factor, "fi")}x + ${fee} = ${total}.`,
            answer: `Paidan alkuperäinen hinta oli ${s} €.`,
          },
    ),
  };
}

export function workTogetherStory(a: number, b: number): Story {
  const s = (a * b) / (a + b);
  return {
    id: "work-together",
    difficulty: 6,
    equations: [`x/${a} + x/${b} = 1`, `x/${a} + x/${b} = 2`, `${a}x + ${b}x = 1`, `x/${a} - x/${b} = 1`],
    solution: s,
    i18n: {
      en: {
        situation: `Anna can paint a fence in ${a} hours. Ben can paint the same fence in ${b} hours. They work together.`,
        letX: "Let x be the number of hours they need together.",
        question: "How many hours do they need together?",
        unit: "hours",
        build: `In one hour Anna paints 1/${a} of the fence and Ben 1/${b}. In x hours: x/${a} + x/${b} = 1 whole fence.`,
        answer: `Together they need ${s} hours.`,
      },
      fi: {
        situation: `Anna maalaa aidan ${a} tunnissa. Ben maalaa saman aidan ${b} tunnissa. He tekevät työn yhdessä.`,
        letX: "Olkoon x tuntien määrä, jonka he tarvitsevat yhdessä.",
        question: "Kuinka monta tuntia he tarvitsevat yhdessä?",
        unit: "tuntia",
        build: `Tunnissa Anna maalaa 1/${a} aidasta ja Ben 1/${b}. x tunnissa: x/${a} + x/${b} = 1 eli koko aita.`,
        answer: `Yhdessä he tarvitsevat ${s} tuntia.`,
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
  (rng) => sharingStory(int(rng, 2, 6), int(rng, 2, 9)),
  (rng) => {
    const p = int(rng, 2, 6);
    const q = p + int(rng, 1, 4);
    return raceStory(int(rng, 2, 15), p, q, int(rng, 3, 10));
  },
  (rng) => consecutiveStory(int(rng, 3, 40)),
  (rng) => {
    const p = pick(rng, [10, 20, 25, 30, 40]);
    const step = { 10: 10, 20: 5, 25: 4, 30: 10, 40: 5 }[p as 10 | 20 | 25 | 30 | 40];
    return discountStory(p, step * int(rng, 4, 20));
  },
  (rng) => triangleStory(int(rng, 2, 6), int(rng, 5, 14)),
  (rng) => pairPricesStory(int(rng, 2, 12), int(rng, 1, 9)),
  (rng) => triangleSidesStory(int(rng, 2, 6), int(rng, 1, 5), int(rng, 5, 12)),
  (rng) => {
    const change = int(rng, 3, 14);
    const end = int(rng, -9, 6);
    return end === 0 ? null : temperatureStory(change, end, rng() < 0.5);
  },
  (rng) => {
    const hours = int(rng, 2, 5);
    const perHour = int(rng, 1, 6);
    const from = int(rng, -2, 12);
    return from === 0 ? null : temperatureFallStory(hours, perHour, from);
  },
  (rng) => coinsStory(int(rng, 8, 20), int(rng, 2, 12)),
  (rng) => {
    const cheap = int(rng, 1, 4);
    const dear = cheap + int(rng, 1, 4);
    const kilos = int(rng, 8, 14);
    return fruitMixStory(dear, cheap, kilos, int(rng, 2, kilos - 2));
  },
  (rng) => bracketPuzzleStory(int(rng, 2, 6), int(rng, 2, 9), int(rng, 2, 14)),
  (rng) => cyclistsStory(int(rng, 8, 20), int(rng, 10, 24), int(rng, 2, 5)),
  (rng) => trainsStory(pick(rng, [10, 20, 30]), int(rng, 2, 5), int(rng, 1, 3)),
  (rng) => {
    const [a, b] = pick(rng, [[3, 2], [4, 2], [6, 3], [6, 2]] as const);
    return partsStory(a, b, int(rng, 2, 9));
  },
  (rng) => {
    const k = int(rng, 2, 3);
    const m = int(rng, 2, 6);
    const s = int(rng, 8, 20);
    const n = s * (k - 1) - k * m;
    return n > 0 && n < 25 ? ellaAgeStory(k, m, s) : null;
  },
  (rng) => {
    const p = pick(rng, [10, 20, 25]);
    const step = { 10: 10, 20: 5, 25: 4 }[p as 10 | 20 | 25];
    return saleFeeStory(p, step * int(rng, 4, 16), int(rng, 2, 9));
  },
  (rng) => {
    const [a, b] = pick(rng, [[3, 6], [4, 12], [6, 12], [10, 15], [6, 3], [12, 4]] as const);
    return a === b ? null : workTogetherStory(a, b);
  },
];

/** True when the equation text has exactly one solution and it equals `expected`. */
function solvesTo(text: string, expected: number): boolean {
  const parsed = parseEquation(text);
  if (!parsed.ok) return false;
  const solution = solveEquation(parsed.value);
  return solution.kind === "one" && solution.value.d === 1 && solution.value.n === expected;
}

export interface StoryOptions {
  /** Only stories of this difficulty. */
  readonly difficulty?: Story["difficulty"];
  /** Only stories of these difficulties. */
  readonly tiers?: readonly Story["difficulty"][];
}

/** A verified word problem: the first option is the only one that gives the intended answer. */
export function sampleStory(rng: Rng, options: StoryOptions = {}): Story {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const story = pick(rng, TEMPLATES)(rng);
    if (!story) continue;
    if (options.difficulty && story.difficulty !== options.difficulty) continue;
    if (options.tiers && !options.tiers.includes(story.difficulty)) continue;
    const [correct, ...wrong] = story.equations;
    if (solvesTo(correct, story.solution) && wrong.every((text) => !solvesTo(text, story.solution))) return story;
  }
  throw new Error("Could not build a valid word problem");
}

/** The story used for the worked example of the first word-problem level: fixed, so it reads the same every time. */
export const EXAMPLE_STORY: Story = taxiStory(3, 2, 6);

/** The worked example of each word-problem level. */
export const EXAMPLE_STORIES: Readonly<Record<"word" | "hard-word", Story>> = {
  word: EXAMPLE_STORY,
  "hard-word": consecutiveStory(15),
};

/** The difficulty tiers a topic draws its stories from. */
export function tiersOfTopic(topic: string): readonly Story["difficulty"][] {
  return topic === "hard-word" ? [4, 5, 6] : [1, 2, 3];
}

/**
 * The stories of one round of a word-problem level: easy ones first, climbing
 * through the level's tiers, and never the same situation twice in a row.
 */
export function pickStoryRound(rng: Rng, count: number, tiers: readonly Story["difficulty"][] = [1, 2, 3]): Story[] {
  const stories: Story[] = [];
  for (let index = 0; index < count; index += 1) {
    const ratio = count === 1 ? 0 : index / (count - 1);
    const step = ratio < 0.4 ? 0 : ratio < 0.8 ? 1 : 2;
    const difficulty = tiers[Math.min(step, tiers.length - 1)];
    let story = sampleStory(rng, { difficulty });
    for (let retry = 0; retry < 10 && stories.some((earlier) => earlier.id === story.id); retry += 1) {
      story = sampleStory(rng, { difficulty });
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
