import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LANG_KEY, preferredLang } from "@/hooks/useLang";
import { buildSession, generateTask } from "@/lib/tasks";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { App } from "../App";

/** Opens the page at an address, as the browser would after a link or a refresh. */
function open(url = "/en/") {
  window.history.replaceState(null, "", url);
  const user = userEvent.setup();
  const view = render(<App />);
  return { user, view };
}

const switchTo = (name: string) => screen.getByRole("link", { name });

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.lang = "";
});

describe("the language is part of the address", () => {
  it("shows English at /en/ and says so to screen readers", () => {
    open("/en/");
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
    expect(switchTo("English (EN)").getAttribute("aria-current")).toBe("true");
    expect(switchTo("Suomi (FI)").getAttribute("aria-current")).toBeNull();
  });

  it("shows Finnish at /fi/, whatever the browser or the saved preference says", () => {
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("en-US");
    window.localStorage.setItem(LANG_KEY, "en");
    open("/fi/");
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("fi");
    expect(document.title).toBe("MathLab");
  });

  it("offers the same screen in the other language as a real link", () => {
    open("/en/learn/two-step/");
    expect(switchTo("Suomi (FI)").getAttribute("href")).toBe("/fi/learn/two-step/");
    expect(switchTo("Suomi (FI)").getAttribute("hreflang")).toBe("fi");
    expect(switchTo("English (EN)").getAttribute("href")).toBe("/en/learn/two-step/");
  });

  it("switches the whole screen at once, the address, the page title and the language of the page", async () => {
    const { user } = open("/en/");
    await user.click(switchTo("Suomi (FI)"));

    expect(window.location.pathname).toBe("/fi/");
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Aloita oppiminen/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Harjoittele" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Opi yhtälöitä" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("fi");
    expect(switchTo("Suomi (FI)").getAttribute("aria-current")).toBe("true");
    // The cards on the home screen are Finnish too: topics and ways to practise.
    expect(screen.getByText("Yhden askeleen yhtälöt")).toBeTruthy();
    expect(screen.getByText("Päivän haaste")).toBeTruthy();
    expect(screen.queryByText("One-step equations")).toBeNull();

    await user.click(switchTo("English (EN)"));
    expect(window.location.pathname).toBe("/en/");
    expect(screen.getByRole("heading", { level: 1, name: "Solve equations, step by step!" })).toBeTruthy();
    expect(document.documentElement.lang).toBe("en");
  });

  it("keeps the screen and the practice settings when the language changes", async () => {
    const { user } = open("/en/practice/solve/?topic=two-step&n=5&seed=11");
    await user.click(switchTo("Suomi (FI)"));
    expect(`${window.location.pathname}${window.location.search}`).toBe("/fi/practice/solve/?topic=two-step&n=5&seed=11");
  });

  it("remembers the choice as the preference for the bare address", async () => {
    const { user } = open("/en/");
    await user.click(switchTo("Suomi (FI)"));
    expect(window.localStorage.getItem(LANG_KEY)).toBe("fi");
    expect(preferredLang()).toBe("fi");
  });

  it("does not take over a modified click (new tab, new window)", () => {
    open("/en/");
    const link = switchTo("Suomi (FI)");
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(window.location.pathname).toBe("/en/");
  });

  it("lets the Back button return to the other language", async () => {
    const { user } = open("/en/learn/");
    await user.click(switchTo("Suomi (FI)"));
    expect(window.location.pathname).toBe("/fi/learn/");
    act(() => window.history.back());
    expect(await screen.findByRole("heading", { level: 1, name: "Learn" })).toBeTruthy();
    expect(window.location.pathname).toBe("/en/learn/");
  });

  it("carries a link from before the languages had addresses over to the new address", () => {
    window.history.replaceState(null, "", "/en/#/learn/two-step");
    render(<App />);
    expect(window.location.pathname).toBe("/en/learn/two-step/");
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("heading", { level: 1, name: "Two-step equations" })).toBeTruthy();
  });

  it("falls back to the language the page was built in when the address names none", () => {
    window.history.replaceState(null, "", "/xx/");
    render(<App lang="fi" />);
    expect(screen.getByRole("heading", { level: 1, name: "Ratkaise yhtälöitä askel askeleelta!" })).toBeTruthy();
  });
});

describe("the preference for the bare address", () => {
  it("uses the saved choice first, then the browser, then English", () => {
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("fi-FI");
    expect(preferredLang()).toBe("fi");
    window.localStorage.setItem(LANG_KEY, "en");
    expect(preferredLang()).toBe("en");
    window.localStorage.setItem(LANG_KEY, "klingon");
    expect(preferredLang()).toBe("fi");
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("sv-SE");
    expect(preferredLang()).toBe("en");
  });

  it("copes with blocked storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("fi");
    expect(preferredLang()).toBe("fi");
  });
});

describe("the redirect page at /", () => {
  const html = readFileSync(resolve(process.cwd(), "public/index.html"), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)![1];

  /** Runs the page's own script against a fake browser and returns where it sends the learner. */
  function redirect(options: { hash?: string; saved?: string | null; language?: string }) {
    let target = "";
    const window = {
      localStorage: { getItem: () => options.saved ?? null },
    };
    new Function("window", "navigator", "location", script)(
      window,
      { language: options.language ?? "en-US" },
      { hash: options.hash ?? "", replace: (url: string) => (target = url) },
    );
    return target;
  }

  it("sends a Finnish browser to /fi/ and anyone else to /en/", () => {
    expect(redirect({ language: "fi-FI" })).toBe("/fi/");
    expect(redirect({ language: "en-GB" })).toBe("/en/");
    expect(redirect({ language: "sv" })).toBe("/en/");
  });

  it("prefers the language the learner chose last", () => {
    expect(redirect({ language: "fi", saved: "en" })).toBe("/en/");
    expect(redirect({ language: "en", saved: "fi" })).toBe("/fi/");
    expect(redirect({ language: "fi", saved: "nonsense" })).toBe("/fi/");
  });

  it("carries old hash links over to the new addresses", () => {
    expect(redirect({ hash: "#/learn/two-step", saved: "fi" })).toBe("/fi/learn/two-step/");
    expect(redirect({ hash: "#/practice/exam?topic=both&n=20&seed=5", saved: "en" })).toBe("/en/practice/exam/?topic=both&n=20&seed=5");
    expect(redirect({ hash: "#/practice?mode=time", saved: "en" })).toBe("/en/practice/?mode=time");
    expect(redirect({ hash: "#/", saved: "en" })).toBe("/en/");
  });

  it("has a way in without JavaScript", () => {
    expect(html).toContain('<a href="/en/">English</a>');
    expect(html).toContain('<a href="/fi/">Suomi</a>');
    expect(html).toContain('url=/en/');
  });
});

describe("the app in Finnish", () => {
  it("shows the lesson in Finnish, with the flip shortcut", () => {
    open("/fi/learn/two-step/");
    expect(screen.getByRole("heading", { level: 1, name: "Kahden askeleen yhtälöt" })).toBeTruthy();
    expect(screen.getByText(/Lausekkeessa 2x \+ 5 x kerrotaan ensin kahdella/)).toBeTruthy();
    expect(screen.getByText(/Siirtämällä: 2x \+ 5 = 17 muuttuu muotoon 2x = 17 − 5/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Ratkaise askel askeleelta/ })).toBeTruthy();
    expect(document.title).toBe("Oppitunti | MathLab");
  });

  it("explains a worked example step by step in Finnish", async () => {
    const { user } = open("/fi/solve/two-step/");
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
    const { user } = open("/fi/solve/one-step/");
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
    const [spec] = buildSession({ mode: "solve", topic: "one-step", count: 5, seed: 3 });
    const task = generateTask(spec, "fi");
    const { user } = open("/fi/practice/solve/?topic=one-step&n=5&seed=3");

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
    const { user } = open("/en/practice/solve/?topic=two-step&n=5&seed=11");
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
    open("/fi/progress/");
    expect(screen.getByRole("heading", { level: 1, name: "Edistyminen" })).toBeTruthy();
    expect(screen.getByText("Vastatut tehtävät")).toBeTruthy();
    const types = within(screen.getByRole("region", { name: "Tehtävätyypeittäin" }));
    expect(types.getByText("Etsi virhe")).toBeTruthy();
  });

  it("lets the learner solve a word problem in Finnish", async () => {
    const { user } = open("/fi/solve/word/");
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
    open("/fi/learn/not-a-topic/");
    expect(screen.getByRole("heading", { level: 1, name: "Opi" })).toBeTruthy();
  });
});
