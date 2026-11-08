import { fireEvent, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

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
  for (let guard = 0; guard < 8 && !screen.queryByText("Solved"); guard += 1) {
    await playHintedMove(user);
  }
  if (!screen.queryByText("Solved")) throw new Error("Equation was not solved");
  await user.click(screen.getByRole("button", { name: "Check by substituting" }));
}
