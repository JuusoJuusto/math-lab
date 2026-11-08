import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { distributionOf } from "@/lib/equations";
import { DistributeArrows } from "../DistributeArrows";

describe("the arrows over a bracket", () => {
  it("reads a number times a bracket", () => {
    expect(distributionOf("3(x − 2)")).toEqual({ factor: "3", terms: ["x", "−2"] });
    expect(distributionOf("5(2x + 1)")).toEqual({ factor: "5", terms: ["2x", "1"] });
    expect(distributionOf("−2(x − 3)")).toEqual({ factor: "−2", terms: ["x", "−3"] });
  });

  it("gives a minus in front of the product to the number: − 2(x + 4) multiplies by −2", () => {
    expect(distributionOf("− 2(x + 4)")).toEqual({ factor: "−2", terms: ["x", "4"] });
    expect(distributionOf("-2(x + 4)")).toEqual({ factor: "−2", terms: ["x", "4"] });
  });

  it("has no arrows for anything that is not a number times a bracket", () => {
    for (const part of ["(x + 1)/2", "x/2 + x/3", "3x + 6 − 4", "(x + 1)", "2(3(x + 1))", ""]) expect(distributionOf(part), part).toBeNull();
  });

  it("draws one arrow to each term inside the bracket", () => {
    const { container } = render(<DistributeArrows part="3(x − 2)" />);
    expect(container.querySelectorAll("[data-arc]")).toHaveLength(2);
    expect([...container.querySelectorAll("text")].map((text) => text.textContent)).toEqual(["3", "(", "x", "− 2", ")"]);
    const plus = render(<DistributeArrows part="2(x + 3)" />);
    expect([...plus.container.querySelectorAll("text")].map((text) => text.textContent)).toEqual(["2", "(", "x", "+ 3", ")"]);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws nothing for a division", () => {
    const { container } = render(<DistributeArrows part="(x + 1)/2" />);
    expect(container.querySelector("svg")).toBeNull();
  });
});
