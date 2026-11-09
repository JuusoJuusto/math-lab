import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { topics } from "@/content/topics";
import { LangProvider } from "@/hooks/useLang";
import { getLevel, mustParseEquation, type Notice } from "@/lib/equations";
import { EquationDisplay } from "../EquationDisplay";
import { FeedbackPanel } from "../FeedbackPanel";
import { SolverView } from "../SolverView";

/*
 * Motion is CSS, so a test cannot watch it play. What can be tested is what it depends on: an animation plays when an
 * element is new, so a new message, a new equation and a new stage must each be a new element, and an unchanged one must not be.
 */

const good: Notice = { tone: "success", title: "Well done", body: [] };
const bad: Notice = { tone: "error", title: "Not that one", body: [] };

function panel(notice: Notice | null) {
  return (
    <LangProvider lang="en">
      <FeedbackPanel notice={notice} hints={[]} emptyText="Nothing yet" />
    </LangProvider>
  );
}

describe("feedback", () => {
  it("is a new element for every new message, so its motion plays each time", () => {
    const { rerender } = render(panel(good));
    const first = document.querySelector(".notice");
    expect(first?.classList.contains("notice-success")).toBe(true);

    rerender(panel(bad));
    const second = document.querySelector(".notice");
    expect(second).not.toBe(first);
    expect(second?.classList.contains("notice-error")).toBe(true);

    // The same mistake made again is a new message too: it shakes again.
    rerender(panel({ ...bad }));
    expect(document.querySelector(".notice")).not.toBe(second);
  });

  it("keeps the element when nothing new was said", () => {
    const { rerender } = render(panel(good));
    const first = document.querySelector(".notice");
    rerender(panel(good));
    expect(document.querySelector(".notice")).toBe(first);
  });

  it("still tells a screen reader, politely, what was said", () => {
    render(panel(good));
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
    expect(screen.getByText("Well done")).toBeTruthy();
  });
});

describe("the equation on screen", () => {
  const show = (text: string, applied: boolean) => (
    <LangProvider lang="en">
      <EquationDisplay equation={mustParseEquation(text)} label="Current equation" solved={false} applied={applied ? { kind: "subtract", amount: { n: 5, d: 1 }, withVariable: false } : null} />
    </LangProvider>
  );

  it("is a new element when the equation changes, so it arrives again", () => {
    const { rerender } = render(show("2x + 5 = 17", false));
    const first = document.querySelector(".eq");
    rerender(show("2x = 12", false));
    expect(document.querySelector(".eq")).not.toBe(first);
  });

  it("stays the same element while a move is only being shown on it", () => {
    const { rerender } = render(show("2x + 5 = 17", false));
    const first = document.querySelector(".eq");
    rerender(show("2x + 5 = 17", true));
    expect(document.querySelector(".eq")).toBe(first);
  });
});

describe("the stages of a lesson", () => {
  function lesson() {
    const level = getLevel("two-step")!;
    const topic = topics.find((item) => item.id === "two-step")!;
    const user = userEvent.setup();
    render(
      <LangProvider lang="en">
        <SolverView level={level} topic={topic} onComplete={() => {}} onExit={() => {}} onOpenLevel={() => {}} onQuiz={() => {}} />
      </LangProvider>,
    );
    return user;
  }

  it("each arrive as a new view, so a change of stage is seen as a change", async () => {
    const user = lesson();
    const intro = document.querySelector(".stage-view");
    expect(intro).toBeTruthy();
    expect(intro!.querySelector(".intro")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /See a worked example/ }));
    const example = document.querySelector(".stage-view");
    expect(example).not.toBe(intro);
    expect(example!.querySelector(".workspace")).toBeTruthy();
    expect(document.querySelectorAll(".stage-view")).toHaveLength(1);
  });

  it("keeps the stage buttons outside the sliding part, so they stay where they are", () => {
    lesson();
    const nav = screen.getByRole("navigation", { name: "Level steps" });
    expect(nav.closest(".stage-view")).toBeNull();
  });

  it("does not slide the stage in for someone who asked for less motion", async () => {
    const sheet = (await import("node:fs")).readFileSync("app/solver.css", "utf8");
    const reduced = sheet.slice(sheet.lastIndexOf("@media (prefers-reduced-motion: reduce)"));
    for (const selector of [".stage-view", ".recap li", ".feedback-region .notice", ".task"]) expect(reduced).toContain(selector);
  });
});
