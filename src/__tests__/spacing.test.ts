import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Spacing is checked by eye and by measuring in a real browser, which a unit test cannot do. What a unit test can
 * keep is the numbers a measurement found wrong once: small things to touch, and boxes that came out empty.
 */

const css = ["app/globals.css", "app/solver.css"].map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");

/** The last value a property is given in rules for this selector (the later rule wins, as in the browser). */
function lastValue(selector: string, property: string): string | null {
  const rules = [...css.matchAll(new RegExp(`(?:^|[\\s,}])${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*(?:,[^{]*)?\\{([^}]*)\\}`, "gm"))];
  let found: string | null = null;
  for (const rule of rules) {
    const match = rule[1].match(new RegExp(`(?:^|[;\\s])${property}\\s*:\\s*([^;]+)`));
    if (match) found = match[1].trim();
  }
  return found;
}

const px = (value: string | null) => (value ? parseFloat(value) : NaN);

describe("things to touch are big enough for a finger", () => {
  it("makes the language buttons at least 40 by 40, also on a small phone", () => {
    expect(px(lastValue(".lang-option", "min-height"))).toBeGreaterThanOrEqual(40);
    // The phone rule comes later in the file, so it is the one that counts there.
    expect(px(lastValue(".lang-option", "min-width"))).toBeGreaterThanOrEqual(40);
  });

  it("makes the chapter button, the counting switch and the three steps of a word problem at least 44 high", () => {
    for (const selector of [".chapter-go", ".count-toggle", ".word-step"]) {
      expect(px(lastValue(selector, "min-height")), selector).toBeGreaterThanOrEqual(44);
    }
  });

  it("keeps a link that looks small big to touch, without moving anything", () => {
    expect(lastValue(".inline-link", "padding")).toBe("10px 0");
    expect(lastValue(".inline-link", "margin")).toBe("-10px 0");
  });
});

describe("what used to come out cramped", () => {
  it("keeps the label of the XP pill on one line", () => {
    expect(lastValue(".xp-total", "white-space")).toBe("nowrap");
  });

  it("lays the three steps of a word problem out as three equal columns, so none is left alone on a row", () => {
    expect(lastValue(".word-steps", "display")).toBe("grid");
    expect(lastValue(".word-steps", "grid-template-columns")).toBe("repeat(3, minmax(0, 1fr))");
  });

  it("gives every box that holds text some room inside it", () => {
    for (const selector of [".walk-step", ".final-answer", ".count", ".lesson-example", ".path", ".note"]) {
      expect(lastValue(selector, "padding"), selector).toMatch(/\d/);
    }
  });
});
