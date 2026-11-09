import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/equations";
import { sampleEquation, type EquationTopic } from "../sample";

/** Learners meet positive and negative numbers in every kind of equation, in both the answers and the numbers written. */
describe("positive and negative numbers are mixed in every generated equation", () => {
  const topics: readonly EquationTopic[] = ["one-step", "two-step", "both", "brackets", "fractions", "challenge"];

  for (const topic of topics) {
    it(`${topic}: both negative and positive answers, and a minus somewhere in most equations`, () => {
      let negativeAnswers = 0;
      let positiveAnswers = 0;
      let withMinus = 0;
      const total = 800;
      for (let seed = 1; seed <= total; seed += 1) {
        const sample = sampleEquation(topic, createRng(seed));
        if (sample.solution < 0) negativeAnswers += 1;
        if (sample.solution > 0) positiveAnswers += 1;
        if (/-/.test(sample.text) || sample.solution < 0) withMinus += 1;
      }
      // A fair mix: neither sign is rare.
      expect(negativeAnswers / total, `${topic} negative answers`).toBeGreaterThan(0.2);
      expect(positiveAnswers / total, `${topic} positive answers`).toBeGreaterThan(0.2);
      expect(withMinus / total, `${topic} equations with a minus`).toBeGreaterThan(0.5);
    });
  }

  it("never produces an equation that is already solved", () => {
    for (const topic of topics) {
      for (let seed = 1; seed <= 400; seed += 1) {
        const sample = sampleEquation(topic, createRng(seed));
        expect(sample.text, topic).not.toMatch(/^x = -?\d+$/);
      }
    }
  });
});
