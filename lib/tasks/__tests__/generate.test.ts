import { describe, expect, it } from "vitest";
import {
  applyOperation,
  equalsEquation,
  frac,
  isSolution,
  operation,
  parseEquation,
  sameSolution,
  solveEquation,
  type Equation,
  type Operation,
} from "@/lib/equations";
import { questions } from "@/content/questions";
import { KIND_TOPICS, generateTask, supports, taskFingerprint, type Task, type TaskKind, type TaskSpec } from "..";

const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);

const eq = (text: string): Equation => {
  const parsed = parseEquation(text);
  if (!parsed.ok) throw new Error(`Cannot parse "${text}": ${parsed.message}`);
  return parsed.value;
};

/** Reads "Subtract 5 from both sides" back into an operation, independently of the generator. */
function operationFromText(text: string): Operation {
  const additive = text.match(/^(Add|Subtract) (−?\d*)(x?)(?:\/(\d+))? (?:to|from) both sides$/);
  if (additive) {
    const digits = additive[2].replace("−", "-");
    const top = digits === "" ? 1 : digits === "-" ? -1 : Number(digits);
    return operation(additive[1] === "Add" ? "add" : "subtract", frac(top, additive[4] ? Number(additive[4]) : 1), additive[3] === "x");
  }
  const scaled = text.match(/^(Multiply|Divide) both sides by (−?\d+)$/);
  if (scaled) return operation(scaled[1] === "Multiply" ? "multiply" : "divide", Number(scaled[2].replace("−", "-")));
  throw new Error(`Cannot read operation "${text}"`);
}

function allText(task: Task): string[] {
  const texts = [task.prompt, task.answerText, ...task.explanation];
  if (task.input.type === "choice") texts.push(...task.input.options);
  if (task.display?.type === "equation") texts.push(task.display.text);
  if (task.display?.type === "change") texts.push(task.display.from, task.display.to);
  if (task.display?.type === "lines") task.display.lines.forEach((line) => texts.push(line.text, line.note ?? ""));
  return texts;
}

const PAIRS = (Object.keys(KIND_TOPICS) as TaskKind[])
  .filter((kind) => kind !== "bank")
  .flatMap((kind) => KIND_TOPICS[kind].map((topic) => [kind, topic] as const));

describe("task generation is sound for every kind and topic", () => {
  it("covers every supported pairing", () => {
    expect(PAIRS.length).toBeGreaterThanOrEqual(22);
  });

  describe.each(PAIRS)("%s / %s", (kind, topic) => {
    const tasks = SEEDS.map((seed) => generateTask({ kind, topic, seed }));

    it("is repeatable: the same recipe always gives the same task", () => {
      for (const seed of SEEDS.slice(0, 30)) {
        expect(generateTask({ kind, topic, seed })).toEqual(generateTask({ kind, topic, seed }));
      }
    });

    it("never produces broken text", () => {
      for (const task of tasks) {
        for (const text of allText(task)) {
          expect(text, task.prompt).not.toMatch(/NaN|undefined|Infinity|\[object|null/);
        }
        expect(task.explanation.length).toBeGreaterThan(0);
        expect(task.topic).toBe(kind === "equation" ? "word" : topic);
      }
    });

    it("has a well-formed answer", () => {
      for (const task of tasks) {
        if (task.input.type === "choice") {
          const { options, correct } = task.input;
          expect(options.length).toBeGreaterThanOrEqual(2);
          expect(options.length).toBeLessThanOrEqual(4);
          expect(new Set(options).size, `duplicate options in ${task.prompt}`).toBe(options.length);
          expect(correct).toBeGreaterThanOrEqual(0);
          expect(correct).toBeLessThan(options.length);
          expect(options[correct]).toBe(task.answerText);
        } else {
          expect(task.answerValue).toBeDefined();
        }
      }
    });

    it("varies: many different tasks, not a handful", () => {
      expect(new Set(tasks.map(taskFingerprint)).size).toBeGreaterThan(40);
    });
  });
});

describe("multiple choice (choose)", () => {
  it.each(KIND_TOPICS.choose.map((topic) => [topic] as const))("%s: exactly one option is a solution", (topic) => {
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "choose", topic, seed });
      const equation = eq(task.display?.type === "equation" ? task.display.text : "");
      if (task.input.type !== "choice") throw new Error("expected choices");

      const correctness = task.input.options.map((option) => {
        const value = Number(option.replace("x = ", "").replace("−", "-"));
        return isSolution(equation, frac(value));
      });
      expect(correctness.filter(Boolean), `${task.display?.type === "equation" && task.display.text}`).toHaveLength(1);
      expect(correctness[task.input.correct]).toBe(true);
    }
  });
});

describe("typed answers (solve)", () => {
  it.each(["one-step", "two-step", "both", "brackets"] as const)("%s: the accepted answer solves the displayed equation", (topic) => {
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "solve", topic, seed });
      const equation = eq(task.display?.type === "equation" ? task.display.text : "");
      expect(task.answerValue).toBeDefined();
      expect(isSolution(equation, task.answerValue!)).toBe(true);
      expect(task.answerValue!.d).toBe(1);
      expect(solveEquation(equation)).toEqual({ kind: "one", value: task.answerValue });
    }
  });

  it("word problems: the accepted answer solves the equation behind the story", () => {
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "solve", topic: "word", seed });
      expect(task.checkEquation).toBeDefined();
      expect(isSolution(eq(task.checkEquation!), task.answerValue!)).toBe(true);
    }
  });

  it("proportion: recomputes each template from its own wording", () => {
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "solve", topic: "proportion", seed });
      const text = task.prompt;
      let expected: number;

      let match = text.match(/^(\d+) kg of apples cost €(\d+)\. How much do (\d+) kg cost/);
      if (match) {
        seen.add("price");
        expected = (Number(match[2]) / Number(match[1])) * Number(match[3]);
      } else if ((match = text.match(/represents (\d+) km\. A road is (\d+) cm/))) {
        seen.add("map");
        expected = Number(match[1]) * Number(match[2]);
      } else if ((match = text.match(/^(\d+) workers finish a job in (\d+) hours\. How many hours would (\d+) workers/))) {
        seen.add("workers");
        expected = (Number(match[1]) * Number(match[2])) / Number(match[3]);
      } else if ((match = text.match(/recipe for (\d+) people needs (\d+) g of flour\. How many grams are needed for (\d+) people/))) {
        seen.add("recipe");
        expected = (Number(match[2]) / Number(match[1])) * Number(match[3]);
      } else {
        throw new Error(`Unrecognised proportion problem: ${text}`);
      }

      expect(Number.isInteger(expected), text).toBe(true);
      expect(task.answerValue).toEqual(frac(expected));
    }
    expect([...seen].sort()).toEqual(["map", "price", "recipe", "workers"]);
  });
});

describe("true or false (check)", () => {
  it.each(KIND_TOPICS.check.map((topic) => [topic] as const))("%s: the answer matches an exact substitution", (topic) => {
    let trueCount = 0;
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "check", topic, seed });
      const equation = eq(task.display?.type === "equation" ? task.display.text : "");
      const claimed = Number(task.prompt.match(/x = (−?\d+)/)![1].replace("−", "-"));
      const isTrue = isSolution(equation, frac(claimed));
      if (task.input.type !== "choice") throw new Error("expected choices");
      expect(task.input.options[task.input.correct]).toBe(isTrue ? "True" : "False");
      if (isTrue) trueCount += 1;
    }
    // Both answers must come up, or "always true" would be a winning strategy.
    expect(trueCount).toBeGreaterThan(40);
    expect(trueCount).toBeLessThan(SEEDS.length - 40);
  });
});

describe("which step? (step)", () => {
  it.each(KIND_TOPICS.step.map((topic) => [topic] as const))("%s: only the right operation turns the first equation into the second", (topic) => {
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "step", topic, seed });
      if (task.display?.type !== "change" || task.input.type !== "choice") throw new Error("expected a change");
      const from = eq(task.display.from);
      const to = eq(task.display.to);

      const results = task.input.options.map((text) => {
        const applied = applyOperation(from, operationFromText(text));
        return applied.ok && equalsEquation(applied.step.after, to);
      });
      expect(results.filter(Boolean), `${task.display.from} -> ${task.display.to}`).toHaveLength(1);
      expect(results[task.input.correct]).toBe(true);
      expect(task.input.options).toHaveLength(4);
    }
  });
});

describe("find the mistake (mistake)", () => {
  it.each(KIND_TOPICS.mistake.map((topic) => [topic] as const))("%s: the marked line is exactly the first wrong one", (topic) => {
    let withMistake = 0;
    let without = 0;
    const kinds = new Set<string>();

    for (const seed of SEEDS) {
      const task = generateTask({ kind: "mistake", topic, seed });
      if (task.display?.type !== "lines" || task.input.type !== "choice") throw new Error("expected lines");
      const lines = task.display.lines.map((line) => eq(line.text));

      // The first line whose equation has a different solution from the line before it.
      let firstWrong = -1;
      for (let index = 1; index < lines.length && firstWrong < 0; index += 1) {
        if (!sameSolution(solveEquation(lines[index - 1]), solveEquation(lines[index]))) firstWrong = index;
      }

      const { options, correct } = task.input;
      if (firstWrong < 0) {
        without += 1;
        expect(options[correct]).toBe("There is no mistake");
        // Every line of a correct solution is equivalent, and the last one is solved.
        expect(solveEquation(lines[lines.length - 1]).kind).toBe("one");
      } else {
        withMistake += 1;
        expect(options[correct]).toBe(`Line ${firstWrong + 1}`);
        const text = task.explanation.join(" ");
        if (text.includes("opposite one")) kinds.add("wrong-sign");
        if (text.includes("only done on the left")) kinds.add("one-side");
        if (text.includes("arithmetic")) kinds.add("arithmetic");
      }

      expect(options[options.length - 1]).toBe("There is no mistake");
      expect(options).toHaveLength(lines.length);
    }

    expect(withMistake).toBeGreaterThan(80);
    expect(without).toBeGreaterThan(20);
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });
});

describe("write the equation (equation)", () => {
  it("only the matching equation gives the answer of the story", () => {
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "equation", topic: "word", seed });
      if (task.input.type !== "choice") throw new Error("expected choices");
      const answer = Number(task.explanation[task.explanation.length - 1].match(/x = (−?\d+)/)![1].replace("−", "-"));

      const results = task.input.options.map((option) => isSolution(eq(option), frac(answer)));
      expect(results.filter(Boolean), task.prompt).toHaveLength(1);
      expect(results[task.input.correct]).toBe(true);
    }
  });

  it("uses a good mix of stories", () => {
    const stories = new Set(SEEDS.map((seed) => generateTask({ kind: "equation", topic: "word", seed }).prompt.split(" ").slice(0, 3).join(" ")));
    expect(stories.size).toBeGreaterThanOrEqual(5);
  });
});

describe("fixed quiz questions (bank)", () => {
  it("keeps every question's answer, shuffles the order", () => {
    for (const question of questions) {
      const orders = new Set<string>();
      for (const seed of SEEDS.slice(0, 40)) {
        const task = generateTask({ kind: "bank", topic: question.topic, seed, bankId: question.id });
        if (task.input.type !== "choice") throw new Error("expected choices");
        expect(task.input.options.slice().sort()).toEqual(question.choices.slice().sort());
        expect(task.input.options[task.input.correct]).toBe(question.answer);
        orders.add(task.input.options.join("|"));
      }
      expect(orders.size, question.id).toBeGreaterThan(1);
    }
  });

  it("rejects an unknown question", () => {
    expect(() => generateTask({ kind: "bank", topic: "basics", seed: 1, bankId: "nope" })).toThrow(/Unknown quiz question/);
  });
});

describe("support matrix", () => {
  it("refuses a kind that does not fit the topic", () => {
    expect(supports("mistake", "proportion")).toBe(false);
    const spec: TaskSpec = { kind: "mistake", topic: "proportion", seed: 1 };
    expect(() => generateTask(spec)).toThrow(/not available/);
  });

  it("every supported pairing really generates", () => {
    for (const [kind, topic] of PAIRS) expect(() => generateTask({ kind, topic, seed: 7 })).not.toThrow();
  });
});

describe("misconceptions behind wrong options", () => {
  it("offers the answers a learner would really reach, such as forgetting the last step", () => {
    // 2x + 5 = 17: forgetting to divide gives 12, and adding 5 on the right gives 22 / 2 = 11.
    const found = new Set<number>();
    for (const seed of SEEDS) {
      const task = generateTask({ kind: "choose", topic: "two-step", seed });
      if (task.display?.type !== "equation" || task.input.type !== "choice") continue;
      if (task.display.text !== "2x + 5 = 17") continue;
      task.input.options.forEach((option) => found.add(Number(option.replace("x = ", ""))));
    }
    // Not guaranteed to occur for this exact equation, so only assert when it does.
    if (found.size > 0) {
      expect(found.has(6)).toBe(true);
      expect(found.has(12) || found.has(11)).toBe(true);
    }
  });
});
