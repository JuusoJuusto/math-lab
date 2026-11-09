import { describe, expect, it } from "vitest";
import { crossedMilestones, percentDone } from "../studyHubMilestones";

describe("percentDone", () => {
  it("is the share finished, as a percentage that never passes 100", () => {
    expect(percentDone(0, 5)).toBe(0);
    expect(percentDone(2, 5)).toBe(40);
    expect(percentDone(5, 5)).toBe(100);
    expect(percentDone(9, 5)).toBe(100);
  });

  it("is 0 when there is nothing to do", () => {
    expect(percentDone(0, 0)).toBe(0);
    expect(percentDone(3, -1)).toBe(0);
  });
});

describe("crossedMilestones", () => {
  it("names each of 25, 50 and 75 once, on the step that passes it", () => {
    const steps = [0, 1, 2, 3, 4, 5].map((done) => percentDone(done, 5));
    const marks = steps.slice(1).map((after, i) => crossedMilestones(steps[i], after));
    expect(marks).toEqual([[], [25], [50], [75], []]);
  });

  it("gives a long session more than one mark in a step, and each mark only once", () => {
    expect(crossedMilestones(0, 80)).toEqual([25, 50, 75]);
    expect(crossedMilestones(25, 50)).toEqual([50]);
    expect(crossedMilestones(50, 50)).toEqual([]);
  });

  it("never reports 0 or 100, which are the start and the finish", () => {
    expect(crossedMilestones(0, 100)).toEqual([25, 50, 75]);
  });
});
