import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearLang, LANG_KEY, setLang } from "@/hooks/useLang";
import { buildSession, generateTask } from "@/lib/tasks";
import { App } from "../App";

function open(hash = "") {
  window.location.hash = hash;
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, view };
}

const switchTo = (name: string) => screen.getByRole("button", { name });

beforeEach(() => {
  clearLang();
});

afterEach(() => {
  vi.restoreAllMocks();
  clearLang();
  document.documentElement.lang = "";
});

describe("choosing the language", () => {
  it("starts in English when the browser speaks English, and says so to screen readers", () => {
    open("");
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(switchTo("English (EN)").getAttribute("aria-pressed")).toBe("true");
    expect(switchTo("Suomi (FI)").getAttribute("aria-pressed")).toBe("false");
  });

  it("starts in Finnish when the browser speaks Finnish", () => {
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("fi-FI");
    open("");
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("fi");
  });

  it("switches the whole screen at once, the page title and the language of the page", async () => {
    const { user } = open("");
    await user.click(switchTo("Suomi (FI)"));

    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Aloita oppiminen/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Harjoittele" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Opi yhtälöitä" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("fi");
    expect(switchTo("Suomi (FI)").getAttribute("aria-pressed")).toBe("true");
    // The cards on the home screen are Finnish too: topics and ways to practise.
    expect(screen.getByText("Yhden askeleen yhtälöt")).toBeTruthy();
    expect(screen.getByText("Päivän haaste")).toBeTruthy();
    expect(screen.queryByText("One-step equations")).toBeNull();

    await user.click(switchTo("English (EN)"));
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
  });

  it("remembers the choice for the next visit", async () => {
    const first = open("");
    await first.user.click(switchTo("Suomi (FI)"));
    expect(window.localStorage.getItem(LANG_KEY)).toBe("fi");
    first.view.unmount();

    open("");
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
  });

  it("follows a change made in another tab", () => {
    open("");
    act(() => {
      window.localStorage.setItem(LANG_KEY, "fi");
      window.dispatchEvent(new StorageEvent("storage", { key: LANG_KEY, newValue: "fi" }));
    });
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
  });

  it("ignores a stored value that is not a language", () => {
    window.localStorage.setItem(LANG_KEY, "klingon");
    open("");
    expect(document.documentElement.lang).toBe("en");
  });

  it("keeps working when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    const { user } = open("");
    await user.click(switchTo("Suomi (FI)"));
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
  });
});

describe("the app in Finnish", () => {
  it("shows the lesson in Finnish, with the flip shortcut", () => {
    setLang("fi");
    open("#/learn/two-step");
    expect(screen.getByRole("heading", { level: 1, name: "Kahden askeleen yhtälöt" })).toBeTruthy();
    expect(screen.getByText(/Lausekkeessa 2x \+ 5 x kerrotaan ensin kahdella/)).toBeTruthy();
    expect(screen.getByText(/Siirtämällä: 2x \+ 5 = 17 muuttuu muotoon 2x = 17 − 5/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ratkaise askel askeleelta/ })).toBeTruthy();
    expect(document.title).toBe("Oppitunti | MathLab");
  });

  it("explains a worked example step by step in Finnish", async () => {
    setLang("fi");
    const { user } = open("#/solve/two-step");
    expect(screen.getByRole("heading", { level: 1, name: "Kahden askeleen yhtälöt" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Katso esimerkkiratkaisu/ }));
    await user.click(screen.getByRole("button", { name: "Näytä ensimmäinen askel" }));

    expect(screen.getByText("Askel 1: Vähennä molemmilta puolilta 5")).toBeTruthy();
    const spoken = document.querySelector(".eq > .sr-only")?.textContent;
    expect(spoken).toBe("Esimerkkiratkaisu: 2x plus 5 miinus 5 on yhtä suuri kuin 17 miinus 5");
    expect(document.querySelector(".notice")?.textContent).toContain("Termi + 5 on yhteenlasku. Vähennyslasku kumoaa yhteenlaskun");
    // The notebook line uses Finnish division and multiplication signs.
    await user.click(screen.getByRole("button", { name: "Sievennä molemmat puolet" }));
    await user.click(screen.getByRole("button", { name: "Näytä seuraava askel" }));
    expect(screen.getByText("Askel 2: Jaa molemmat puolet luvulla 2")).toBeTruthy();
    expect(document.querySelector(".eq-bar")?.textContent).toBe("| : 2");
  });

  it("lets the learner flip a term in Finnish", async () => {
    setLang("fi");
    const { user } = open("#/solve/one-step");
    await user.click(screen.getByRole("button", { name: /Siirry harjoitteluun/ }));
    expect(screen.getByRole("radio", { name: /Siirrä termi/ })).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: /Siirrä termi/ }));

    // The first term button on screen belongs to the equation of this round.
    const button = document.querySelector<HTMLButtonElement>(".eq-flip")!;
    expect(button.getAttribute("aria-label")).toMatch(/^Siirrä .*\. (Siitä tulee|Se siirtyy)/);
    await user.click(button);
    expect(document.querySelector(".notice-success, .notice-warning")).toBeTruthy();
  });

  it("practises in Finnish: prompts, answers, explanations and results", async () => {
    setLang("fi");
    const [spec] = buildSession({ mode: "solve", topic: "one-step", count: 5, seed: 3 });
    const task = generateTask(spec, "fi");
    const { user } = open("#/practice/solve?topic=one-step&n=5&seed=3");

    expect(screen.getByText("Ratkaise yhtälö. Kirjoita x:n arvo.")).toBeTruthy();
    expect(document.querySelector(".tag-kind")?.textContent).toContain("Ratkaise");
    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value: "ei luku" } });
    fireEvent.click(screen.getByRole("button", { name: "Tarkista" }));
    expect(screen.getByRole("alert").textContent).toMatch(/Kirjoita pelkkä luku/);

    fireEvent.change(document.querySelector(".answer-field input")!, { target: { value: String(task.answerValue!.n + 1) } });
    fireEvent.click(screen.getByRole("button", { name: "Tarkista" }));
    expect(screen.getByText("Ei ihan.")).toBeTruthy();
    expect(screen.getByText(/Tarkistus: kun x = /)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Seuraava/ }));
    expect(screen.getByText("Tehtävä 2 / 5")).toBeTruthy();
  });

  it("switches a practice task to the other language without changing the task", async () => {
    const { user } = open("#/practice/solve?topic=two-step&n=5&seed=11");
    // The drawn equation (not the hidden spoken version, which is in the page language).
    const drawn = () => document.querySelector(".task-equation .mathline-row")?.textContent;
    const english = drawn();
    expect(screen.getByText("Solve the equation. Type the value of x.")).toBeTruthy();

    await user.click(switchTo("Suomi (FI)"));
    expect(screen.getByText("Ratkaise yhtälö. Kirjoita x:n arvo.")).toBeTruthy();
    expect(drawn()).toBe(english);
    expect(document.querySelector(".task-equation .sr-only")?.textContent).toMatch(/on yhtä suuri kuin/);
    expect(screen.getByText("Tehtävä 1 / 5")).toBeTruthy();
  });

  it("shows the progress screen in Finnish", () => {
    setLang("fi");
    open("#/progress");
    expect(screen.getByRole("heading", { level: 1, name: "Edistyminen" })).toBeTruthy();
    expect(screen.getByText("Vastatut tehtävät")).toBeTruthy();
    const types = within(screen.getByRole("region", { name: "Tehtävätyypeittäin" }));
    expect(types.getByText("Etsi virhe")).toBeTruthy();
  });

  it("lets the learner solve a word problem in Finnish", async () => {
    setLang("fi");
    const { user } = open("#/solve/word");
    expect(screen.getByRole("heading", { level: 1, name: "Sanalliset tehtävät" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Siirry harjoitteluun/ }));
    expect(screen.getByText("Tehtävä 1/5")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Kirjoita yhtälö" })).toBeTruthy();
    expect(screen.getByLabelText("Vasen puoli, luku x:n edessä")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Vasen puoli, luku x:n edessä"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Oikea puoli, pelkkä luku"), { target: { value: "99" } });
    await user.click(screen.getByRole("button", { name: "Tarkista yhtälöni" }));
    expect(document.querySelector(".notice")?.textContent).toMatch(/Siinä x on jo yksin|Se ei vielä vastaa tarinaa|Tarkista/);
  });

  it("has a Finnish not-found fallback for unknown topics", () => {
    setLang("fi");
    open("#/learn/not-a-topic");
    expect(screen.getByRole("heading", { level: 1, name: "Opi" })).toBeTruthy();
  });
});
