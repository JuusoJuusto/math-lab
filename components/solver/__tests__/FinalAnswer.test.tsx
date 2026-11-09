import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { frac, type Fraction } from "@/lib/equations";
import { FinalAnswer } from "../FinalAnswer";

function setup(value: Fraction, lastLine: string, needsWork: boolean, lang: "en" | "fi" = "en") {
  const onAnswered = vi.fn();
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <FinalAnswer value={value} lastLine={lastLine} needsWork={needsWork} onAnswered={onAnswered} />
    </LangProvider>,
  );
  return { user, onAnswered };
}

const field = () => screen.getByLabelText("x =") as HTMLInputElement;
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const check = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Check my answer" }));
const notice = () => document.querySelector(".notice")?.textContent ?? "";

describe("the final answer when the last line is already a number", () => {
  it("is shown as the answer and asks for nothing more", () => {
    const { onAnswered } = setup(frac(6), "x = 6", false);
    expect(screen.getByRole("region", { name: "Final answer" })).toBeTruthy();
    expect(document.querySelector(".mathline")?.textContent).toContain("x");
    expect(document.querySelector(".mathline")?.textContent).toContain("6");
    expect(screen.queryByLabelText("x =")).toBeNull();
    expect(screen.queryByRole("button", { name: "Check my answer" })).toBeNull();
    expect(onAnswered).not.toHaveBeenCalled();
  });

  it("draws a fraction as a fraction and a negative number with its minus sign", () => {
    setup(frac(-3, 2), "x = −3/2", false);
    expect(document.querySelector(".eq-frac")).toBeTruthy();
    expect(document.querySelector(".mathline")?.textContent).toContain("−");
  });
});

describe("the final answer when the number has to be worked out", () => {
  it("shows the last line, and asks what x is", () => {
    setup(frac(6), "x = 12 : 2", true);
    expect(screen.getByRole("heading", { name: "Your final answer" })).toBeTruthy();
    expect(screen.getByText(/Your last line is x = 12 : 2\. The number is not worked out yet\. What is x\?/)).toBeTruthy();
    expect((screen.getByRole("button", { name: "Check my answer" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("accepts the right number, says so, and tells the screen it is done with no wrong tries", async () => {
    const { user, onAnswered } = setup(frac(6), "x = 12 : 2", true);
    type("6");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(0);
    // The card turns into the answer, with a word that the learner worked it out.
    expect(screen.getByRole("region", { name: "Final answer" })).toBeTruthy();
    expect(screen.getByText(/You worked out the number yourself/)).toBeTruthy();
    expect(screen.queryByLabelText("x =")).toBeNull();
  });

  it("can be answered by pressing the keys, with a minus sign", async () => {
    const { user, onAnswered } = setup(frac(-2), "x = 8 : −4", true);
    await user.click(screen.getByRole("button", { name: "minus" }));
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(field().value).toBe("−2");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(0);
  });

  it("counts a wrong try, says what the number is not, and hints after the second", async () => {
    const { user, onAnswered } = setup(frac(6), "x = 12 : 2", true);
    type("5");
    await check(user);
    expect(notice()).toContain("x is not 5");
    expect(notice()).not.toContain("Hint");
    type("7");
    await check(user);
    expect(notice()).toContain("Hint: work out 12 : 2.");
    expect(onAnswered).not.toHaveBeenCalled();
    type("6");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(2);
  });

  it("does not count a number that cannot be read as a mistake", async () => {
    const { user, onAnswered } = setup(frac(6), "x = 12 : 2", true);
    type("six");
    await check(user);
    expect(document.querySelector(".notice-warning")).toBeTruthy();
    type("6");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(0);
  });

  it("asks for a fraction in its simplest form, and does not count that as a mistake either", async () => {
    const { user, onAnswered } = setup(frac(3, 2), "x = 6/4", true);
    type("6/4");
    await check(user);
    expect(notice()).toContain("write the fraction in its simplest form");
    expect(onAnswered).not.toHaveBeenCalled();
    type("3/2");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(0);
  });

  it("takes a decimal for a number that is exact, with a comma or a point", async () => {
    const { user, onAnswered } = setup(frac(1, 2), "x = 3 : 6", true);
    type("0,5");
    await check(user);
    expect(onAnswered).toHaveBeenCalledWith(0);
  });

  it("has the number pad and the picture of the number, with the fraction key", async () => {
    const { user } = setup(frac(3, 2), "x = 6/4", true);
    expect(screen.getByRole("button", { name: /^Fraction: / })).toBeTruthy();
    // Only the keys a number needs.
    expect(screen.queryByRole("button", { name: "x" })).toBeNull();
    expect(screen.queryByRole("button", { name: "plus" })).toBeNull();
    expect(screen.queryByRole("button", { name: "equals" })).toBeNull();
    await user.click(screen.getByRole("button", { name: /^Fraction: / }));
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: /^Bottom of the fraction/ }));
    await user.click(screen.getByRole("button", { name: "2" }));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(field().value).toBe("3/2");
    expect(document.querySelector(".pad-preview .eq-frac")).toBeTruthy();
  });

  it("says what to do in its own words, not the by-hand screen's", () => {
    setup(frac(6), "x = 12 : 2", true);
    expect(screen.getByText("Press the number keys, then check your answer.")).toBeTruthy();
    expect(screen.getByText("Write the number and it shows here.")).toBeTruthy();
    expect(screen.queryByText(/Type the first line/)).toBeNull();
  });

  it("speaks Finnish", async () => {
    const { user, onAnswered } = setup(frac(6), "x = 12 : 2", true, "fi");
    expect(screen.getByRole("heading", { name: "Lopullinen vastauksesi" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("x ="), { target: { value: "6" } });
    await user.click(screen.getByRole("button", { name: "Tarkista vastaukseni" }));
    expect(screen.getByText(/Laskit luvun itse/)).toBeTruthy();
    expect(onAnswered).toHaveBeenCalledWith(0);
  });
});
