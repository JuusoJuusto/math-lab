import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mustParseEquation } from "@/lib/equations";
import { BalanceScale, pansOf } from "../BalanceScale";

const eq = mustParseEquation;

describe("the balance picture (vaaka)", () => {
  it("puts x-balls and a numbered weight on each pan", () => {
    const { container } = render(<BalanceScale equation={eq("3x + 2 = x + 8")} />);
    expect(container.querySelectorAll(".scale-ball")).toHaveLength(4);
    expect([...container.querySelectorAll(".scale-weight text")].map((weight) => weight.textContent)).toEqual(["2", "8"]);
  });

  it("shows a solved equation as one ball against one weight", () => {
    const { container } = render(<BalanceScale equation={eq("x = 6")} />);
    expect(container.querySelectorAll(".scale-ball")).toHaveLength(1);
    expect([...container.querySelectorAll(".scale-weight text")].map((weight) => weight.textContent)).toEqual(["6"]);
  });

  it("writes a crowded pan as a multiplier instead of drawing every ball", () => {
    const { container } = render(<BalanceScale equation={eq("7x = 21")} />);
    expect(container.querySelectorAll(".scale-ball")).toHaveLength(4);
    expect(container.querySelector(".scale-times")?.textContent).toBe("×7");
  });

  it("is a picture only: hidden from screen readers, the equation above it says the same", () => {
    const { container } = render(<BalanceScale equation={eq("2x + 1 = 9")} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws nothing when the equation cannot be a scale: negative or fractional terms", () => {
    for (const text of ["x - 3 = 5", "-2x = 6", "x/2 = 4", "3x/4 = 6", "2x + 3 = 2x + 7", "x = -4"]) {
      const { container } = render(<BalanceScale equation={eq(text)} />);
      expect(container.querySelector("svg"), text).toBeNull();
    }
  });

  it("matches the equation: balls are the x terms and the weight is the number", () => {
    expect(pansOf(eq("5x + 4 = 2x + 19"))).toEqual({ left: { balls: 5, weight: 4 }, right: { balls: 2, weight: 19 } });
    expect(pansOf(eq("12 = 3x"))).toEqual({ left: { balls: 0, weight: 12 }, right: { balls: 3, weight: 0 } });
  });
});
