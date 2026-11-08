import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { startEquation } from "@/lib/equations";
import { HandWorkspace } from "../HandWorkspace";

function setup(source: string, lang: "en" | "fi" = "en") {
  const onContinue = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <HandWorkspace source={source} equation={startEquation(source)} continueLabel="Next equation" onContinue={onContinue} />
    </LangProvider>,
  );
  return { user, onContinue };
}

const field = (lang: "en" | "fi" = "en") => screen.getByLabelText(lang === "en" ? "Write the next line" : "Kirjoita seuraava rivi");
async function write(user: ReturnType<typeof userEvent.setup>, text: string, lang: "en" | "fi" = "en") {
  fireEvent.change(field(lang), { target: { value: text } });
  await user.click(screen.getByRole("button", { name: lang === "en" ? "Add line" : "Lisää rivi" }));
}
const sheet = () => screen.queryByRole("region", { name: "Your lines" });

describe("solving by hand", () => {
  it("shows the equation as written and nothing to press: no operation buttons, no tabs, no terms to tap", () => {
    setup("2x + 5 = 17");
    expect(screen.getByRole("region", { name: "The equation" }).getAttribute("data-source")).toBe("2x + 5 = 17");
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("button", { name: "Apply to both sides" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add line" })).toBeTruthy();
    expect(sheet()).toBeNull();
  });

  it("accepts a correct line, names the step the learner took, and stacks it as a line of the solution", async () => {
    const { user } = setup("2x + 5 = 17");
    await write(user, "2x = 12");

    const lines = within(sheet()!).getAllByRole("listitem");
    expect(lines).toHaveLength(1);
    expect(lines[0].querySelector(".history-label")?.textContent).toBe("Step 1 · Subtract 5 from both sides");
    expect(lines[0].querySelector(".history-notebook")?.textContent).toContain("2x = 12");
    expect(lines[0].querySelector(".history-bar")?.textContent).toBe("|| − 5");
    expect((field() as HTMLInputElement).value).toBe("");
  });

  it("does not accept a line that is not a step: same, a jump, or a different equation", async () => {
    const { user } = setup("2x + 5 = 17");

    await write(user, "2x + 5 = 17");
    expect(screen.getByText("That is the same line")).toBeTruthy();

    await write(user, "x = 6");
    expect(screen.getByText("You skipped a step")).toBeTruthy();

    await write(user, "2x = 22");
    expect(screen.getByText("That is not equal to the line above")).toBeTruthy();
    expect(sheet()).toBeNull();
  });

  it("says what could not be read", async () => {
    const { user } = setup("2x + 5 = 17");
    await write(user, "2x + 5");
    expect(screen.getByText("An equation needs an equals sign")).toBeTruthy();
  });

  it("solves a whole equation line by line, then checks it, and reports the effort", async () => {
    const { user, onContinue } = setup("2x + 5 = 17");
    await write(user, "2x = 12");
    await write(user, "x = 6");

    expect(screen.queryByLabelText("Write the next line")).toBeNull();
    expect(screen.getByText("Solved")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    expect(screen.getByText("Both sides are equal, so x = 6 is correct!")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 2, mistakes: 0, hints: 0 });
  });

  it("counts a wrong line as a mistake and an 'I am stuck' as a hint", async () => {
    const { user, onContinue } = setup("2x + 5 = 17");
    await write(user, "2x = 22");
    await user.click(screen.getByRole("button", { name: "I am stuck" }));
    await write(user, "2x = 12");
    await write(user, "x = 6");
    await user.click(screen.getByRole("button", { name: "Check by substituting" }));
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 2, mistakes: 1, hints: 1 });
  });

  it("gives hints one at a time, and the hint follows the current line", async () => {
    const { user } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("button", { name: "I am stuck" }));
    expect(screen.getByText(/Hint 1 of 3/)).toBeTruthy();
    await write(user, "2x = 12");
    // A new line starts the hints again.
    expect(screen.queryByText(/Hint 1 of 3/)).toBeNull();
  });

  it("accepts a different route, and the step written beside a line", async () => {
    const { user } = setup("5x + 2 = 3x + 12");
    await write(user, "5x = 3x + 10 || − 2");
    await write(user, "2x = 10");
    await write(user, "x = 5");
    expect(screen.getByText("Solved")).toBeTruthy();
  });

  it("tidies up brackets as a line of its own, then goes on", async () => {
    const { user } = setup("3(x - 2) = 2x + 5");
    await write(user, "3x - 6 = 2x + 5");
    const lines = within(sheet()!).getAllByRole("listitem");
    expect(lines[0].querySelector(".history-label")?.textContent).toBe("Written more simply");
    await write(user, "x - 6 = 5");
    await write(user, "x = 11");
    expect(screen.getByText("Solved")).toBeTruthy();
  });

  it("ends when x cancels out: 2x + 3 = 2x + 7 has no solution, and the tutor says so", async () => {
    const { user, onContinue } = setup("2x + 3 = 2x + 7");
    await write(user, "3 = 7");
    expect(screen.getAllByText(/no solution/i).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("Write the next line")).toBeNull();
    // There is no x to put back, so there is nothing to check by substituting.
    expect(screen.queryByRole("button", { name: "Check by substituting" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /Next equation/ }));
    expect(onContinue).toHaveBeenCalledWith({ steps: 1, mistakes: 0, hints: 0 });
  });

  it("ends when x cancels out and the equation is always true", async () => {
    const { user } = setup("2(x + 1) = 2x + 2");
    await write(user, "2 = 2");
    expect(screen.getAllByText(/infinitely many/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Next equation/ })).toBeTruthy();
  });

  it("lets the learner delete the last line", async () => {
    const { user } = setup("2x + 5 = 17");
    await write(user, "2x = 12");
    await user.click(screen.getByRole("button", { name: "Delete the last line" }));
    expect(sheet()).toBeNull();
  });

  it("has a keypad for phones that writes into the field, including the two bars", async () => {
    const { user } = setup("2x + 5 = 17");
    await user.click(screen.getByRole("button", { name: "x" }));
    await user.click(screen.getByRole("button", { name: "equals" }));
    expect((field() as HTMLInputElement).value).toBe("x = ");
    await user.click(screen.getByRole("button", { name: "two bars, to write the step beside a line" }));
    expect((field() as HTMLInputElement).value).toContain("||");
  });

  it("speaks Finnish, with the Finnish signs", async () => {
    const { user } = setup("2x + 5 = 17", "fi");
    expect(screen.getByRole("region", { name: "Yhtälö" })).toBeTruthy();
    await write(user, "2x = 12", "fi");
    expect(document.querySelector(".history-label")?.textContent).toBe("Askel 1 · Vähennä molemmilta puolilta 5");
    expect(document.querySelector(".history-bar")?.textContent).toBe("|| − 5");
    await write(user, "x = 12 : 2", "fi");
    expect(screen.getByText("Ratkaistu")).toBeTruthy();
    expect(document.querySelector(".history-bar:last-of-type")?.textContent).toContain("||");
  });
});
