import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PROGRESS, addXp, recordSolverLevel } from "@/lib/progress";
import { reportProgress } from "../studyHubProgress";
import { reportSnapshotOnce } from "../studyHubSnapshot";

vi.mock("../studyHubProgress", () => ({ reportProgress: vi.fn(), initStudyHub: vi.fn() }));
const report = vi.mocked(reportProgress);

const earned = addXp(recordSolverLevel(EMPTY_PROGRESS, "one-step"), 250);

beforeEach(() => {
  report.mockClear();
  window.sessionStorage.clear();
});

describe("the report of what a student already has", () => {
  it("is sent for a visit from Study Hub, once", () => {
    window.sessionStorage.setItem("studyhub_token", "TKN");
    expect(reportSnapshotOnce(earned, "en")).toBe(true);
    const kinds = report.mock.calls.map(([kind, details]) => `${kind}:${details?.ref}`);
    expect(kinds).toEqual(["completed:lesson-one-step", "completed:chapter-solving", "progress:overall", "level:xp-level"]);

    // The next page of the same visit does not tell it again.
    report.mockClear();
    expect(reportSnapshotOnce(earned, "en")).toBe(false);
    expect(report).not.toHaveBeenCalled();
  });

  it("is not sent for a visit that did not come from Study Hub", () => {
    expect(reportSnapshotOnce(earned, "en")).toBe(false);
    expect(report).not.toHaveBeenCalled();
    // And that does not use up the one time: a later visit from Study Hub in the same tab still gets it.
    window.sessionStorage.setItem("studyhub_token", "TKN");
    expect(reportSnapshotOnce(earned, "en")).toBe(true);
  });

  it("sends nothing when the student has no progress yet, and does not fail", () => {
    window.sessionStorage.setItem("studyhub_token", "TKN");
    expect(() => reportSnapshotOnce(EMPTY_PROGRESS, "en")).not.toThrow();
    expect(report).not.toHaveBeenCalled();
  });

  it("never throws when the browser will not let it read its storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(reportSnapshotOnce(earned, "en")).toBe(false);
    vi.restoreAllMocks();
  });
});
