import { describe, expect, it } from "vitest";
import { LEVELS, isSolution, parseEquation, parseExpression, getLevel, type Fraction } from "@/lib/equations";
import { SOLVE_PREFIX, getQuestions, questions, questionsFor } from "../questions";
import { getTopic, getTopics, topics } from "../topics";

/** "x = −5" or "x = 8.5" -> an exact number, or null when the choice is not an answer to an equation. */
function valueOfChoice(choice: string): Fraction | null {
  const match = choice.match(/^x\s*=\s*(.+)$/);
  if (!match) return null;
  // A Finnish decimal comma is read as a point.
  const result = parseExpression(match[1].replace(/(\d),(\d)/g, "$1.$2"));
  return result.ok && result.value.x.n === 0 ? result.value.c : null;
}

describe("topics", () => {
  it("have unique ids and complete content", () => {
    const ids = topics.map((topic) => topic.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const topic of topics) {
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.lesson.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("each end with something to remember and a mistake to watch out for, in both languages", () => {
    for (const lang of ["en", "fi"] as const) {
      for (const topic of getTopics(lang)) {
        const label = `${lang}/${topic.id}`;
        expect(topic.remember.length, label).toBeGreaterThan(40);
        expect(topic.watchOut.length, label).toBeGreaterThan(40);
        // The two say different things, and they are short enough to be read at a glance.
        expect(topic.remember, label).not.toBe(topic.watchOut);
        expect(topic.remember.length, label).toBeLessThan(260);
        expect(topic.watchOut.length, label).toBeLessThan(300);
        // Neither repeats a key idea word for word.
        expect(topic.lesson, label).not.toContain(topic.remember);
        expect(topic.lesson, label).not.toContain(topic.watchOut);
      }
    }
  });

  it("separate understanding, one-step, two-step and both-sides equations", () => {
    expect(topics.slice(0, 4).map((topic) => topic.id)).toEqual(["basics", "one-step", "two-step", "both"]);
  });

  it("host exactly the interactive solver levels", () => {
    for (const level of LEVELS) {
      expect(getTopic(level.id), `topic for level ${level.id}`).toBeDefined();
    }
    expect(topics.filter((topic) => getLevel(topic.id)).map((topic) => topic.id)).toEqual([
      "one-step",
      "two-step",
      "both",
      "brackets",
      "fractions",
      "special",
      "word",
      "hard-word",
      "challenge",
    ]);
  });

  it("no longer contains the retired combined 'simple' topic", () => {
    expect(getTopic("simple")).toBeUndefined();
  });
});

describe("question bank", () => {
  it("has unique ids", () => {
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only uses topics that exist, and every topic has a practice round", () => {
    for (const question of questions) {
      expect(getTopic(question.topic), `${question.id} topic`).toBeDefined();
    }
    for (const topic of topics) {
      expect(questionsFor(topic.id).length, `${topic.id} questions`).toBeGreaterThan(0);
    }
  });

  it("has a valid answer key for every question", () => {
    for (const question of questions) {
      expect(question.choices, question.id).toContain(question.answer);
      expect(new Set(question.choices).size, `${question.id} duplicate choices`).toBe(question.choices.length);
      expect(question.explanation.length, question.id).toBeGreaterThan(10);
    }
  });

  it("returns the whole bank for the mixed round", () => {
    expect(questionsFor("all")).toHaveLength(questions.length);
  });

  describe("every 'Solve the equation' question is mathematically right", () => {
    const solvable = questions.filter((question) => question.prompt.startsWith("Solve the equation:"));

    it("covers one-step, two-step, both-sides and bracket questions", () => {
      const covered = new Set(solvable.map((question) => question.topic));
      expect([...covered].sort()).toEqual(["both", "brackets", "challenge", "fractions", "one-step", "two-step"]);
    });

    it.each(solvable.map((question) => [question.id, question] as const))("%s", (_id, question) => {
      const parsed = parseEquation(question.prompt.replace("Solve the equation:", ""));
      expect(parsed.ok, `${question.id} prompt should parse`).toBe(true);
      if (!parsed.ok) return;

      const correct = valueOfChoice(question.answer);
      expect(correct, `${question.id} answer should be a number`).not.toBeNull();
      expect(isSolution(parsed.value, correct!), `${question.id}: ${question.answer} should solve it`).toBe(true);

      // Every distractor must be wrong, otherwise the question has two right answers.
      for (const choice of question.choices.filter((item) => item !== question.answer)) {
        const value = valueOfChoice(choice);
        expect(value, `${question.id} distractor ${choice}`).not.toBeNull();
        expect(isSolution(parsed.value, value!), `${question.id}: ${choice} must not be a solution`).toBe(false);
      }
    });
  });

  describe("the Finnish questions are right too", () => {
    const solvable = getQuestions("fi").filter((question) => question.prompt.startsWith(SOLVE_PREFIX.fi));

    it("has the same equations to solve as the English bank", () => {
      expect(solvable.map((question) => question.id)).toEqual(
        questions.filter((question) => question.prompt.startsWith(SOLVE_PREFIX.en)).map((question) => question.id),
      );
    });

    it.each(solvable.map((question) => [question.id, question] as const))("%s", (_id, question) => {
      const parsed = parseEquation(question.prompt.replace(SOLVE_PREFIX.fi, ""));
      expect(parsed.ok, `${question.id} prompt should parse`).toBe(true);
      if (!parsed.ok) return;
      expect(isSolution(parsed.value, valueOfChoice(question.answer)!), question.id).toBe(true);
      for (const choice of question.choices.filter((item) => item !== question.answer)) {
        expect(isSolution(parsed.value, valueOfChoice(choice)!), `${question.id}: ${choice}`).toBe(false);
      }
    });
  });
});
