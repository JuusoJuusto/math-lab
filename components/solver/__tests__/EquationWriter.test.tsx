import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { formatEquation, mustParseEquation } from "@/lib/equations";
import { EquationWriter } from "../EquationWriter";

function setup(intended = "2x + 3 = 15", lang: "en" | "fi" = "en") {
  const onBuilt = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <EquationWriter intended={mustParseEquation(intended)} onBuilt={onBuilt} />
    </LangProvider>,
  );
  return { user, onBuilt };
}

const field = () => screen.getByLabelText(/Your equation|Yhtälösi/) as HTMLInputElement;
const notice = () => document.querySelector(".notice")?.textContent ?? "";
const write = (text: string) => fireEvent.change(field(), { target: { value: text } });
const check = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: /Check my equation|Tarkista yhtälöni/ }));

describe("EquationWriter: writing the equation from a blank field", () => {
  it("starts completely empty: no template, no starting text, nothing filled in", () => {
    setup();
    expect(field().value).toBe("");
    expect(field().placeholder).toBe("");
    // Not a set of boxes with x already printed in them.
    expect(document.querySelectorAll("input")).toHaveLength(1);
    expect((screen.getByRole("button", { name: "Check my equation" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("accepts the story's equation however it is written", async () => {
    for (const text of ["2x + 3 = 15", "2x+3=15", "3 + 2x = 15", "15 = 2x + 3", "2X + 3 = 15"]) {
      document.body.innerHTML = "";
      const { user, onBuilt } = setup();
      write(text);
      await check(user);
      expect(notice(), text).toContain("That is the equation!");
      await user.click(screen.getByRole("button", { name: /Solve it/ }));
      expect(onBuilt.mock.calls[0][0].verdict.kind, text).toBe("exact");
    }
  });

  it("accepts brackets, fractions and decimals when they say the same thing", async () => {
    const cases: [string, string][] = [
      ["3(x + 2) = 24", "3x + 6 = 24"],
      ["0.75x = 60", "3x/4 = 60"],
      ["x/2 + x/3 = 5", "5x/6 = 5"],
    ];
    for (const [intended, written] of cases) {
      document.body.innerHTML = "";
      const { user, onBuilt } = setup(intended);
      write(written);
      await check(user);
      await user.click(screen.getByRole("button", { name: /Solve it/ }));
      expect(onBuilt.mock.calls[0][0].verdict.kind, `${intended} / ${written}`).toBe("exact");
    }
  });

  it("shows how the engine reads what was typed, in standard form", () => {
    setup("3(x + 2) = 24");
    write("3(x+2)=24");
    expect(document.querySelector(".build-preview")?.textContent).toBe("Reads as: 3x + 6 = 24");
    write("x/2 +");
    expect(document.querySelector(".build-preview")?.textContent).not.toContain("Reads as");
  });

  it("accepts an equivalent equation and says so", async () => {
    const { user, onBuilt } = setup();
    write("2x = 12");
    await check(user);
    expect(notice()).toContain("That works too");
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(formatEquation(onBuilt.mock.calls[0][0].equation)).toBe("2x = 12");
  });

  it("does not accept an equation that is only the answer", async () => {
    const { user, onBuilt } = setup();
    write("x = 6");
    await check(user);
    expect(notice()).toContain("x is already on its own there");
    expect(screen.queryByRole("button", { name: /Solve it/ })).toBeNull();
    expect(onBuilt).not.toHaveBeenCalled();
  });

  it.each([
    ["", "Write your equation first"],
    ["2x + 3", "An equation needs an equals sign"],
    ["2x = 3 = 5", "Only one equals sign"],
    ["2y + 3 = 15", "Use x for the unknown"],
    ["x*x = 16", "That has x times x or x underneath"],
    ["2x + = 15", "I cannot read that"],
  ])("explains why %j cannot be read", async (text, title) => {
    const { user } = setup();
    write(text || " ");
    if (text === "") {
      // The check button is disabled for an empty field; submitting with Enter says what to do.
      fireEvent.submit(document.querySelector("form")!);
    } else {
      await check(user);
    }
    expect(notice()).toContain(title === "Write your equation first" ? title : title);
  });

  it.each([
    ["the sign of a number", "2x - 3 = 15", "Check the plus and minus signs"],
    ["the numbers swapped", "3x + 2 = 15", "Check which number goes with x"],
    ["the total", "2x + 3 = 18", "Check the total"],
    ["something else", "5x = 15", "That is not what the story says yet"],
  ])("says what to look at when %s is wrong", async (_name, text, title) => {
    const { user, onBuilt } = setup();
    write(text);
    await check(user);
    expect(notice()).toContain(title);
    expect(onBuilt).not.toHaveBeenCalled();
  });

  it("counts wrong tries and hints, and reports them when the equation is finally right", async () => {
    const { user, onBuilt } = setup();
    write("2x + 3 = 18");
    await check(user);
    for (let i = 0; i < 3; i += 1) await user.click(screen.getByRole("button", { name: /^(Hint|More help)/ }));
    expect(screen.getByText(/Here is the equation the story gives: 2x \+ 3 = 15/)).toBeTruthy();
    write("2x + 3 = 15");
    await check(user);
    await user.click(screen.getByRole("button", { name: /Solve it/ }));
    expect(onBuilt.mock.calls[0][0]).toMatchObject({ mistakes: 1, hints: 3 });
  });

  it("has a keypad for phones that types at the caret, and a delete key", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "x" }));
    await user.click(screen.getByRole("button", { name: "plus" }));
    await user.click(screen.getByRole("button", { name: "open bracket" }));
    await user.click(screen.getByRole("button", { name: "close bracket" }));
    await user.click(screen.getByRole("button", { name: "equals" }));
    expect(field().value).toBe("x + () = ");

    await user.click(screen.getByRole("button", { name: "Delete the last character" }));
    expect(field().value).toBe("x + () =");

    // Typing in the middle: put the caret between the brackets and add a key there.
    field().focus();
    field().setSelectionRange(5, 5);
    await user.click(screen.getByRole("button", { name: "x" }));
    expect(field().value).toBe("x + (x) =");
  });

  it("uses the Finnish symbols on the keypad and reads a decimal comma", async () => {
    const { user } = setup("0.75x = 60", "fi");
    expect(screen.getByRole("button", { name: "kertaa" }).textContent).toBe("·");
    expect(screen.getByRole("button", { name: "jaettuna" }).textContent).toBe(":");
    expect(screen.getByRole("button", { name: "desimaalipilkku" }).textContent).toBe(",");
    write("0,75x = 60");
    await check(user);
    expect(notice()).toContain("Se on oikea yhtälö!");
  });

  it("locks the field once the equation is accepted", async () => {
    const { user } = setup();
    write("2x + 3 = 15");
    await check(user);
    expect(field().disabled).toBe(true);
    expect(screen.queryByRole("group", { name: "Symbols" })).toBeNull();
  });
});
