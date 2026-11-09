import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { mustParseEquation } from "@/lib/equations";
import { SolverWorkspace } from "../SolverWorkspace";
import { spokenEquation } from "./helpers";

function setup(equation: string, lang: "en" | "fi" = "en") {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <SolverWorkspace equation={mustParseEquation(equation)} continueLabel="Next equation" onContinue={onContinue} />
    </LangProvider>,
  );
  return { user, onContinue };
}

async function guess(user: ReturnType<typeof userEvent.setup>, value: string, label: RegExp = /Your guess for x/) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
  await user.click(screen.getByRole("button", { name: /Try it|Kokeile/ }));
}

describe("guess and check (trial and improvement)", () => {
  it("is offered for an equation with one solution, and not for one that is never true or always true", () => {
    setup("3x + 4 = 19");
    expect(screen.getByRole("radio", { name: /Guess and check/ })).toBeTruthy();
    document.body.innerHTML = "";
    setup("2x + 3 = 2x + 7");
    expect(screen.queryByRole("radio", { name: /Guess and check/ })).toBeNull();
  });

  it("shows both sides for each guess and says which way to go, without counting a wrong guess as a mistake", async () => {
    const { user } = setup("3x + 4 = 19");
    await user.click(screen.getByRole("radio", { name: /Guess and check/ }));

    await guess(user, "2");
    expect(screen.getByText(/The left side is smaller than the right side\./)).toBeTruthy();
    expect(screen.getByText("Try a larger x.")).toBeTruthy();

    await guess(user, "8");
    expect(screen.getByText(/The left side is bigger than the right side\./)).toBeTruthy();
    expect(screen.getByText("Try a smaller x.")).toBeTruthy();

    const rows = [...document.querySelectorAll(".guess-table tbody tr")].map((row) => [...row.children].map((cell) => cell.textContent));
    expect(rows).toEqual([
      ["2", "10", "19"],
      ["8", "28", "19"],
    ]);
    expect(screen.getByText("2 tries so far")).toBeTruthy();
    // Two wrong guesses are the method, not mistakes.
    expect(document.querySelector(".notice")?.textContent ?? "").not.toMatch(/mistake/i);
  });

  it("finishes the exercise when both sides are equal, and then offers the check", async () => {
    const { user, onContinue } = setup("3x + 4 = 19");
    await user.click(screen.getByRole("radio", { name: /Guess and check/ }));
    await guess(user, "2");
    await guess(user, "5");

    expect(spokenEquation()).toBe("Current equation: x equals 5");
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText("Both sides are equal, so x = 5 is correct!")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onContinue.mock.calls[0][0]).toMatchObject({ mistakes: 0 });
  });

  it("accepts a fraction as a guess, for an answer that is not a whole number", async () => {
    const { user } = setup("2x = 3");
    await user.click(screen.getByRole("radio", { name: /Guess and check/ }));
    await guess(user, "3/2");
    expect(spokenEquation()).toBe("Current equation: x equals 3 over 2");
  });

  it("asks for a number before it tries anything", async () => {
    const { user } = setup("3x + 4 = 19");
    await user.click(screen.getByRole("radio", { name: /Guess and check/ }));
    expect((screen.getByRole("button", { name: /Try it/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Your guess for x/), { target: { value: "abc" } });
    await user.click(screen.getByRole("button", { name: /Try it/ }));
    expect(document.querySelectorAll(".guess-table").length).toBe(0);
  });

  it("speaks Finnish", async () => {
    const { user } = setup("3x + 4 = 19", "fi");
    await user.click(screen.getByRole("radio", { name: /Arvaa ja tarkista/ }));
    await guess(user, "2", /Arvauksesi x:lle/);
    expect(screen.getByText(/Vasen puoli on pienempi kuin oikea puoli\./)).toBeTruthy();
    expect(screen.getByText("Kokeile suurempaa x:ää.")).toBeTruthy();
    expect(screen.getByText("1 yritys tähän mennessä")).toBeTruthy();
  });
});
