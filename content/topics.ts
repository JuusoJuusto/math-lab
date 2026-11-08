/**
 * The topic catalogue.
 *
 * Topic ids are stable: they are stored in learners' browsers as progress, and
 * question ids refer to them. Topics that host an interactive solver level use
 * the same id as the level (see lib/equations/levels.ts).
 *
 * Every topic is written once per language. The formula on the card is maths,
 * so it is shared; only its caption is translated.
 *
 * Icons are Lucide icon names (see components/ui/icons.tsx). Emojis are never
 * used as icons.
 */

import type { Lang, Localised } from "../lib/lang";

export type TopicColour = "blue" | "red" | "purple" | "orange" | "teal" | "magenta" | "navy";

export type TopicIconName =
  | "Scale"
  | "Search"
  | "Footprints"
  | "ArrowLeftRight"
  | "Parentheses"
  | "TrendingUp"
  | "MessageSquareText"
  | "Divide"
  | "Infinity"
  | "Puzzle"
  | "Flame";

/** A formula shown large on the topic card, with one highlighted part. */
export interface Formula {
  readonly before: string;
  readonly mark: string;
  readonly after: string;
  /** A short caption under the formula. */
  readonly caption: string;
}

export interface TopicText {
  readonly title: string;
  readonly subtitle: string;
  readonly caption: string;
  readonly description: string;
  readonly lesson: readonly string[];
}

export interface TopicDefinition {
  readonly id: string;
  readonly colour: TopicColour;
  readonly icon: TopicIconName;
  readonly formula: { readonly before: string; readonly mark: string; readonly after: string };
  readonly text: Localised<TopicText>;
}

/** A topic in one language, ready to show. */
export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  colour: TopicColour;
  icon: TopicIconName;
  formula: Formula;
  description: string;
  lesson: string[];
}

export const topicDefinitions: readonly TopicDefinition[] = [
  {
    id: "basics",
    colour: "blue",
    icon: "Scale",
    formula: { before: "", mark: "x", after: " = ?" },
    text: {
      en: {
        title: "Understanding equations",
        subtitle: "What does equality mean?",
        caption: "an unknown number",
        description: "Learn what an equation is and how to find an unknown value.",
        lesson: [
          "An equation says that its left-hand side and right-hand side have the same value.",
          "A letter such as x represents an unknown number.",
          "An equation stays balanced when you perform the same operation on both sides.",
          "The goal is to isolate x on one side of the equation.",
        ],
      },
      fi: {
        title: "Yhtälön ymmärtäminen",
        subtitle: "Mitä yhtäsuuruus tarkoittaa?",
        caption: "tuntematon luku",
        description: "Opi, mikä yhtälö on ja miten löydät tuntemattoman arvon.",
        lesson: [
          "Yhtälö kertoo, että sen vasemmalla ja oikealla puolella on sama arvo.",
          "Kirjain, kuten x, tarkoittaa tuntematonta lukua.",
          "Yhtälö pysyy tasapainossa, kun molemmille puolille tehdään sama laskutoimitus.",
          "Tavoitteena on saada x yksin yhtälön toiselle puolelle.",
        ],
      },
    },
  },
  {
    id: "one-step",
    colour: "red",
    icon: "Search",
    formula: { before: "", mark: "x", after: " + 5 = 12" },
    text: {
      en: {
        title: "One-step equations",
        subtitle: "Undo one operation to find x",
        caption: "undo the + 5",
        description: "Use inverse operations to get x on its own, one step at a time.",
        lesson: [
          "Addition and subtraction undo each other: to undo + 5, subtract 5.",
          "Multiplication and division undo each other: to undo × 3, divide by 3.",
          "Do the same thing to both sides, so the equation stays balanced.",
          "A shortcut: flip a term to the other side and change its sign. x + 5 = 12 becomes x = 12 − 5.",
          "Check your solution by substituting it into the original equation.",
        ],
      },
      fi: {
        title: "Yhden askeleen yhtälöt",
        subtitle: "Kumoa yksi laskutoimitus, niin löydät x:n",
        caption: "kumoa + 5",
        description: "Käytä käänteisoperaatioita, niin saat x:n yksin yksi askel kerrallaan.",
        lesson: [
          "Yhteenlasku ja vähennyslasku kumoavat toisensa: + 5 kumotaan vähentämällä 5.",
          "Kertolasku ja jakolasku kumoavat toisensa: · 3 kumotaan jakamalla luvulla 3.",
          "Tee sama molemmille puolille, jotta yhtälö pysyy tasapainossa.",
          "Oikotie: siirrä termi yhtälön toiselle puolelle ja vaihda sen merkki. x + 5 = 12 muuttuu muotoon x = 12 − 5.",
          "Tarkista ratkaisu sijoittamalla se alkuperäiseen yhtälöön.",
        ],
      },
    },
  },
  {
    id: "two-step",
    colour: "purple",
    icon: "Footprints",
    formula: { before: "", mark: "2x", after: " + 5 = 17" },
    text: {
      en: {
        title: "Two-step equations",
        subtitle: "Undo two operations, in order",
        caption: "subtract, then divide",
        description: "Solve equations where x has been multiplied or divided and then had a number added or subtracted.",
        lesson: [
          "In 2x + 5, x is multiplied by 2 first, then 5 is added.",
          "Undo the operations in reverse order: subtract 5 first, then divide by 2.",
          "After each step, look at what is still attached to x.",
          "With flips: 2x + 5 = 17 becomes 2x = 17 − 5, and then x = 12 : 2.",
          "Check your solution by substituting it into the original equation.",
        ],
      },
      fi: {
        title: "Kahden askeleen yhtälöt",
        subtitle: "Kumoa kaksi laskutoimitusta järjestyksessä",
        caption: "vähennä, sitten jaa",
        description: "Ratkaise yhtälöt, joissa x on kerrottu tai jaettu ja sen jälkeen siihen on lisätty tai siitä on vähennetty luku.",
        lesson: [
          "Lausekkeessa 2x + 5 x kerrotaan ensin kahdella ja sitten siihen lisätään 5.",
          "Kumoa laskutoimitukset käänteisessä järjestyksessä: vähennä ensin 5 ja jaa sitten kahdella.",
          "Katso jokaisen askeleen jälkeen, mitä x:n vieressä on vielä.",
          "Siirtämällä: 2x + 5 = 17 muuttuu muotoon 2x = 17 − 5 ja sitten x = 12 : 2.",
          "Tarkista ratkaisu sijoittamalla se alkuperäiseen yhtälöön.",
        ],
      },
    },
  },
  {
    id: "both",
    colour: "orange",
    icon: "ArrowLeftRight",
    formula: { before: "3", mark: "x", after: " = x + 8" },
    text: {
      en: {
        title: "Variables on both sides",
        subtitle: "Collect the variable terms",
        caption: "x on both sides",
        description: "Move variable terms to one side and constants to the other.",
        lesson: [
          "Choose the side on which you want to keep x.",
          "Subtract the variable term from both sides to collect the x terms.",
          "Flip an x term across the equals sign and its sign changes too: 5x + 2 = 3x + 12 becomes 5x − 3x + 2 = 12.",
          "Combine like terms, then solve the simpler equation.",
        ],
      },
      fi: {
        title: "Muuttuja molemmilla puolilla",
        subtitle: "Kokoa muuttujatermit yhteen",
        caption: "x molemmilla puolilla",
        description: "Siirrä muuttujatermit yhdelle puolelle ja vakiotermit toiselle.",
        lesson: [
          "Valitse puoli, jolle haluat jättää x:n.",
          "Vähennä muuttujatermi molemmilta puolilta, jotta x-termit kerääntyvät yhdelle puolelle.",
          "Kun x-termi siirretään yhtäsuuruusmerkin yli, sen merkki vaihtuu: 5x + 2 = 3x + 12 muuttuu muotoon 5x − 3x + 2 = 12.",
          "Yhdistä samanlaiset termit ja ratkaise sitten yksinkertaisempi yhtälö.",
        ],
      },
    },
  },
  {
    id: "brackets",
    colour: "teal",
    icon: "Parentheses",
    formula: { before: "2", mark: "(x + 3)", after: " = 14" },
    text: {
      en: {
        title: "Equations with brackets",
        subtitle: "Expand brackets correctly",
        caption: "expand first",
        description: "Practice the distributive property and expanding brackets.",
        lesson: [
          "Multiply every term inside the brackets by the factor outside.",
          "For example, 3(x + 2) = 3x + 6.",
          "Then solve the resulting equation as usual.",
        ],
      },
      fi: {
        title: "Yhtälöt, joissa on sulkuja",
        subtitle: "Poista sulut oikein",
        caption: "poista sulut ensin",
        description: "Harjoittele osittelulakia ja sulkujen poistamista.",
        lesson: [
          "Kerro jokainen sulkeiden sisällä oleva termi sulkeiden edessä olevalla luvulla.",
          "Esimerkiksi 3(x + 2) = 3x + 6.",
          "Ratkaise sitten syntynyt yhtälö tavalliseen tapaan.",
        ],
      },
    },
  },
  {
    id: "fractions",
    colour: "magenta",
    icon: "Divide",
    formula: { before: "", mark: "x/2", after: " + x/3 = 5" },
    text: {
      en: {
        title: "Fractions and ratios",
        subtitle: "Clear the denominators first",
        caption: "multiply by the common denominator",
        description: "Solve equations with fractions by multiplying both sides by the common denominator.",
        lesson: [
          "Find the smallest number that every denominator divides into: the common denominator.",
          "Multiply both sides, and every term, by it. Now there are no fractions left.",
          "Solve the whole-number equation as usual.",
          "A ratio such as x/6 = 4/3 is solved the same way: multiply both sides by 6.",
        ],
      },
      fi: {
        title: "Murtolausekkeet ja verranto",
        subtitle: "Poista ensin nimittäjät",
        caption: "kerro yhteisellä nimittäjällä",
        description: "Ratkaise murtolukuja sisältäviä yhtälöitä kertomalla molemmat puolet yhteisellä nimittäjällä.",
        lesson: [
          "Etsi pienin luku, johon jokainen nimittäjä sopii: yhteinen nimittäjä.",
          "Kerro sillä molemmat puolet ja jokainen termi. Murtoluvut häviävät.",
          "Ratkaise kokonaislukuyhtälö tavalliseen tapaan.",
          "Verranto, kuten x/6 = 4/3, ratkeaa samalla tavalla: kerro molemmat puolet luvulla 6.",
        ],
      },
    },
  },
  {
    id: "special",
    colour: "blue",
    icon: "Infinity",
    formula: { before: "2x + 3 = ", mark: "2x", after: " + 7" },
    text: {
      en: {
        title: "No solution or infinitely many",
        subtitle: "When x disappears",
        caption: "x cancels out",
        description: "Some equations are never true and some are always true. Learn to recognise them.",
        lesson: [
          "If x disappears and the two sides are different (3 = 5), the equation has no solution.",
          "If x disappears and the two sides are the same (4 = 4), every number is a solution.",
          "Check by trying two different values of x in the original equation.",
          "These cases show that solving an equation is more than finding one number.",
        ],
      },
      fi: {
        title: "Ei ratkaisua tai äärettömän monta",
        subtitle: "Kun x katoaa",
        caption: "x supistuu pois",
        description: "Jotkin yhtälöt eivät pidä koskaan paikkaansa, ja jotkin pitävät aina. Opi tunnistamaan ne.",
        lesson: [
          "Jos x katoaa ja puolet ovat erisuuret (3 = 5), yhtälöllä ei ole ratkaisua.",
          "Jos x katoaa ja puolet ovat samat (4 = 4), jokainen luku on ratkaisu.",
          "Tarkista kokeilemalla alkuperäiseen yhtälöön kahta eri x:n arvoa.",
          "Nämä tapaukset osoittavat, että yhtälön ratkaiseminen on enemmän kuin yhden luvun löytämistä.",
        ],
      },
    },
  },
  {
    id: "proportion",
    colour: "magenta",
    icon: "TrendingUp",
    formula: { before: "y = ", mark: "k", after: "x" },
    text: {
      en: {
        title: "Proportional relationships",
        subtitle: "How quantities change together",
        caption: "constant ratio",
        description: "Explore direct and inverse proportion.",
        lesson: [
          "In direct proportion, two quantities change by the same factor.",
          "In inverse proportion, increasing one quantity decreases the other in a corresponding way.",
          "In direct proportion, the ratio y/x stays constant.",
        ],
      },
      fi: {
        title: "Verrannollisuus",
        subtitle: "Miten suureet muuttuvat yhdessä",
        caption: "vakiosuhde",
        description: "Tutustu suoraan ja kääntäen verrannollisuuteen.",
        lesson: [
          "Suorassa verrannollisuudessa kaksi suuretta muuttuu samalla kertoimella.",
          "Kääntäen verrannollisuudessa toisen suureen kasvaessa toinen pienenee vastaavasti.",
          "Suorassa verrannollisuudessa suhde y/x pysyy vakiona.",
        ],
      },
    },
  },
  {
    id: "word",
    colour: "navy",
    icon: "MessageSquareText",
    formula: { before: "3", mark: "x", after: " = 6" },
    text: {
      en: {
        title: "Word problems",
        subtitle: "Turn a situation into an equation",
        caption: "from a story",
        description: "Build and solve equations from everyday situations.",
        lesson: [
          "Read the problem and decide what the unknown x represents.",
          "Use the information in the problem to write an equation.",
          "Solve the equation and answer the question in a complete sentence.",
          "Check that your answer makes sense in the given situation.",
        ],
      },
      fi: {
        title: "Sanalliset tehtävät",
        subtitle: "Muuta tilanne yhtälöksi",
        caption: "tarinasta",
        description: "Muodosta ja ratkaise yhtälöitä arkisista tilanteista.",
        lesson: [
          "Lue tehtävä ja päätä, mitä tuntematon x tarkoittaa.",
          "Kirjoita tehtävän tiedoista yhtälö.",
          "Ratkaise yhtälö ja vastaa kysymykseen kokonaisella lauseella.",
          "Tarkista, että vastaus on järkevä tilanteessa.",
        ],
      },
    },
  },
  {
    id: "hard-word",
    colour: "teal",
    icon: "Puzzle",
    formula: { before: "", mark: "3x/4", after: " = 60" },
    text: {
      en: {
        title: "Hard word problems",
        subtitle: "Brackets, percentages and speed",
        caption: "longer stories",
        description: "Longer stories with brackets, percentages, consecutive numbers and things that move. You write the whole equation yourself.",
        lesson: [
          "Say in words what each part of the story is worth.",
          "Turn the words into expressions with x. Consecutive numbers are x, x + 1, x + 2.",
          "A percentage is a decimal: 25 % off leaves 0.75 of the price.",
          "Distance = speed × time. Two things moving towards each other add their distances.",
        ],
      },
      fi: {
        title: "Vaativat sanalliset tehtävät",
        subtitle: "Sulkuja, prosentteja ja nopeutta",
        caption: "pidemmät tarinat",
        description: "Pidempiä tarinoita, joissa on sulkuja, prosentteja, peräkkäisiä lukuja ja liikettä. Kirjoitat koko yhtälön itse.",
        lesson: [
          "Kerro sanoin, mitä jokainen tarinan osa on.",
          "Muuta sanat lausekkeiksi, joissa on x. Peräkkäiset luvut ovat x, x + 1, x + 2.",
          "Prosentti on desimaaliluku: 25 %:n alennus jättää 0,75-osan hinnasta.",
          "Matka = nopeus · aika. Toisiaan kohti kulkevien matkat lasketaan yhteen.",
        ],
      },
    },
  },
  {
    id: "challenge",
    colour: "red",
    icon: "Flame",
    formula: { before: "", mark: "3(x − 2)", after: " = x/2" },
    text: {
      en: {
        title: "Challenge",
        subtitle: "The hardest equations",
        caption: "every method together",
        description: "Brackets on both sides, fractions and negative numbers in one equation. Use every method you know.",
        lesson: [
          "Open the brackets first, and simplify each side.",
          "If there are fractions, multiply both sides by the common denominator.",
          "Collect x on one side and the numbers on the other.",
          "Always check the answer by substituting it.",
        ],
      },
      fi: {
        title: "Haastetaso",
        subtitle: "Vaikeimmat yhtälöt",
        caption: "kaikki menetelmät yhdessä",
        description: "Sulkuja molemmilla puolilla, murtolukuja ja negatiivisia lukuja samassa yhtälössä. Käytä kaikkia tuntemiasi menetelmiä.",
        lesson: [
          "Poista ensin sulut ja sievennä kumpikin puoli.",
          "Jos mukana on murtolukuja, kerro molemmat puolet yhteisellä nimittäjällä.",
          "Kokoa x yhdelle puolelle ja luvut toiselle.",
          "Tarkista vastaus aina sijoittamalla se.",
        ],
      },
    },
  },
];

const cache: Partial<Record<Lang, Topic[]>> = {};

/** The topic catalogue in one language. The list is built once per language; do not change it. */
export function getTopics(lang: Lang = "en"): Topic[] {
  return (cache[lang] ??= buildTopics(lang));
}

function buildTopics(lang: Lang): Topic[] {
  return topicDefinitions.map((definition) => {
    const text = definition.text[lang];
    return {
      id: definition.id,
      title: text.title,
      subtitle: text.subtitle,
      colour: definition.colour,
      icon: definition.icon,
      formula: { ...definition.formula, caption: text.caption },
      description: text.description,
      lesson: [...text.lesson],
    };
  });
}

/** The English catalogue. Other languages: {@link getTopics}. */
export const topics: Topic[] = getTopics("en");

export function getTopic(id: string, lang: Lang = "en"): Topic | undefined {
  return getTopics(lang).find((topic) => topic.id === id);
}
