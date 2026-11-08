import { describe, expect, it } from "vitest";
import { LEVELS, isSolution, parseEquation, parseExpression, getLevel, type Fraction } from "@/lib/equations";
import { questions, questionsFor } from "../questions";
import { getTopic, topics } from "../topics";

/** "x = −5" or "x = 8.5" -> an exact number, or null when the choice is not an answer to an equation. */
function valueOfChoice(choice: string): Fraction | null {
  const match = choice.match(/^x\s*=\s*(.+)$/);
  if (!match) return null;
  const result = parseExpression(match[1]);
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

  it("separate understanding, one-step, two-step and both-sides equations", () => {
    expect(topics.slice(0, 4).map((topic) => topic.id)).toEqual(["basics", "one-step", "two-step", "both"]);
  });

  it("host exactly the interactive solver levels", () => {
    for (const level of LEVELS) {
      expect(getTopic(level.id), `topic for level ${level.id}`).toBeDefined();
    }
    expect(topics.filter((topic) => getLevel(topic.id)).map((topic) => topic.id)).toEqual(["one-step", "two-step", "both", "word"]);
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
      expect([...covered].sort()).toEqual(["both", "brackets", "one-step", "two-step"]);
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
});
