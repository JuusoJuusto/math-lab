import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { readWritten } from "@/lib/equations";
import { MathPad, appendToPart, fractionText, removeFromPart } from "../MathPad";

function Harness({ initial = "", bar = false, disabled = false }: { initial?: string; bar?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="line">Line</label>
      <MathPad inputId="line" value={value} onChange={setValue} disabled={disabled} bar={bar ? { name: "two bars" } : undefined} />
    </>
  );
}

function setup(props: Parameters<typeof Harness>[0] = {}, lang: "en" | "fi" = "en") {
  const user = userEvent.setup();
  render(
    <LangProvider lang={lang}>
      <Harness {...props} />
    </LangProvider>,
  );
  return { user };
}

const field = () => screen.getByLabelText("Line") as HTMLInputElement;
const key = (name: string) => screen.getByRole("button", { name });
const fractionKey = () => screen.getByRole("button", { name: /^(Fraction|Murtoluku): / });
const builder = () => screen.queryByRole("group", { name: /^(Fraction|Murtoluku)$/ });
const topSlot = () => screen.getByRole("button", { name: /^(Top of the fraction|Murtoluvun osoittaja)/ });
const bottomSlot = () => screen.getByRole("button", { name: /^(Bottom of the fraction|Murtoluvun nimittäjä)/ });

describe("the parts of a fraction", () => {
  it("makes x/3 for a single term and brackets for anything longer", () => {
    expect(fractionText("x", "3")).toBe("x/3");
    expect(fractionText(" 2x ", " 5 ")).toBe("2x/5");
    expect(fractionText("−3", "4")).toBe("−3/4");
    expect(fractionText("x + 2", "3")).toBe("(x + 2)/3");
    expect(fractionText("x", "2 + 1")).toBe("x/(2 + 1)");
  });

  it("makes lines the engine can read", () => {
    for (const [top, bottom] of [["x", "3"], ["x + 2", "3"], ["2x", "5"], ["−3", "4"]]) {
      const read = readWritten(`${fractionText(top, bottom)} = 4`);
      expect(read.ok, `${top} over ${bottom}`).toBe(true);
    }
  });

  it("adds keys to a part: a sign at the start is a minus sign, and a lonely operation is left out", () => {
    expect(appendToPart("", "7")).toBe("7");
    expect(appendToPart("", " − ")).toBe("−");
    expect(appendToPart("", " + ")).toBe("");
    expect(appendToPart("x", " + ")).toBe("x + ");
    expect(appendToPart("x + ", "2")).toBe("x + 2");
    expect(appendToPart("(", " − ")).toBe("(−");
    expect(appendToPart("2", ",")).toBe("2,");
  });

  it("takes the last key out, with its spaces when it is a sign", () => {
    expect(removeFromPart("x + 2")).toBe("x + ");
    expect(removeFromPart("x + ")).toBe("x");
    expect(removeFromPart("12")).toBe("1");
    expect(removeFromPart("")).toBe("");
  });
});

describe("the number keys", () => {
  it("has every digit, x, the signs, brackets and the equals sign", () => {
    setup();
    for (const name of ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "x", "plus", "minus", "times", "divided by", "open bracket", "close bracket", "equals", "decimal point"]) {
      expect(key(name), name).toBeTruthy();
    }
  });

  it("writes what is pressed, at the caret, and a delete key takes the last character away", async () => {
    const { user } = setup();
    for (const name of ["2", "x", "plus", "5", "equals", "1", "7"]) await user.click(key(name));
    expect(field().value).toBe("2x + 5 = 17");

    await user.click(key("Delete the last character"));
    expect(field().value).toBe("2x + 5 = 1");

    // In the middle of the line: the caret is where the learner left it.
    field().focus();
    field().setSelectionRange(2, 2);
    await user.click(key("8"));
    expect(field().value).toBe("2x8 + 5 = 1");
  });

  it("clears the whole line", async () => {
    const { user } = setup({ initial: "2x + 5 = 17" });
    await user.click(key("Clear the whole line"));
    expect(field().value).toBe("");
    expect((key("Clear the whole line") as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not take the focus, so a phone's own keyboard stays down", async () => {
    const { user } = setup();
    await user.click(key("4"));
    expect(field().value).toBe("4");
    expect(document.activeElement).toBe(document.body);
  });

  it("keeps the focus in the line when the learner was typing there", async () => {
    const { user } = setup();
    field().focus();
    await user.click(key("4"));
    expect(document.activeElement).toBe(field());
  });

  it("has the two bars only where a step is written beside a line", async () => {
    const { user } = setup({ bar: true });
    await user.click(key("2"));
    await user.click(key("two bars"));
    expect(field().value).toBe("2 || ");
    document.body.innerHTML = "";
    setup();
    expect(screen.queryByRole("button", { name: "two bars" })).toBeNull();
  });

  it("is a decimal comma in Finnish", async () => {
    const { user } = setup({}, "fi");
    await user.click(key("3"));
    await user.click(screen.getByRole("button", { name: "desimaalipilkku" }));
    await user.click(key("5"));
    expect(field().value).toBe("3,5");
  });

  it("shows the field and no keys when it is locked", () => {
    setup({ initial: "x = 4", disabled: true });
    expect(field().disabled).toBe(true);
    expect(screen.queryByRole("group", { name: "Symbols" })).toBeNull();
  });
});

describe("a fraction, with the numbers pressed", () => {
  it("is x over 3: press the fraction key, fill the top, tap the bottom, fill it, put it in the line", async () => {
    const { user } = setup();
    expect(builder()).toBeNull();
    await user.click(fractionKey());
    expect(builder()).toBeTruthy();

    // The top is ready for the first key.
    await user.click(key("x"));
    expect(topSlot().textContent).toBe("x");
    await user.click(bottomSlot());
    await user.click(key("3"));
    expect(bottomSlot().textContent).toBe("3");
    expect(field().value).toBe("");

    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(builder()).toBeNull();
    expect(field().value).toBe("x/3");

    // And the line goes on.
    await user.click(key("plus"));
    await user.click(key("2"));
    await user.click(key("equals"));
    await user.click(key("5"));
    expect(field().value).toBe("x/3 + 2 = 5");
  });

  it("puts brackets round a top that is more than one term", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    await user.click(key("x"));
    await user.click(key("plus"));
    await user.click(key("2"));
    expect(topSlot().textContent).toBe("x + 2");
    await user.click(bottomSlot());
    await user.click(key("3"));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(field().value).toBe("(x + 2)/3");
  });

  it("takes a negative number in a part", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    await user.click(key("minus"));
    await user.click(key("3"));
    await user.click(bottomSlot());
    await user.click(key("4"));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(field().value).toBe("−3/4");
  });

  it("cannot be put in the line until both parts are filled", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    const put = () => screen.getByRole("button", { name: "Put in the line" }) as HTMLButtonElement;
    expect(put().disabled).toBe(true);
    await user.click(key("x"));
    expect(put().disabled).toBe(true);
    await user.click(bottomSlot());
    await user.click(key("3"));
    expect(put().disabled).toBe(false);
  });

  it("can be cancelled, and the line is left as it was", async () => {
    const { user } = setup({ initial: "x = 4" });
    await user.click(fractionKey());
    await user.click(key("7"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(builder()).toBeNull();
    expect(field().value).toBe("x = 4");
  });

  it("uses the part of the line that was picked out as the top", async () => {
    const { user } = setup({ initial: "2x + 5 = 17" });
    field().focus();
    field().setSelectionRange(1, 2);
    await user.click(fractionKey());
    expect(topSlot().textContent).toBe("x");
    await user.click(key("3"));
    expect(bottomSlot().textContent).toBe("3");
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(field().value).toBe("2x/3 + 5 = 17");
  });

  it("goes where the caret was, in the middle of a line", async () => {
    const { user } = setup({ initial: "x +  = 4" });
    field().focus();
    field().setSelectionRange(4, 4);
    await user.click(fractionKey());
    await user.click(key("1"));
    await user.click(bottomSlot());
    await user.click(key("2"));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    expect(field().value).toBe("x + 1/2 = 4");
  });

  it("deletes inside the part being written, and steps back from an empty bottom to the top", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    await user.click(key("1"));
    await user.click(key("2"));
    await user.click(key("Delete the last character"));
    expect(topSlot().textContent).toBe("1");
    await user.click(bottomSlot());
    await user.click(key("Delete the last character"));
    expect(topSlot().getAttribute("aria-pressed")).toBe("true");
    expect(field().value).toBe("");
  });

  it("keeps the equals sign and the second fraction out of the way while a fraction is open", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    expect((key("equals") as HTMLButtonElement).disabled).toBe(true);
    expect(fractionKey().hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect((key("equals") as HTMLButtonElement).disabled).toBe(false);
  });

  it("can be written with a hardware keyboard too: keys fill the part, Enter puts it in, Escape cancels", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    // The top part has the focus when the fraction opens.
    expect(document.activeElement).toBe(topSlot());
    await user.keyboard("2x");
    await user.click(bottomSlot());
    await user.keyboard("5");
    await user.keyboard("{Enter}");
    expect(field().value).toBe("2x/5");

    await user.click(fractionKey());
    await user.keyboard("9");
    await user.keyboard("{Escape}");
    expect(builder()).toBeNull();
    expect(field().value).toBe("2x/5");
  });

  it("names its parts for a screen reader, with what is in them", async () => {
    const { user } = setup();
    await user.click(fractionKey());
    expect(topSlot().getAttribute("aria-label")).toBe("Top of the fraction: tap, then press");
    await user.click(key("x"));
    expect(topSlot().getAttribute("aria-label")).toBe("Top of the fraction: x");
    expect(within(builder()!).getByText(/Tap the top or the bottom/)).toBeTruthy();
  });

  it("speaks Finnish", async () => {
    const { user } = setup({}, "fi");
    await user.click(fractionKey());
    expect(screen.getByRole("button", { name: "Vie riville" })).toBeTruthy();
    await user.click(key("x"));
    await user.click(bottomSlot());
    await user.click(key("3"));
    await user.click(screen.getByRole("button", { name: "Vie riville" }));
    expect(field().value).toBe("x/3");
  });
});

describe("the picture of the line", () => {
  const preview = () => document.querySelector(".pad-preview")!;

  it("is there from the start with a hint, so that the keys do not move when the first key is pressed", async () => {
    const { user } = setup();
    expect(preview().textContent).toContain("Write a line and it shows here");
    await user.click(key("x"));
    expect(preview()).toBe(document.querySelector(".pad-preview"));
    expect(preview().textContent).not.toContain("Write a line and it shows here");
  });

  it("draws a fraction as a fraction, as soon as it is in the line", async () => {
    const { user } = setup();
    expect(preview().querySelector(".eq-frac")).toBeNull();
    await user.click(fractionKey());
    await user.click(key("x"));
    await user.click(bottomSlot());
    await user.click(key("3"));
    await user.click(screen.getByRole("button", { name: "Put in the line" }));
    const fraction = preview().querySelector(".eq-frac")!;
    expect(fraction.querySelector(".eq-frac-top")!.textContent).toBe("x");
    expect(fraction.querySelector(".eq-frac-bottom")!.textContent).toBe("3");
  });

  it("shows the step written beside a line, and the typed minus sign as a minus sign", () => {
    setup({ initial: "x/2 = 10 - 9 || - 9" });
    expect(preview().textContent).toContain("10 − 9");
    expect(preview().querySelector(".pad-preview-note")!.textContent).toBe("|| − 9");
  });

  it("is never read out, because the field itself is", () => {
    setup({ initial: "x/2 = 5" });
    expect(preview().getAttribute("aria-hidden")).toBe("true");
  });

  it("copes with a line that is not finished", () => {
    setup({ initial: "x/ + (2x = " });
    expect(preview().textContent).toContain("x/");
  });
});

describe("a typed line is still just text", () => {
  it("follows a hardware keyboard", () => {
    setup();
    fireEvent.change(field(), { target: { value: "x/2 = 5" } });
    expect(field().value).toBe("x/2 = 5");
  });
});
