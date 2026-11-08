import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mustParseEquation, operation } from "@/lib/equations";
import { EquationDisplay } from "../EquationDisplay";

const eq = mustParseEquation;

describe("EquationDisplay", () => {
  it("reads the equation aloud in words", () => {
    render(<EquationDisplay equation={eq("2x + 5 = 17")} />);
    const region = screen.getByRole("region", { name: "Current equation" });
    expect(region.querySelector(".sr-only")?.textContent).toBe("Current equation: 2x plus 5 equals 17");
  });

  it("hides the purely visual copy from assistive technology", () => {
    const { container } = render(<EquationDisplay equation={eq("2x + 5 = 17")} />);
    expect(container.querySelector(".eq-row")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows the same operation highlighted on both sides before simplifying", () => {
    const { container } = render(<EquationDisplay equation={eq("2x + 5 = 17")} applied={operation("subtract", 5)} />);

    const highlighted = container.querySelectorAll(".eq-applied");
    expect(highlighted).toHaveLength(2);
    expect(highlighted[0].textContent).toBe("−5");
    expect(highlighted[1].textContent).toBe("−5");

    const region = screen.getByRole("region", { name: "Current equation" });
    expect(region.querySelector(".sr-only")?.textContent).toBe("Current equation: 2x plus 5 minus 5 equals 17 minus 5");
    expect(container.querySelector(".eq-caption")?.textContent).toBe("Same operation on both sides");
  });

  it("brackets a side that is multiplied or divided, with brackets outside the highlight", () => {
    const { container } = render(<EquationDisplay equation={eq("x/3 + 4 = 9")} applied={operation("multiply", 3)} />);
    const left = container.querySelector(".eq-side-left");
    expect(left?.textContent).toBe("(x3+4)×3");
    expect(left?.querySelector(".eq-applied")?.textContent).toBe("×3");
  });

  it("draws division as a stacked fraction", () => {
    const { container } = render(<EquationDisplay equation={eq("x/4 = 6")} />);
    const fraction = container.querySelector(".eq-frac");
    expect(fraction?.querySelector(".eq-frac-top")?.textContent).toBe("x");
    expect(fraction?.querySelector(".eq-frac-bottom")?.textContent).toBe("4");
  });

  it("shows a solved badge, and uses a true minus sign for negatives", () => {
    const { container } = render(<EquationDisplay equation={eq("x = -6")} solved />);
    expect(screen.getByText("Solved")).toBeTruthy();
    expect(container.querySelector(".eq-solved")).not.toBeNull();
    expect(container.querySelector(".eq-side-right")?.textContent).toBe("−6");
  });

  it("passes the equation length to the stylesheet so long equations shrink to fit", () => {
    const { container } = render(<EquationDisplay equation={eq("-2x + 3 = 11")} applied={operation("subtract", 3)} />);
    const section = container.querySelector<HTMLElement>(".eq");
    expect(section?.style.getPropertyValue("--eq-chars")).toBe(String("−2x + 3 − 3 = 11 − 3".length));
  });
});
