import { describe, expect, it } from "vitest";
import { LEVELS } from "@/lib/equations";
import { chapterDefinitions, chapterOf, getChapters, lessonOrder, nextLesson } from "../chapters";
import { topics } from "../topics";

describe("the chapters, in the order of the textbook", () => {
  it("has nine chapters whose first eight are the textbook's chapters one to eight", () => {
    const fi = getChapters("fi").map((chapter) => chapter.title);
    expect(fi.slice(0, 8)).toEqual([
      "Yhtälön kertausta",
      "Yhtälön ratkaiseminen",
      "Yhtälön ratkaisemisen harjoittelua",
      "Yhtälön muodostaminen",
      "Sulkeet yhtälössä",
      "Nimittäjät yhtälössä",
      "Ongelmanratkaisua yhtälön avulla",
      "Identtisesti tosi tai epätosi yhtälö",
    ]);
    expect(chapterDefinitions).toHaveLength(9);
    expect(getChapters("en").map((chapter) => chapter.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("holds every lesson exactly once", () => {
    const placed = lessonOrder();
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual(topics.map((topic) => topic.id).sort());
  });

  it("teaches the solver levels in the same order as the chapters", () => {
    const withLevels = lessonOrder().filter((id) => LEVELS.some((level) => level.id === id));
    expect(withLevels).toEqual(LEVELS.map((level) => level.id));
  });

  it("finds the chapter of a lesson and the lesson that follows, across chapters", () => {
    expect(chapterOf("both")?.chapter.id).toBe("practising");
    expect(chapterOf("both")?.index).toBe(1);
    expect(nextLesson("basics")).toBe("one-step");
    expect(nextLesson("two-step")).toBe("both");
    expect(nextLesson("both")).toBe("word");
    expect(nextLesson("proportion")).toBeUndefined();
  });

  it("writes every chapter in both languages", () => {
    for (const definition of chapterDefinitions) {
      expect(definition.text.fi.title).not.toBe(definition.text.en.title);
      expect(definition.text.fi.description).not.toBe(definition.text.en.description);
    }
  });
});
