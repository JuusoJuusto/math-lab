import { describe, expect, it } from "vitest";
import { mustParseEquation, solveEquation } from "@/lib/equations";
import { questionDefinitions } from "../questions";

/** The questions about equations where x cancels: the answer key is whatever the engine says. */
const special = questionDefinitions.filter((question) => question.topic === "special" && Number(question.id.slice(1)) >= 34);

describe("the questions about no solution and infinitely many solutions", () => {
  it("has enough of them for a whole practice session", () => {
    expect(special.length).toBeGreaterThanOrEqual(9);
  });

  it.each(special.map((question) => [question.id] as const))("%s: the marked answer is what the engine finds, in both languages", (id) => {
    const question = special.find((item) => item.id === id)!;
    const equation = question.text.en.prompt.match(/does (?:the equation )?(.+) have\?$/)?.[1];
    expect(equation, id).toBeDefined();
    expect(question.text.fi.prompt).toContain(equation!);
    const kind = solveEquation(mustParseEquation(equation!)).kind;

    const right = { none: "No solution", one: "Exactly one solution", infinite: "Infinitely many solutions" }[kind];
    const rightFi = { none: "Ei ratkaisua", one: "Täsmälleen yksi ratkaisu", infinite: "Äärettömän monta ratkaisua" }[kind];
    expect(question.text.en.choices[question.correct]).toBe(right);
    expect(question.text.fi.choices[question.correct]).toBe(rightFi);
    expect(question.text.en.choices).toHaveLength(question.text.fi.choices.length);
  });

  it("has both kinds, and says in its explanation what is left when x cancels", () => {
    const kinds = special.map((question) => question.text.en.choices[question.correct]);
    expect(kinds).toContain("No solution");
    expect(kinds).toContain("Infinitely many solutions");
    for (const question of special) expect(question.text.en.explanation).toMatch(/cancel and leave −?\d+ = −?\d+/);
  });
});
