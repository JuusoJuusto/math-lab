import { describe, expect, it } from "vitest";
import { topics } from "@/content/topics";
import { MODES } from "@/lib/tasks";
import { LANGS } from "../lang";
import { HOME, parseAddress, parseHash, parseLocation, sectionOf, staticSegments, toHash, toPath, type Route } from "../routes";

describe("routes", () => {
  const routes: Route[] = [
    { name: "home" },
    { name: "learn" },
    { name: "lesson", topic: "two-step" },
    { name: "solver", level: "both" },
    { name: "practice" },
    { name: "practice", mode: "time" },
    { name: "session", mode: "exam", topic: "all", count: 20, seed: 1234 },
    { name: "session", mode: "mistake", topic: "two-step", count: 8, seed: 7 },
    { name: "progress" },
  ];

  it.each(routes.map((route) => [toHash(route), route] as const))("round-trips %s", (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });

  it("round-trips every topic and every mode", () => {
    for (const topic of topics) {
      expect(parseHash(toHash({ name: "lesson", topic: topic.id }))).toEqual({ name: "lesson", topic: topic.id });
      expect(parseHash(toHash({ name: "solver", level: topic.id }))).toEqual({ name: "solver", level: topic.id });
    }
    for (const mode of MODES) {
      const route: Route = { name: "session", mode: mode.id, topic: "all", count: mode.defaultCount, seed: 9 };
      expect(parseHash(toHash(route))).toEqual(route);
    }
  });

  it("falls back to sensible screens for anything unknown", () => {
    expect(parseHash("")).toEqual(HOME);
    expect(parseHash("#")).toEqual(HOME);
    expect(parseHash("#/nonsense")).toEqual(HOME);
    expect(parseHash("#/learn/unknown-topic")).toEqual({ name: "learn" });
    expect(parseHash("#/solve/unknown")).toEqual({ name: "learn" });
    expect(parseHash("#/practice/unknown-mode")).toEqual({ name: "practice" });
    expect(parseHash("#/practice?mode=unknown")).toEqual({ name: "practice" });
  });

  it("cleans up a damaged practice address instead of failing", () => {
    expect(parseHash("#/practice/quiz?topic=nope&n=abc&seed=-4")).toEqual({
      name: "session",
      mode: "quiz",
      topic: "all",
      count: 10,
      seed: 1,
    });
    expect(parseHash("#/practice/quiz?n=9999")).toMatchObject({ count: 50 });
    expect(parseHash("#/practice/quiz?n=0")).toMatchObject({ count: 1 });
  });

  it("accepts addresses without the leading slash", () => {
    expect(parseHash("#progress")).toEqual({ name: "progress" });
  });

  it("maps every screen to a navigation item", () => {
    expect(routes.map(sectionOf)).toEqual(["home", "learn", "learn", "learn", "practice", "practice", "practice", "practice", "progress"]);
  });
});

describe("page addresses (/fi/..., /en/...)", () => {
  const routes: Route[] = [
    { name: "home" },
    { name: "learn" },
    { name: "lesson", topic: "two-step" },
    { name: "solver", level: "word" },
    { name: "practice" },
    { name: "practice", mode: "time" },
    { name: "session", mode: "exam", topic: "all", count: 20, seed: 1234 },
    { name: "progress" },
  ];

  it.each(routes.flatMap((route) => LANGS.map((lang) => [toPath(route, lang), lang, route] as const)))(
    "round-trips %s",
    (path, lang, route) => {
      expect(parseLocation(path)).toEqual({ lang, route });
    },
  );

  it("writes pages as the static export names them, with a trailing slash", () => {
    expect(toPath({ name: "home" }, "fi")).toBe("/fi/");
    expect(toPath({ name: "lesson", topic: "both" }, "en")).toBe("/en/learn/both/");
    expect(toPath({ name: "practice", mode: "time" }, "fi")).toBe("/fi/practice/?mode=time");
    expect(toPath({ name: "session", mode: "quiz", topic: "all", count: 5, seed: 9 }, "en")).toBe("/en/practice/quiz/?topic=all&n=5&seed=9");
  });

  it("reads the language from the first segment and rejects anything else", () => {
    expect(parseLocation("/fi/progress/")).toEqual({ lang: "fi", route: { name: "progress" } });
    expect(parseLocation("/de/progress/").lang).toBeNull();
    expect(parseLocation("/").lang).toBeNull();
    expect(parseLocation("/fi/nonsense/")).toEqual({ lang: "fi", route: HOME });
  });

  it("upgrades a legacy hash address to the same screen", () => {
    expect(parseHash("#/learn/two-step")).toEqual({ name: "lesson", topic: "two-step" });
    expect(toPath(parseHash("#/practice/exam?topic=both&n=20&seed=5"), "fi")).toBe("/fi/practice/exam/?topic=both&n=20&seed=5");
  });

  it("lists exactly the pages that are built, and every one of them is a screen", () => {
    const segments = staticSegments();
    const keys = segments.map((path) => path.join("/"));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("");
    expect(keys).toContain("solve/word");
    expect(keys).toContain("practice/exam");
    for (const path of segments) {
      const route = parseAddress(path.join("/"));
      if (path.length > 0) expect(route.name, path.join("/")).not.toBe("home");
    }
  });
});
