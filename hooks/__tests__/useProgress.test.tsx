import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY_PROGRESS, STORAGE_KEY, recordAnswer, recordSolverLevel } from "@/lib/progress";
import { resetProgress, updateProgress, useProgress } from "../useProgress";

function Probe() {
  const progress = useProgress();
  return (
    <p data-testid="probe">
      {progress.attempts}/{progress.correct}/{progress.solverLevels.join(",")}
    </p>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  act(() => resetProgress());
});

describe("useProgress", () => {
  it("starts from stored progress", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: 4, correct: 3, solverLevels: ["one-step"] }));
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("4/3/one-step");
  });

  it("updates every component and the stored value when progress changes", () => {
    render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    act(() => updateProgress((old) => recordSolverLevel(recordAnswer(old, true), "two-step")));

    expect(screen.getAllByTestId("probe").map((node) => node.textContent)).toEqual(["1/1/two-step", "1/1/two-step"]);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ attempts: 1, correct: 1, solverLevels: ["two-step"] });
  });

  it("follows changes made in another tab", () => {
    render(<Probe />);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ attempts: 9, correct: 9 }));
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });
    expect(screen.getByTestId("probe").textContent).toBe("9/9/");
  });

  it("keeps working in memory when storage refuses to save (private browsing, full quota)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    render(<Probe />);
    act(() => updateProgress((old) => recordAnswer(old, true)));
    expect(screen.getByTestId("probe").textContent).toBe("1/1/");
  });

  it("copes with storage that cannot even be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    render(<Probe />);
    expect(screen.getByTestId("probe").textContent).toBe("0/0/");
  });

  it("resets to empty progress", () => {
    render(<Probe />);
    act(() => updateProgress((old) => recordAnswer(old, true)));
    act(() => resetProgress());
    expect(screen.getByTestId("probe").textContent).toBe("0/0/");
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)).toEqual(EMPTY_PROGRESS);
  });
});
