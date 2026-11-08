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
