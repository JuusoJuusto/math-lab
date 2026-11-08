import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { formatEquation, mustParseEquation } from "@/lib/equations";
import { EquationBuilder } from "../EquationBuilder";

/** Fills the boxes for one side. A box left out stays empty (which means 0). */
function fillSide(side: "Left side" | "Right side", values: { x?: number; c?: number; minus?: boolean }) {
  if (values.x !== undefined) fireEvent.change(screen.getByLabelText(`${side}, number before x`), { target: { value: String(values.x) } });
  if (values.c !== undefined) fireEvent.change(screen.getByLabelText(`${side}, plain number`), { target: { value: String(values.c) } });
  if (values.minus) fireEvent.click(screen.getByRole("button", { name: `${side}: Plus` }));
}

function setup(intended = "2x + 3 = 15") {
  const onBuilt = vi.fn();
  const user = userEvent.setup();
  render(<EquationBuilder intended={mustParseEquation(intended)} onBuilt={onBuilt} />);
  return { user, onBuilt };
}

const notice = () => document.querySelector(".notice")?.textContent ?? "";
const check = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Check my equation" }));

describe("EquationBuilder: writing the equation a story describes", () => {
  it("shows what has been written as an equation, and cannot check an empty one", () => {
    setup();
    expect((screen.getByRole("button", { name: "Check my equation" }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector(".build-preview")?.textContent).toContain("Fill in the boxes to see your equation.");

    fillSide("Left side", { x: 2, c: 3 });
    fillSide("Right side", { c: 15 });
    expect(document.querySelector(".build-preview")?.textContent).toContain("Your equation: 2x + 3 = 15");
    expect((screen.getByRole("button", { name: "Check my equation" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("accepts the story's equation and lets the learner go on to solve it", async () => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { x: 2, c: 3 });
    fillSide("Right side", { c: 15 });
    await check(user);

    expect(notice()).toContain("That is the equation!");
    expect(onBuilt).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(onBuilt).toHaveBeenCalledTimes(1);
    const result = onBuilt.mock.calls[0][0];
    expect(result.verdict.kind).toBe("exact");
    expect(formatEquation(result.equation)).toBe("2x + 3 = 15");
    expect(result.mistakes).toBe(0);
    expect(result.hints).toBe(0);
  });

  it("accepts the sides the other way round and the terms in either order", async () => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { c: 15 });
    fillSide("Right side", { x: 2, c: 3 });
    await check(user);
    expect(notice()).toContain("That is the equation!");
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(onBuilt.mock.calls[0][0].verdict.kind).toBe("exact");
  });

  it("accepts an equivalent equation and says so", async () => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { x: 2 });
    fillSide("Right side", { c: 12 });
    await check(user);
    expect(notice()).toContain("That works too");
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(onBuilt.mock.calls[0][0].verdict.kind).toBe("equivalent");
    expect(formatEquation(onBuilt.mock.calls[0][0].equation)).toBe("2x = 12");
  });

  it("does not accept an equation that is only the answer", async () => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { x: 1 });
    fillSide("Right side", { c: 6 });
    await check(user);
    expect(notice()).toContain("x is already on its own there");
    expect(screen.queryByRole("button", { name: /Solve it/ })).toBeNull();
    expect(onBuilt).not.toHaveBeenCalled();
  });

  it("asks for an x", async () => {
    const { user } = setup();
    fillSide("Left side", { c: 3 });
    fillSide("Right side", { c: 15 });
    await check(user);
    expect(notice()).toContain("There is no x in your equation");
  });

  type Wrong = { lx: number; lc?: number; lminus?: boolean; rc: number };
  it.each<[string, Wrong, string]>([
    ["the sign of a number", { lx: 2, lc: 3, lminus: true, rc: 15 }, "Check the plus and minus signs"],
    ["the numbers swapped", { lx: 3, lc: 2, rc: 15 }, "Check which number goes with x"],
    ["the total", { lx: 2, lc: 3, rc: 18 }, "Check the total"],
    ["something else", { lx: 5, rc: 15 }, "That is not what the story says yet"],
  ])("says what to look at when %s is wrong", async (_name, input, title) => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { x: input.lx, c: input.lc, minus: input.lminus });
    fillSide("Right side", { c: input.rc });
    await check(user);
    expect(notice()).toContain(title);
    expect(onBuilt).not.toHaveBeenCalled();
  });

  it("counts wrong tries and hints, and reports them when the equation is finally right", async () => {
    const { user, onBuilt } = setup();
    fillSide("Left side", { x: 2, c: 3 });
    fillSide("Right side", { c: 18 });
    await check(user);
    fillSide("Right side", { c: 15 });
    for (let i = 0; i < 3; i += 1) await user.click(screen.getByRole("button", { name: /^(Hint|More help)/ }));
    expect(screen.getByText(/Here is the equation the story gives: 2x \+ 3 = 15/)).toBeTruthy();
    await check(user);
    await user.click(screen.getByRole("button", { name: /Solve it/ }));

    expect(onBuilt.mock.calls[0][0]).toMatchObject({ mistakes: 1, hints: 3 });
  });

  it("ignores boxes that do not hold a whole number", () => {
    setup();
    fillSide("Left side", { x: 2 });
    fireEvent.change(screen.getByLabelText("Left side, plain number"), { target: { value: "abc" } });
    expect((screen.getByRole("button", { name: "Check my equation" }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.querySelector(".build-preview")?.textContent).toContain("Fill in the boxes");
  });

  it("lets the learner use x on both sides", async () => {
    const { user, onBuilt } = setup("x + 24 = 3x");
    fillSide("Left side", { x: 1, c: 24 });
    fillSide("Right side", { x: 3 });
    await check(user);
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(onBuilt.mock.calls[0][0].verdict.kind).toBe("exact");
  });
});
