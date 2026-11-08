import { describe, expect, it } from "vitest";
import { getQuestions, questionDefinitions } from "@/content/questions";
import { getTopics } from "@/content/topics";
import { LEVELS, createRng, engineText, levelText } from "@/lib/equations";
import { uiMessages } from "@/lib/i18n";
import { LANGS } from "@/lib/lang";
import { MODES, buildSession, generateTask, gradeNumber, isInvalid, parseAnswer, sampleStory, type Task } from "..";
import { sampleProportion } from "../stories";

/** Every number in a text, with a decimal comma read as a point: "3,5 cm" and "3.5 cm" both give 3.5. */
function numbersIn(...texts: string[]): string[] {
  return texts
    .join(" ")
    .replace(/(\d),(\d)/g, "$1.$2")
    .match(/\d+(?:\.\d+)?/g)?.sort() ?? [];
}

function everything(task: Task): string {
  const parts = [task.prompt, task.answerText, ...task.explanation];
  if (task.input.type === "choice") parts.push(...task.input.options);
  if (task.display?.type === "equation") parts.push(task.display.text);
  if (task.display?.type === "change") parts.push(task.display.from, task.display.to);
  if (task.display?.type === "lines") parts.push(...task.display.lines.flatMap((line) => [line.text, line.note ?? ""]));
  return parts.join("\n");
}

/** Words that must never appear in Finnish output. They are English function words and maths terms. */
const ENGLISH = /\b(the|both sides|solve|which|what|subtract|divide|multiply|equation|correct|answer|left side|right side|because|then|true|false|line)\b/i;

const sessions = MODES.filter((mode) => mode.id !== "mistakes").flatMap((mode) =>
  [1, 2, 3, 4, 5, 6, 7, 8].flatMap((seed) =>
    buildSession({ mode: mode.id, topic: "all", count: mode.id === "time" ? 20 : 12, seed: seed * 977 }),
  ),
);

describe("a task is the same maths in Finnish and in English", () => {
  it("builds the same sessions however the words are chosen (a session depends on the recipe only)", () => {
    expect(sessions.length).toBeGreaterThan(500);
  });

  it("has the same numbers, the same right answer and the same options in both languages", () => {
    let compared = 0;
    for (const spec of sessions) {
      const en = generateTask(spec, "en");
      const fi = generateTask(spec, "fi");
      const label = `${spec.kind}/${spec.topic}/${spec.seed}`;

      expect(fi.kind, label).toBe(en.kind);
      expect(fi.topic, label).toBe(en.topic);
      expect(fi.input.type, label).toBe(en.input.type);
      expect(numbersIn(everything(fi)), label).toEqual(numbersIn(everything(en)));

      if (en.input.type === "choice" && fi.input.type === "choice") {
        // The same position is right, and there are as many options.
        expect(fi.input.correct, label).toBe(en.input.correct);
        expect(fi.input.options.length, label).toBe(en.input.options.length);
      } else {
        expect(fi.answerValue, label).toEqual(en.answerValue);
      }
      expect(fi.explanation.length, label).toBe(en.explanation.length);
      if (en.display?.type === "equation" && fi.display?.type === "equation") expect(fi.display.text, label).toBe(en.display.text);
      compared += 1;
    }
    expect(compared).toBe(sessions.length);
  });

  it("leaves no English in a Finnish task", () => {
    const offenders: string[] = [];
    for (const spec of sessions) {
      const text = everything(generateTask(spec, "fi"));
      const match = text.match(ENGLISH);
      if (match) offenders.push(`${spec.kind}/${spec.topic}/${spec.seed}: "${match[0]}" in ${text.slice(0, 120).replace(/\n/g, " | ")}`);
    }
    expect(offenders.slice(0, 5)).toEqual([]);
  });

  it("leaves no Finnish in an English task", () => {
    const FINNISH = /\b(yhtälö|ratkaise|molemmille|puolille|rivi|oikein|väärin|vastaus|tosi|epätosi|siis)\w*/i;
    const offenders = sessions.map((spec) => ({ spec, text: everything(generateTask(spec, "en")) })).filter(({ text }) => FINNISH.test(text));
    expect(offenders.map(({ spec }) => `${spec.kind}/${spec.topic}/${spec.seed}`).slice(0, 5)).toEqual([]);
  });

  it("uses the Finnish division and multiplication signs in Finnish working, and the English ones in English", () => {
    const working = sessions
      .map((spec) => ({ spec, fi: generateTask(spec, "fi"), en: generateTask(spec, "en") }))
      .filter(({ en }) => en.kind === "step" && en.display?.type === "change");
    expect(working.length).toBeGreaterThan(10);
    for (const { fi, en } of working) {
      expect(everything(en)).not.toMatch(/[·]|\d : \d/);
      expect(everything(fi)).not.toMatch(/÷|×/);
    }
  });
});

describe("stories and proportion problems", () => {
  it("say the same numbers in both languages", () => {
    const rng = createRng(2024);
    for (let i = 0; i < 400; i += 1) {
      const story = sampleStory(rng);
      for (const field of ["situation", "letX", "question", "build", "answer"] as const) {
        expect(numbersIn(story.i18n.fi[field]), `${story.id}.${field}`).toEqual(numbersIn(story.i18n.en[field]));
      }
      expect(story.i18n.fi.unit === "" ? "" : "x").toBe(story.i18n.en.unit === "" ? "" : "x");
    }
  });

  it("explain proportion problems with the same numbers in both languages", () => {
    const rng = createRng(77);
    for (let i = 0; i < 200; i += 1) {
      const problem = sampleProportion(rng);
      const { en, fi } = problem.i18n;
      expect(numbersIn(fi.text, ...fi.explanation)).toEqual(numbersIn(en.text, ...en.explanation));
    }
  });
});

describe("the question bank", () => {
  it("has the same questions, answers and choices in both languages", () => {
    const en = getQuestions("en");
    const fi = getQuestions("fi");
    expect(fi.map((q) => q.id)).toEqual(en.map((q) => q.id));
    questionDefinitions.forEach((definition, index) => {
      expect(fi[index].choices.length, definition.id).toBe(en[index].choices.length);
      expect(fi[index].choices.indexOf(fi[index].answer), definition.id).toBe(definition.correct);
      expect(numbersIn(...fi[index].choices, fi[index].prompt, fi[index].explanation), definition.id).toEqual(
        numbersIn(...en[index].choices, en[index].prompt, en[index].explanation),
      );
    });
  });

  it("has Finnish text for every question", () => {
    for (const question of getQuestions("fi")) {
      expect(`${question.prompt} ${question.explanation}`, question.id).not.toMatch(ENGLISH);
    }
  });
});

describe("topics and levels", () => {
  it("describe the same topics in both languages", () => {
    const en = getTopics("en");
    const fi = getTopics("fi");
    expect(fi.map((topic) => topic.id)).toEqual(en.map((topic) => topic.id));
    fi.forEach((topic, index) => {
      expect(topic.lesson.length, topic.id).toBe(en[index].lesson.length);
      expect(topic.title, topic.id).not.toBe(en[index].title);
      expect(topic.formula.mark).toBe(en[index].formula.mark);
      expect(`${topic.title} ${topic.lesson.join(" ")} ${topic.description}`, topic.id).not.toMatch(ENGLISH);
    });
  });

  it("have Finnish level text without English leftovers", () => {
    for (const level of LEVELS) {
      const { title, tagline, intro, exampleLead } = levelText(level, "fi");
      expect(`${title} ${tagline} ${intro.lead} ${intro.points.join(" ")} ${intro.keyIdea} ${exampleLead}`, level.id).not.toMatch(ENGLISH);
    }
  });
});

describe("the interface text", () => {
  /** The shape of a message tree: its keys, and for functions their arity. */
  function shape(value: unknown): unknown {
    if (typeof value === "function") return "function";
    if (Array.isArray(value)) return value.map(shape);
    if (typeof value === "object" && value !== null) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, shape(item)]));
    return typeof value;
  }

  it("has exactly the same messages in every language", () => {
    const [first, ...rest] = LANGS;
    for (const lang of rest) {
      expect(shape(uiMessages(lang))).toEqual(shape(uiMessages(first)));
      expect(shape(engineText(lang))).toEqual(shape(engineText(first)));
    }
  });

  it("translates the tutor: every kind of feedback differs between the languages", () => {
    const en = engineText("en").tutor;
    const fi = engineText("fi").tutor;
    const pairs: [string, string][] = [
      [en.noChange.title, fi.noChange.title],
      [en.wrongAmount.title, fi.wrongAmount.title],
      [en.wrongTermNumber.message, fi.wrongTermNumber.message],
      [en.noProgress.message, fi.noProgress.message],
      [en.movesAway(true).message, fi.movesAway(true).message],
      [en.hintCollect1, fi.hintCollect1],
      [en.hintConstant1, fi.hintConstant1],
      [en.hintCoefficient1, fi.hintCoefficient1],
      [en.nextCollect, fi.nextCollect],
    ];
    for (const [english, finnish] of pairs) {
      expect(finnish).not.toBe(english);
      expect(finnish).not.toMatch(ENGLISH);
    }
    expect(fi.praise).toHaveLength(en.praise.length);
  });

  it("writes an answer that is not a number in the language of the learner", () => {
    expect(parseAnswer("", "fi")).toEqual({ ok: false, message: "Kirjoita ensin vastauksesi." });
    expect(parseAnswer("abc", "en")).toMatchObject({ ok: false, message: "Type just a number, like 6, −3 or 7/2." });
    const task = generateTask({ kind: "solve", topic: "one-step", seed: 3 }, "fi");
    const result = gradeNumber(task, "ei", "fi");
    expect(isInvalid(result) && result.invalid).toMatch(/Kirjoita pelkkä luku/);
  });

  it("accepts a decimal comma and a decimal point alike", () => {
    expect(parseAnswer("2,5", "fi")).toEqual(parseAnswer("2.5", "en"));
    expect(parseAnswer("−3", "fi")).toEqual(parseAnswer("-3", "en"));
  });
});
