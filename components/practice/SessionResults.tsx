"use client";

import { ArrowRight, RotateCcw, Trophy } from "lucide-react";
import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { generateTask, groupOf, type ModeInfo, type TaskGroup, type TaskSpec } from "@/lib/tasks";
import { TaskDisplayView } from "./TaskCard";
import { AppLink } from "@/components/ui/AppLink";

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

/** The end of a session: score, XP, what kinds of task went well, and what to review. */
export function SessionResults({ mode, records, bonus, queued, onAgain, onMistakes }: SessionResultsProps) {
  const { lang, t } = useI18n();
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
      <p className="kicker">{t.results.complete(t.modes[mode.id].title)}</p>
      <h1 id="results-title">{mode.id === "time" ? t.results.timeHeadline(correct) : t.results.headline(percent)}</h1>
      <p className="results-score">
        <strong>{t.results.score(correct, total).correct}</strong>
        {t.results.score(correct, total).rest}
      </p>
      <p className="results-xp">{t.results.xp(xp, bonus)}</p>

      {groups.size > 1 && (
        <ul className="breakdown" aria-label={t.results.byType}>
          {[...groups.entries()].map(([group, tally]) => (
            <li key={group}>
              <span>{t.groups[group].label}</span>
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
          {t.results.revise} <AppLink route={{ name: "lesson", topic: weak[0] }}>{getTopic(weak[0], lang)?.title}</AppLink>
        </p>
      )}

      <div className="action-row action-center">
        <button type="button" className="cta cta-inline" onClick={onAgain}>
          <RotateCcw size={18} aria-hidden="true" /> {mode.id === "mistakes" ? t.results.backToPractice : t.results.again}
        </button>
        {queued > 0 && mode.id !== "mistakes" && (
          <button type="button" className="button-secondary" onClick={onMistakes}>
            {t.results.fix(queued)} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <AppLink className="button-secondary" route={{ name: "practice" }}>
          {t.results.other}
        </AppLink>
      </div>

      {missed.length > 0 && (
        <section className="review" aria-labelledby="review-title">
          <h2 id="review-title">{t.results.review}</h2>
          <ul>
            {missed.map((record, index) => {
              const task = generateTask(record.spec, lang);
              return (
                <li key={`${record.spec.seed}-${index}`}>
                  <details>
                    <summary>{task.prompt}</summary>
                    {task.display && <TaskDisplayView display={task.display} />}
                    <p>
                      {t.results.yourAnswer} <strong>{record.given || "–"}</strong>. {t.results.correctAnswer} <strong>{task.answerText}</strong>.
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
