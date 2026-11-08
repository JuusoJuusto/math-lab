"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { pickRound, type Exercise, type ExerciseResult, type LevelDefinition } from "@/lib/equations";
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
  // Chosen once, when the learner starts the round, so server-rendered HTML never differs from the client.
  const [exercises] = useState(() => pickRound(level, Math.random, avoid));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<readonly ExerciseResult[]>([]);
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

  function next(outcome: WorkspaceOutcome) {
    const updated = [...results, { id: exercise.id, ...outcome }];
    onEquationSolved?.();
    if (isLast) {
      onComplete({ exercises, results: updated });
      return;
    }
    setResults(updated);
    setIndex(index + 1);
  }

  return (
    <section aria-label="Practice round">
      <div className="round-head">
        <button type="button" className="back-link" onClick={onExit}>
          <ArrowLeft size={16} aria-hidden="true" /> Leave practice
        </button>
        <h2 className="round-title" tabIndex={-1} ref={heading}>
          Equation {index + 1} of {exercises.length}
        </h2>
      </div>
      <ol className="pips" aria-label="Round progress">
        {exercises.map((item, i) => (
          <li
            key={item.id}
            className={i < index ? "pip pip-done" : i === index ? "pip pip-current" : "pip"}
            aria-current={i === index ? "step" : undefined}
          >
            <span className="sr-only">{i < index ? "Done" : i === index ? "Current" : "To do"}</span>
          </li>
        ))}
      </ol>
      <SolverWorkspace
        key={exercise.id}
        equation={exercise.equation}
        continueLabel={isLast ? "Finish level" : "Next equation"}
        onContinue={next}
      />
    </section>
  );
}
