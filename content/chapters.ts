/**
 * The chapters of the "Learn" page, in the order of the textbook chapters on equations.
 * A chapter holds one or more lessons (the topics of content/topics.ts), and every topic is in exactly one chapter.
 * The headings follow the names of the textbook chapters; the descriptions are MathLab's own.
 */

import type { Lang, Localised } from "../lib/lang";
import { getTopic, type Topic, type TopicColour } from "./topics";

export type ChapterId = "review" | "solving" | "practising" | "forming" | "brackets" | "denominators" | "problems" | "identity" | "extra";

interface ChapterText {
  readonly title: string;
  readonly subtitle: string;
  /** What the chapter is about, in a sentence or two. */
  readonly description: string;
}

export interface ChapterDefinition {
  readonly id: ChapterId;
  readonly colour: TopicColour;
  /** The lessons, in the order to take them. */
  readonly lessons: readonly string[];
  readonly text: Localised<ChapterText>;
}

export const chapterDefinitions: readonly ChapterDefinition[] = [
  {
    id: "review",
    colour: "blue",
    lessons: ["basics"],
    text: {
      en: {
        title: "Reviewing equations",
        subtitle: "Expressions, equations and what a solution is",
        description: "Start here. What is the difference between an expression and an equation, which side is which, and how do you test a number?",
      },
      fi: {
        title: "Yhtälön kertausta",
        subtitle: "Lauseke, yhtälö ja ratkaisu",
        description: "Aloita tästä. Mikä ero on lausekkeella ja yhtälöllä, mikä puoli on mikä ja miten lukua testataan?",
      },
    },
  },
  {
    id: "solving",
    colour: "red",
    lessons: ["one-step"],
    text: {
      en: {
        title: "Solving an equation",
        subtitle: "Do the same to both sides",
        description: "Keep the balance: whatever you do to one side, you do to the other, until x is alone.",
      },
      fi: {
        title: "Yhtälön ratkaiseminen",
        subtitle: "Tee sama molemmille puolille",
        description: "Pidä vaaka tasapainossa: mitä teet toiselle puolelle, teet myös toiselle, kunnes x on yksin.",
      },
    },
  },
  {
    id: "practising",
    colour: "purple",
    lessons: ["two-step", "both"],
    text: {
      en: {
        title: "Practising solving",
        subtitle: "Two steps, x on both sides, any order",
        description: "The steps do not have to come in one fixed order. Practise with several steps and with x on both sides.",
      },
      fi: {
        title: "Yhtälön ratkaisemisen harjoittelua",
        subtitle: "Kaksi vaihetta, x molemmilla puolilla, mikä tahansa järjestys",
        description: "Vaiheiden ei tarvitse olla yhdessä kiinteässä järjestyksessä. Harjoittele useita vaiheita ja x:ää molemmilla puolilla.",
      },
    },
  },
  {
    id: "forming",
    colour: "orange",
    lessons: ["word"],
    text: {
      en: {
        title: "Forming an equation",
        subtitle: "Turn a sentence into an equation",
        description: "Read a short story, write the equation yourself, then solve it.",
      },
      fi: {
        title: "Yhtälön muodostaminen",
        subtitle: "Muuta lause yhtälöksi",
        description: "Lue lyhyt tarina, kirjoita yhtälö itse ja ratkaise se sitten.",
      },
    },
  },
  {
    id: "brackets",
    colour: "teal",
    lessons: ["brackets"],
    text: {
      en: {
        title: "Brackets in an equation",
        subtitle: "Open the brackets first",
        description: "A number outside a bracket multiplies every term inside it. Open the brackets, then solve.",
      },
      fi: {
        title: "Sulkeet yhtälössä",
        subtitle: "Poista sulut ensin",
        description: "Sulkujen edessä oleva luku kertoo jokaisen sulkujen sisällä olevan termin. Poista sulut ja ratkaise sitten.",
      },
    },
  },
  {
    id: "denominators",
    colour: "magenta",
    lessons: ["fractions"],
    text: {
      en: {
        title: "Denominators in an equation",
        subtitle: "Clear the fractions and decimals",
        description: "Multiply every term by a number that makes the fractions or decimals disappear.",
      },
      fi: {
        title: "Nimittäjät yhtälössä",
        subtitle: "Poista murtoluvut ja desimaalit",
        description: "Kerro jokainen termi luvulla, joka poistaa murtoluvut tai desimaalit.",
      },
    },
  },
  {
    id: "problems",
    colour: "navy",
    lessons: ["hard-word"],
    text: {
      en: {
        title: "Problem solving with equations",
        subtitle: "Harder stories, answered in words",
        description: "Follow the steps: choose x, write the others with x, form and solve, check, and answer in words.",
      },
      fi: {
        title: "Ongelmanratkaisua yhtälön avulla",
        subtitle: "Vaativampia tarinoita, vastaus sanoin",
        description: "Seuraa vaiheita: valitse x, kirjoita muut x:n avulla, muodosta ja ratkaise, tarkista ja vastaa sanallisesti.",
      },
    },
  },
  {
    id: "identity",
    colour: "red",
    lessons: ["special"],
    text: {
      en: {
        title: "Identically true or false equations",
        subtitle: "When x disappears",
        description: "Sometimes x cancels out. Then the equation is either always true or never true.",
      },
      fi: {
        title: "Identtisesti tosi tai epätosi yhtälö",
        subtitle: "Kun x katoaa",
        description: "Joskus x supistuu pois. Silloin yhtälö on joko aina tosi tai ei koskaan tosi.",
      },
    },
  },
  {
    id: "extra",
    colour: "purple",
    lessons: ["challenge", "proportion"],
    text: {
      en: {
        title: "Extra challenges",
        subtitle: "Long mixed equations and proportion",
        description: "Put everything together in long equations, and meet proportion.",
      },
      fi: {
        title: "Lisähaasteita",
        subtitle: "Pitkiä sekayhtälöitä ja verrannollisuus",
        description: "Yhdistä kaikki pitkissä yhtälöissä ja tutustu verrannollisuuteen.",
      },
    },
  },
];

export interface Chapter {
  readonly id: ChapterId;
  readonly number: number;
  readonly colour: TopicColour;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly lessons: readonly Topic[];
}

export function getChapters(lang: Lang = "en"): Chapter[] {
  return chapterDefinitions.map((definition, index) => {
    const text = definition.text[lang];
    return {
      id: definition.id,
      number: index + 1,
      colour: definition.colour,
      title: text.title,
      subtitle: text.subtitle,
      description: text.description,
      lessons: definition.lessons.map((id) => getTopic(id, lang)!),
    };
  });
}

/** The chapter that holds a lesson, with the lesson's place in it. */
export function chapterOf(topicId: string, lang: Lang = "en"): { chapter: Chapter; index: number } | undefined {
  for (const chapter of getChapters(lang)) {
    const index = chapter.lessons.findIndex((lesson) => lesson.id === topicId);
    if (index !== -1) return { chapter, index };
  }
  return undefined;
}

/** Every lesson in the order of the chapters. */
export function lessonOrder(): string[] {
  return chapterDefinitions.flatMap((chapter) => [...chapter.lessons]);
}

/** The lesson after this one, across chapters; `undefined` after the last. */
export function nextLesson(topicId: string): string | undefined {
  const order = lessonOrder();
  const index = order.indexOf(topicId);
  return index === -1 ? undefined : order[index + 1];
}
