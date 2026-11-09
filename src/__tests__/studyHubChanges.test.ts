import { describe, expect, it } from "vitest";
import { EMPTY_PROGRESS, XP_PER_LEVEL, addXp, recordSolverLevel, type Progress } from "@/lib/progress";
import { progressEvents, snapshotEvents } from "../studyHubChanges";

const refs = (reports: ReturnType<typeof progressEvents>) => reports.map((report) => `${report.kind}:${report.details.ref}`);

/** A topic that counts as known because it was practised: enough answers, most of them right. */
const practised = (progress: Progress, topic: string): Progress => ({ ...progress, byTopic: { ...progress.byTopic, [topic]: { attempts: 6, correct: 6 } } });

describe("what Study Hub is told when progress changes", () => {
  it("is nothing when nothing changed", () => {
    expect(progressEvents(EMPTY_PROGRESS, EMPTY_PROGRESS, "en")).toEqual([]);
    const after = recordSolverLevel(EMPTY_PROGRESS, "one-step");
    expect(progressEvents(after, after, "en")).toEqual([]);
  });

  it("says a lesson is completed, with its name and a stable id, the first time it is finished", () => {
    const reports = progressEvents(EMPTY_PROGRESS, recordSolverLevel(EMPTY_PROGRESS, "one-step"), "en");
    expect(reports[0]).toEqual({ kind: "completed", details: { label: "One-step equations", ref: "lesson-one-step" } });
  });

  it("says the chapter is completed when its last lesson is, and not before", () => {
    // "Solving an equation" has one lesson; "Practising solving" has two.
    expect(refs(progressEvents(EMPTY_PROGRESS, recordSolverLevel(EMPTY_PROGRESS, "one-step"), "en"))).toContain("completed:chapter-solving");

    const half = recordSolverLevel(EMPTY_PROGRESS, "two-step");
    expect(refs(progressEvents(EMPTY_PROGRESS, half, "en"))).not.toContain("completed:chapter-practising");
    expect(refs(progressEvents(half, recordSolverLevel(half, "both"), "en"))).toContain("completed:chapter-practising");
  });

  it("does not say it again for a lesson that was already finished", () => {
    const done = recordSolverLevel(EMPTY_PROGRESS, "one-step");
    expect(progressEvents(done, recordSolverLevel(done, "one-step"), "en")).toEqual([]);
    expect(refs(progressEvents(done, recordSolverLevel(done, "two-step"), "en"))).not.toContain("completed:lesson-one-step");
  });

  it("says a topic is completed when it is practised until it counts as known, not only when a lesson round is", () => {
    const reports = progressEvents(EMPTY_PROGRESS, practised(EMPTY_PROGRESS, "one-step"), "en");
    expect(refs(reports)).toEqual(["completed:lesson-one-step", "completed:chapter-solving", "progress:overall"]);
  });

  it("does not say it twice when a lesson round finishes a topic that was already known from practice", () => {
    const known = practised(EMPTY_PROGRESS, "one-step");
    expect(progressEvents(known, recordSolverLevel(known, "one-step"), "en")).toEqual([]);
  });

  it("gives the overall progress as a percentage, when it goes up", () => {
    const one = progressEvents(EMPTY_PROGRESS, recordSolverLevel(EMPTY_PROGRESS, "one-step"), "en").find((report) => report.details.ref === "overall");
    expect(one).toEqual({ kind: "progress", details: { label: "Overall progress", ref: "overall", value: 9 } });
    const everything = ["basics", "one-step", "two-step", "both", "brackets", "fractions", "special", "proportion", "word", "hard-word", "challenge"].reduce(
      recordSolverLevel,
      EMPTY_PROGRESS,
    );
    expect(snapshotEvents(everything, "en").find((report) => report.details.ref === "overall")?.details.value).toBe(100);
  });

  it("says a new level has been reached, once per level", () => {
    const almost = addXp(EMPTY_PROGRESS, XP_PER_LEVEL - 5);
    expect(progressEvents(EMPTY_PROGRESS, almost, "en")).toEqual([]);
    expect(progressEvents(almost, addXp(almost, 5), "en")).toEqual([{ kind: "level", details: { label: "Level 2", ref: "xp-level", value: 2 } }]);
    const level2 = addXp(EMPTY_PROGRESS, XP_PER_LEVEL);
    expect(progressEvents(level2, addXp(level2, 10), "en")).toEqual([]);
  });

  it("says nothing when progress is taken back to nothing", () => {
    const much = addXp(recordSolverLevel(EMPTY_PROGRESS, "one-step"), 500);
    expect(progressEvents(much, EMPTY_PROGRESS, "en")).toEqual([]);
  });

  it("uses the names of the language the student is using, and the same ids", () => {
    const en = progressEvents(EMPTY_PROGRESS, recordSolverLevel(EMPTY_PROGRESS, "one-step"), "en");
    const fi = progressEvents(EMPTY_PROGRESS, recordSolverLevel(EMPTY_PROGRESS, "one-step"), "fi");
    expect(fi.map((report) => report.details.ref)).toEqual(en.map((report) => report.details.ref));
    expect(fi[0].details.label).toBe("Yhden askeleen yhtälöt");
    expect(fi.find((report) => report.details.ref === "overall")?.details.label).toBe("Kokonaisedistyminen");
  });

  it("sends only fixed names and numbers, short enough, and nothing a student typed", () => {
    const all = snapshotEvents(addXp(practised(recordSolverLevel(EMPTY_PROGRESS, "word"), "both"), 900), "fi");
    expect(all.length).toBeGreaterThan(3);
    for (const { details } of all) {
      expect(String(details.label).length).toBeLessThanOrEqual(80);
      expect(String(details.ref)).toMatch(/^[a-z0-9-]+$/);
      expect(Object.keys(details).every((key) => ["label", "ref", "value", "max"].includes(key))).toBe(true);
    }
  });
});

describe("what a student who arrives with progress has already earned", () => {
  it("is nothing for a student with no progress", () => {
    expect(snapshotEvents(EMPTY_PROGRESS, "en")).toEqual([]);
  });

  it("is every finished topic and chapter, how far along they are and their level, under the names they were earned with", () => {
    const earned = addXp(recordSolverLevel(recordSolverLevel(EMPTY_PROGRESS, "one-step"), "two-step"), XP_PER_LEVEL * 2);
    const reports = snapshotEvents(earned, "en");
    expect(refs(reports)).toEqual(["completed:lesson-one-step", "completed:lesson-two-step", "completed:chapter-solving", "progress:overall", "level:xp-level"]);
    expect(reports.at(-1)?.details.value).toBe(3);
  });

  it("is the same as earning it all at once, so it can never disagree with what is reported as it happens", () => {
    const earned = practised(recordSolverLevel(EMPTY_PROGRESS, "brackets"), "fractions");
    expect(snapshotEvents(earned, "fi")).toEqual(progressEvents(EMPTY_PROGRESS, earned, "fi"));
  });

  it("fits in what Study Hub accepts for a visit, even for a student who has finished everything", () => {
    const everything = addXp(
      ["basics", "one-step", "two-step", "both", "brackets", "fractions", "special", "proportion", "word", "hard-word", "challenge"].reduce(recordSolverLevel, EMPTY_PROGRESS),
      5000,
    );
    // 11 topics, the chapters, the overall number and the level: well under the 200 events a visit may send.
    expect(snapshotEvents(everything, "en").length).toBeLessThan(40);
  });
});
