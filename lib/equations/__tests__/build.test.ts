import { describe, expect, it } from "vitest";
import { judgeBuiltEquation } from "../build";
import { mustParseEquation } from "../parse";

const eq = mustParseEquation;
const judge = (built: string, intended: string) => judgeBuiltEquation(eq(built), eq(intended));

describe("judging an equation written from a story", () => {
  const intended = "2x + 3 = 15";

  it("accepts the story's equation, however the learner orders it", () => {
    expect(judge("2x + 3 = 15", intended).kind).toBe("exact");
    expect(judge("3 + 2x = 15", intended).kind).toBe("exact");
    expect(judge("15 = 2x + 3", intended).kind).toBe("exact");
    expect(judge("15 = 3 + 2x", intended).kind).toBe("exact");
  });

  it("accepts an equivalent equation that is not just the answer", () => {
    expect(judge("2x = 12", intended).kind).toBe("equivalent");
    expect(judge("4x + 6 = 30", intended).kind).toBe("equivalent");
  });

  it("does not accept an equation that already states the answer", () => {
    expect(judge("x = 6", intended).kind).toBe("answer-given");
    expect(judge("6 = x", intended).kind).toBe("answer-given");
  });

  it("asks for an x", () => {
    expect(judge("3 = 15", intended).kind).toBe("no-variable");
    expect(judge("x - x = 0", intended).kind).toBe("no-variable");
  });

  it("rejects a different solution and says which part to look at", () => {
    expect(judge("2x - 3 = 15", intended)).toEqual({ kind: "wrong", hint: "sign" });
    expect(judge("3x + 2 = 15", intended)).toEqual({ kind: "wrong", hint: "swapped" });
    expect(judge("2x + 3 = 18", intended)).toEqual({ kind: "wrong", hint: "total" });
    expect(judge("5x = 15", intended)).toEqual({ kind: "wrong", hint: "general" });
  });

  it("works when x is on both sides", () => {
    const plans = "x + 24 = 3x";
    expect(judge("3x = x + 24", plans).kind).toBe("exact");
    expect(judge("2x = 24", plans).kind).toBe("equivalent");
    expect(judge("x + 24 = 2x", plans).kind).toBe("wrong");
  });

  it("never calls a wrong equation right: only equations with the same solution are accepted", () => {
    for (const built of ["2x + 3 = 14", "2x + 3 = 16", "x + 3 = 15", "2x + 5 = 15", "2x - 3 = 15"]) {
      const verdict = judge(built, intended).kind;
      expect(["exact", "equivalent", "answer-given"]).not.toContain(verdict);
    }
  });
});

import { readWritten } from "../build";
import { formatEquation } from "../format";

describe("reading an equation typed from scratch", () => {
  const read = (text: string) => {
    const result = readWritten(text);
    return result.ok ? formatEquation(result.equation) : result.problem;
  };

  it("reads what people actually write", () => {
    expect(read("2x+3=15")).toBe("2x + 3 = 15");
    expect(read("  2X + 3 = 15 ")).toBe("2x + 3 = 15");
    expect(read("3(x + 1) = 18")).toBe("3x + 3 = 18");
    expect(read("0,75x = 60")).toBe("3x/4 = 60");
    expect(read("x - 0.25x = 60")).toBe("3x/4 = 60");
    expect(read("x : 2 + 1 = 5")).toBe("x/2 + 1 = 5");
    expect(read("(x + 1)/2 = 4")).toBe("x/2 + 1/2 = 4");
    expect(read("2·x = 8")).toBe("2x = 8");
    expect(read("x + (x + 1) + (x + 2) = 48")).toBe("3x + 3 = 48");
    expect(read("15 = 2x + 3")).toBe("15 = 2x + 3");
  });

  it("says what is wrong when it cannot be read", () => {
    expect(read("")).toBe("empty");
    expect(read("2x + 3")).toBe("no-equals");
    expect(read("2x = 3 = 5")).toBe("many-equals");
    expect(read("2y + 3 = 15")).toBe("unknown-letter");
    expect(read("x*x = 16")).toBe("not-linear");
    expect(read("3/x = 2")).toBe("not-linear");
    expect(read("2x + = 15")).toBe("unreadable");
    expect(read("(2x + 3 = 15")).toBe("unreadable");
  });

  it("feeds the judge: an equivalent way of writing it is accepted, the answer alone is not", () => {
    const intended = mustParseEquation("0.75x = 60");
    const judge = (text: string) => {
      const written = readWritten(text);
      return written.ok ? judgeBuiltEquation(written.equation, intended).kind : written.problem;
    };
    expect(judge("x - 0.25x = 60")).toBe("exact");
    expect(judge("3/4 x = 60")).toBe("exact"); // three quarters of x
    expect(judge("3x/4 = 60")).toBe("exact");
    expect(judge("x = 80")).toBe("answer-given");
    expect(judge("0.25x = 60")).toBe("wrong");
  });
});
