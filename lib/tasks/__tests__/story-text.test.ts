import { describe, expect, it } from "vitest";
import { createRng } from "../../equations";
import { answerFrame, explainBuild } from "../story-text";
import { sampleStory, type Story } from "../stories";

/** Every kind of story, many times over, with different numbers. */
function allStories(): Story[] {
  const rng = createRng(2024);
  const stories: Story[] = [];
  for (let round = 0; round < 60; round += 1) {
    for (const difficulty of [1, 2, 3, 4, 5, 6] as const) stories.push(sampleStory(rng, { difficulty }));
  }
  return stories;
}

describe("the explanation of how a story's equation is built", () => {
  const stories = allStories();

  /** Stories whose own explanation already says the equation, so no hint can be made from it: the generic hint is used. */
  const SAYS_THE_EQUATION = ["ages", "ella-age", "plans", "race"];

  it("is found for the stories where it can be, in both languages, and never contains the equation", () => {
    expect(new Set(stories.map((story) => story.id)).size).toBeGreaterThanOrEqual(20);
    const without = new Set<string>();
    const leaks: string[] = [];
    for (const story of stories) {
      for (const lang of ["en", "fi"] as const) {
        const hint = explainBuild(story.i18n[lang].build, story.equations[0]);
        if (hint === null) without.add(story.id);
        else if (hint.includes("=")) leaks.push(`${story.id}/${lang}: ${hint}`);
      }
    }
    expect(leaks).toEqual([]);
    // Only the stories that say the equation in their explanation have none; every other one has a hint.
    expect([...without].filter((id) => !SAYS_THE_EQUATION.includes(id))).toEqual([]);
  });

  it("gives a hint for most stories, so that the help is the story's own and not a general one", () => {
    const withHint = stories.filter((story) => explainBuild(story.i18n.en.build, story.equations[0]) !== null);
    expect(withHint.length / stories.length).toBeGreaterThan(0.85);
  });

  it("never says both sides of the equation, because that would be the answer", () => {
    const compact = (text: string) => text.replace(/\s/g, "").replace(/[−–]/g, "-");
    for (const story of stories) {
      const hint = explainBuild(story.i18n.en.build, story.equations[0]);
      if (hint === null) continue;
      const [left, right] = story.equations[0].split("=").map(compact);
      const said = (side: string) => side.length >= 2 && compact(hint).includes(side);
      expect(said(left) && said(right), `${story.id}: ${hint}`).toBe(false);
    }
  });

  it("is shorter than the whole text and is a sentence of its own", () => {
    for (const story of stories.slice(0, 40)) {
      const hint = explainBuild(story.i18n.en.build, story.equations[0]);
      if (hint === null) continue;
      expect(hint.length).toBeLessThan(story.i18n.en.build.length);
      expect(hint.endsWith(".")).toBe(true);
      expect(hint).not.toMatch(/\.\.$/);
    }
  });

  it("does not make up an explanation for a text that has none", () => {
    expect(explainBuild("No colon in here.")).toBeNull();
    expect(explainBuild("Total: no equals sign here.")).toBeNull();
    expect(explainBuild("2x = 6: and then 2x + 1 = 7.")).toBeNull();
    expect(explainBuild(": 2x = 6.")).toBeNull();
    expect(explainBuild("")).toBeNull();
  });

  it("keeps the words before the colon, ready to be read on their own", () => {
    expect(explainBuild("The start fee €3 is added once, and €2 is paid for each of the x kilometres: 2x + 3 = 15.")).toBe(
      "The start fee €3 is added once, and €2 is paid for each of the x kilometres.",
    );
  });
});

describe("the answer sentence with a gap for the number", () => {
  const stories = allStories();

  it("has its gap in every story, in both languages, where the number is", () => {
    const failures: string[] = [];
    for (const story of stories) {
      const value = story.final ?? story.solution;
      for (const lang of ["en", "fi"] as const) {
        const answer = story.i18n[lang].answer;
        const frame = answerFrame(answer, value);
        if (!frame) failures.push(`${story.id}/${lang}: no ${value} in "${answer}"`);
        else if (`${frame.before}${value}${frame.after}`.replace("-", "−") !== answer.replace("-", "−")) failures.push(`${story.id}/${lang}: frame does not rebuild "${answer}"`);
      }
    }
    expect(failures.slice(0, 5)).toEqual([]);
  });

  it("finds the number on its own, not inside a longer number", () => {
    expect(answerFrame("The ride was 6 km long.", 6)).toEqual({ before: "The ride was ", after: " km long." });
    expect(answerFrame("There are 16 pupils and 6 teachers.", 6)).toEqual({ before: "There are 16 pupils and ", after: " teachers." });
    expect(answerFrame("It costs 6.5 euros.", 6)).toBeNull();
    expect(answerFrame("It was 26.", 6)).toBeNull();
  });

  it("takes a negative number with its minus sign, written either way", () => {
    expect(answerFrame("It was −4 °C.", -4)).toEqual({ before: "It was ", after: " °C." });
    expect(answerFrame("It was -4 °C.", -4)).toEqual({ before: "It was ", after: " °C." });
  });

  it("has no gap to offer when the number is not in the sentence", () => {
    expect(answerFrame("The ride was long.", 6)).toBeNull();
  });
});
