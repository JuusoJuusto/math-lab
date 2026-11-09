"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, PenLine } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { levelText, pickFrom, pickRound, planHand, roundVariant, type Exercise, type ExerciseResult, type LevelDefinition } from "@/lib/equations";
import { crossedMilestones, percentDone } from "@/src/studyHubMilestones";
import { reportProgress } from "@/src/studyHubProgress";
import type { MoveMode } from "./MoveTabs";
import { HandWorkspace } from "./HandWorkspace";
import { SolverWorkspace, type WorkspaceOutcome } from "./SolverWorkspace";

export interface RoundReport {
  exercises: readonly Exercise[];
  results: readonly ExerciseResult[];
}

interface PracticeRoundProps {
  level: LevelDefinition;
  /** Exercise ids from the previous round, which are avoided where possible. */
  avoid: readonly string[];
  onComplete: (report: RoundReport) => void;
  /** Called each time an equation has been solved. */
  onEquationSolved?: () => void;
  onExit: () => void;
}

/** A short run of equations, one after another, with a simple progress indicator. */
export function PracticeRound({ level, avoid, onComplete, onEquationSolved, onExit }: PracticeRoundProps) {
  const { lang, t } = useI18n();
  // Chosen once, when the learner starts the round, so server-rendered HTML never differs from the client.
  const [exercises] = useState(() => pickRound(level, Math.random, avoid));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<readonly ExerciseResult[]>([]);
  // The way of moving the learner chose stays for the whole round.
  const [moveMode, setMoveMode] = useState<MoveMode>("balance");
  const heading = useRef<HTMLHeadingElement>(null);
  const isFirst = useRef(true);

  // Announce and scroll to the new equation when the learner moves on.
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    heading.current?.focus();
  }, [index]);

  const exercise = exercises[index];
  const isLast = index + 1 === exercises.length;
  // Four in five exercises are written by hand, in varied formats; the first uses the buttons.
  const handVariant = roundVariant(index, exercises.length);

  function next(outcome: WorkspaceOutcome) {
    const updated = [...results, { id: exercise.id, ...outcome }];
    for (const value of crossedMilestones(percentDone(index, exercises.length), percentDone(index + 1, exercises.length))) {
      reportProgress("progress", { label: levelText(level, lang).title, ref: `lesson-${level.id}`, value });
    }
    onEquationSolved?.();
    if (isLast) {
      onComplete({ exercises, results: updated });
      return;
    }
    setResults(updated);
    setIndex(index + 1);
  }

  return (
    <section aria-label={t.solver.round.label}>
      <div className="round-head">
        <button type="button" className="back-link" onClick={onExit}>
          <ArrowLeft size={16} aria-hidden="true" /> {t.solver.round.leave}
        </button>
        <h2 className="round-title" tabIndex={-1} ref={heading}>
          {t.solver.round.title(index + 1, exercises.length)}
        </h2>
      </div>
      <ol className="pips" aria-label={t.solver.round.progress}>
        {exercises.map((item, i) => (
          <li
            key={item.id}
            className={i < index ? "pip pip-done" : i === index ? "pip pip-current" : "pip"}
            aria-current={i === index ? "step" : undefined}
          >
            <span className="sr-only">{i < index ? t.solver.round.done : i === index ? t.solver.round.current : t.solver.round.todo}</span>
          </li>
        ))}
      </ol>
      {handVariant !== null ? (
        <>
          <p className="hand-banner">
            <PenLine size={18} aria-hidden="true" /> {t.solver.round.byHand[handVariant]}
          </p>
          <HandWorkspace
            key={`${exercise.id}-${lang}-hand`}
            source={exercise.source}
            equation={exercise.equation}
            plan={planHand(exercise.source, handVariant, pickFrom(exercise.id))}
            continueLabel={isLast ? t.solver.finishLevel : t.solver.nextEquation}
            onContinue={next}
          />
        </>
      ) : (
        <SolverWorkspace
          // A change of language starts the equation again, so every message is in one language.
          key={`${exercise.id}-${lang}`}
          equation={exercise.equation}
          prelude={exercise.prelude}
          continueLabel={isLast ? t.solver.finishLevel : t.solver.nextEquation}
          moveMode={moveMode}
          onMoveModeChange={setMoveMode}
          onContinue={next}
        />
      )}
    </section>
  );
}
