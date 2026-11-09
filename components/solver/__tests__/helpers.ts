import { fireEvent, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { formatEquation, solveWithTutor, startEquation } from "@/lib/equations";

type Kind = "Add" | "Subtract" | "Multiply" | "Divide";

/** Chooses an operation and an amount, then applies it, exactly as a learner would. */
export async function applyOperation(user: UserEvent, kind: Kind, amount: number, withX = false) {
  await user.click(screen.getByRole("radio", { name: kind }));
  // A number input cannot hold a lone "-", so set whole values directly.
  fireEvent.change(screen.getByLabelText("By how much?"), { target: { value: String(amount) } });

  const xButton = screen.queryByRole("button", { name: /Amount is an x term/ });
  if (withX && xButton && xButton.getAttribute("aria-pressed") !== "true") await user.click(xButton);

  await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
}

/** The equation currently shown, as the text a screen reader would hear. */
export function spokenEquation(): string {
  return document.querySelector(".eq > .sr-only")?.textContent ?? "";
}

/**
 * Plays one move by asking for all three hints and following the worked one.
 * This exercises the hint system and the controls together, for any equation.
 */
export async function playHintedMove(user: UserEvent) {
  for (let i = 0; i < 3; i += 1) {
    await user.click(screen.getByRole("button", { name: /^(Hint|More help)/ }));
  }
  const worked = screen.getByText(/^Try this:/).textContent ?? "";
  const match = worked.match(/Choose “(\w+)”(?:, type ([-−]?\d+) and turn on the x button| and type ([-−]?\d+))\./);
  if (!match) throw new Error(`Could not read the worked hint: ${worked}`);

  const [, kind, withX, plain] = match;
  const amount = Number((withX ?? plain).replace("−", "-"));
  await applyOperation(user, kind as Kind, amount, withX !== undefined);
  await user.click(screen.getByRole("button", { name: "Work out both sides" }));
}

/** Solves the equation on screen, then verifies it, and returns when "Next"/"Finish" is available. */
export async function solveOnScreenEquation(user: UserEvent) {
  // The last equation of a round is solved by hand: type every line, as the tutor would write it.
  if (document.querySelector(".hand")) return solveByHand(user);
  for (let guard = 0; guard < 8 && !screen.queryByText("Solved"); guard += 1) {
    await playHintedMove(user);
  }
  if (!screen.queryByText("Solved")) throw new Error("Equation was not solved");
  await user.click(screen.getByRole("button", { name: "Check by substituting" }));
}

/**
 * Types the lines a by-hand task asks for, as the tutor would write them: every line, the rest of a begun
 * solution, or the one step that was asked for. Then it checks the answer when there is one to check.
 */
export async function solveByHand(user: UserEvent) {
  const section = document.querySelector(".hand .eq-written");
  const source = section?.getAttribute("data-source");
  if (!source) throw new Error("No by-hand equation on screen");
  const variant = section?.getAttribute("data-variant") ?? "full";
  const given = Number(section?.getAttribute("data-given") ?? 0);
  const path = solveWithTutor(startEquation(source.replace(/−/g, "-"))).map((step) => formatEquation(step.after).replace(/−/g, "-"));
  const lines = variant === "continue" ? path.slice(given) : variant === "write" ? path.slice(0, 1) : path;
  for (const line of lines) {
    fireEvent.change(screen.getByLabelText(/Write the next line|Kirjoita seuraava rivi/), { target: { value: line } });
    await user.click(screen.getByRole("button", { name: /Add line|Lisää rivi/ }));
  }
  const check = screen.queryByRole("button", { name: "Check by substituting" });
  if (check) await user.click(check);
}

/**
 * Solves the equation on screen the way a learner who needs no help would: the tutor's own steps, typed in, with no hint
 * asked for. The last exercise of a round is solved by hand, line by line.
 */
export async function solveCleanly(user: UserEvent) {
  if (document.querySelector(".hand")) return solveByHand(user);
  const kinds = { add: "Add", subtract: "Subtract", multiply: "Multiply", divide: "Divide" } as const;
  for (let guard = 0; guard < 10 && !screen.queryByText("Solved"); guard += 1) {
    const text = document.querySelector(".eq")?.getAttribute("data-equation");
    if (!text) throw new Error("No equation on screen");
    const step = solveWithTutor(startEquation(text.replace(/−/g, "-")))[0];
    const op = step.operation;
    await applyOperation(user, kinds[op.kind], Number(op.amount.n) / Number(op.amount.d), op.withVariable);
    await user.click(screen.getByRole("button", { name: "Work out both sides" }));
  }
  if (!screen.queryByText("Solved")) throw new Error("Equation was not solved");
  await user.click(screen.getByRole("button", { name: "Check by substituting" }));
}
