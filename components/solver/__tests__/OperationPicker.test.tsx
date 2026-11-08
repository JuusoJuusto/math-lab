import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { operation } from "@/lib/equations";
import { OperationPicker } from "../OperationPicker";

function setup() {
  const onApply = vi.fn();
  const user = userEvent.setup();
  render(<OperationPicker onApply={onApply} />);
  return { onApply, user };
}

const amountInput = () => screen.getByLabelText("By how much?");

describe("OperationPicker", () => {
  it("offers the four operations as radio buttons", () => {
    setup();
    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual(["add", "subtract", "multiply", "divide"]);
  });

  it("applies the chosen operation and number", async () => {
    const { onApply, user } = setup();
    await user.click(screen.getByRole("radio", { name: "Subtract" }));
    fireEvent.change(amountInput(), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(onApply).toHaveBeenCalledWith(operation("subtract", 5));
  });

  it("describes the choice in a sentence as it is made", async () => {
    const { user } = setup();
    expect(screen.getByText("Choose an operation and a number.")).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Divide" }));
    fireEvent.change(amountInput(), { target: { value: "-2" } });
    expect(screen.getByText("Divide both sides by −2")).toBeTruthy();
  });

  it("submits with the Enter key from the number field", async () => {
    const { onApply, user } = setup();
    await user.click(screen.getByRole("radio", { name: "Add" }));
    await user.type(amountInput(), "7{Enter}");
    expect(onApply).toHaveBeenCalledWith(operation("add", 7));
  });

  it("asks for an operation first, without applying anything", async () => {
    const { onApply, user } = setup();
    fireEvent.change(amountInput(), { target: { value: "5" } });
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(screen.getByRole("alert").textContent).toMatch(/choose what to do/i);
    expect(onApply).not.toHaveBeenCalled();
  });

  it.each([["", "empty"], ["2.5", "a decimal"], ["1000", "too large"], ["-1000", "too small"]])(
    "rejects %j (%s) with a helpful message",
    async (value) => {
      const { onApply, user } = setup();
      await user.click(screen.getByRole("radio", { name: "Add" }));
      fireEvent.change(amountInput(), { target: { value } });
      await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
      expect(screen.getByRole("alert").textContent).toMatch(/whole number between −999 and 999/);
      expect(onApply).not.toHaveBeenCalled();
    },
  );

  it("lets zero through, so the engine can explain why dividing by it is not allowed", async () => {
    const { onApply, user } = setup();
    await user.click(screen.getByRole("radio", { name: "Divide" }));
    fireEvent.change(amountInput(), { target: { value: "0" } });
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(onApply).toHaveBeenCalledWith(operation("divide", 0));
  });

  it("steps the number up and down, including below zero", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Increase the number" }));
    await user.click(screen.getByRole("button", { name: "Increase the number" }));
    expect((amountInput() as HTMLInputElement).value).toBe("2");
    for (let i = 0; i < 3; i += 1) await user.click(screen.getByRole("button", { name: "Decrease the number" }));
    expect((amountInput() as HTMLInputElement).value).toBe("-1");
  });

  it("offers the x button only for adding and subtracting, and uses it for x terms", async () => {
    const { onApply, user } = setup();
    expect(screen.queryByRole("button", { name: /x term/ })).toBeNull();

    await user.click(screen.getByRole("radio", { name: "Subtract" }));
    const xButton = screen.getByRole("button", { name: /Amount is an x term: off/ });
    await user.click(xButton);
    expect(xButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.change(amountInput(), { target: { value: "3" } });
    expect(screen.getByText("Subtract 3x from both sides")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(onApply).toHaveBeenCalledWith(operation("subtract", 3, true));

    await user.click(screen.getByRole("radio", { name: "Multiply" }));
    expect(screen.queryByRole("button", { name: /x term/ })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Apply to both sides" }));
    expect(onApply).toHaveBeenLastCalledWith(operation("multiply", 3, false));
  });

  it("supports arrow-key selection like any radio group", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: "Add" }));
    await user.keyboard("{ArrowRight}");
    expect((screen.getByRole("radio", { name: "Subtract" }) as HTMLInputElement).checked).toBe(true);
  });

  it("does not set its own focus unless asked to", () => {
    setup();
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the first choice when asked, for keyboard users after a step", () => {
    render(<OperationPicker onApply={() => {}} autoFocus />);
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Add" }));
  });
});
