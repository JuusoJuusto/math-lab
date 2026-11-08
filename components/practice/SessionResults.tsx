"use client";

import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { getTopic } from "@/content/topics";
import { GROUP_INFO, generateTask, groupOf, type ModeInfo, type TaskGroup, type TaskSpec } from "@/lib/tasks";
import { toHash } from "@/lib/routes";
import { TaskDisplayView } from "./TaskCard";

export interface AnswerRecord {
  readonly spec: TaskSpec;
  readonly correct: boolean;
  readonly given: string;
  readonly xp: number;
}

interface SessionResultsProps {
  mode: ModeInfo;
  records: readonly AnswerRecord[];
  /** Extra XP not tied to a single task, such as the daily challenge bonus. */
  bonus: number;
  queued: number;
  onAgain: () => void;
  onMistakes: () => void;
}

function headline(percent: number): string {
  if (percent === 100) return "Perfect round!";
  if (percent >= 80) return "Great work!";
  if (percent >= 60) return "Nice progress!";
  return "Keep practising!";
}

/** The end of a session: score, XP, what kinds of task went well, and what to review. */
export function SessionResults({ mode, records, bonus, queued, onAgain, onMistakes }: SessionResultsProps) {
  const total = records.length;
  const correct = records.filter((record) => record.correct).length;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const xp = records.reduce((sum, record) => sum + record.xp, 0) + bonus;
  const missed = records.filter((record) => !record.correct);

  const groups = new Map<TaskGroup, { correct: number; total: number }>();
  const topics = new Map<string, { correct: number; total: number }>();
  for (const record of records) {
    const group = groupOf(record.spec.kind);
    const g = groups.get(group) ?? { correct: 0, total: 0 };
    groups.set(group, { correct: g.correct + (record.correct ? 1 : 0), total: g.total + 1 });
    const t = topics.get(record.spec.topic) ?? { correct: 0, total: 0 };
    topics.set(record.spec.topic, { correct: t.correct + (record.correct ? 1 : 0), total: t.total + 1 });
  }
  const weak = [...topics.entries()].filter(([, t]) => t.correct < t.total).sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)[0];

  return (
    <section className="results" aria-labelledby="results-title">
      <div className="results-medal">
        <Trophy size={34} aria-hidden="true" />
      </div>
      <p className="kicker">{mode.title} complete</p>
      <h1 id="results-title">{mode.id === "time" ? `${correct} correct in 60 seconds` : headline(percent)}</h1>
      <p className="results-score">
        <strong>{correct}</strong> / {total} correct
      </p>
      <p className="results-xp">+{xp} XP{bonus > 0 ? ` (including +${bonus} daily bonus)` : ""}</p>

      {groups.size > 1 && (
        <ul className="breakdown" aria-label="Results by type of task">
          {[...groups.entries()].map(([group, tally]) => (
            <li key={group}>
              <span>{GROUP_INFO[group].label}</span>
              <span className="bar" aria-hidden="true">
                <span style={{ width: `${Math.round((tally.correct / tally.total) * 100)}%` }} />
              </span>
              <span>
                {tally.correct}/{tally.total}
              </span>
            </li>
          ))}
        </ul>
      )}

      {weak && (
        <p className="revise">
          Revise next: <a href={toHash({ name: "lesson", topic: weak[0] })}>{getTopic(weak[0])?.title}</a>
        </p>
      )}

      <div className="action-row action-center">
        <button type="button" className="cta cta-inline" onClick={onAgain}>
          <RotateCcw size={18} aria-hidden="true" /> {mode.id === "mistakes" ? "Back to practice" : "Try again"}
        </button>
        {queued > 0 && mode.id !== "mistakes" && (
          <button type="button" className="button-secondary" onClick={onMistakes}>
            Fix {queued} mistake{queued === 1 ? "" : "s"} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <a className="button-secondary" href={toHash({ name: "practice" })}>
          Other ways to practise
        </a>
      </div>

      {missed.length > 0 && (
        <section className="review" aria-labelledby="review-title">
          <h2 id="review-title">Review your mistakes</h2>
          <ul>
            {missed.map((record, index) => {
              const task = generateTask(record.spec);
              return (
                <li key={`${record.spec.seed}-${index}`}>
                  <details>
                    <summary>{task.prompt}</summary>
                    {task.display && <TaskDisplayView display={task.display} />}
                    <p>
                      Your answer: <strong>{record.given || "–"}</strong>. Correct answer: <strong>{task.answerText}</strong>.
                    </p>
                    <ul className="explain">
                      {task.explanation.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}
