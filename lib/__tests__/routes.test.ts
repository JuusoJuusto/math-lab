import { describe, expect, it } from "vitest";
import { topics } from "@/content/topics";
import { MODES } from "@/lib/tasks";
import { HOME, parseHash, sectionOf, toHash, type Route } from "../routes";

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
