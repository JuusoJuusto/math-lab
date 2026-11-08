"use client";

import { useMemo, useReducer } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import {
  createSession,
  describeOperation,
  mustParseEquation,
  sessionReducer,
  solutionOf,
  suggestNextMove,
  type LevelDefinition,
} from "@/lib/equations";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { StepHistory } from "./StepHistory";
import { SubstitutionCheck } from "./SubstitutionCheck";

interface WorkedExampleProps {
  level: LevelDefinition;
  onPractise: () => void;
}

/**
 * A guided demonstration. It runs on the same engine as the exercises, but
 * the tutor chooses the moves, one click at a time, and explains each one.
 */
export function WorkedExample({ level, onPractise }: WorkedExampleProps) {
  const equation = useMemo(() => mustParseEquation(level.example.equation), [level.example.equation]);
  const [state, dispatch] = useReducer(sessionReducer, equation, createSession);

  const suggestion = suggestNextMove(state.current);
  const solution = solutionOf(state);
  const started = state.steps.length > 0 || state.pending !== null;

  function advance() {
    if (state.pending) dispatch({ type: "simplify" });
    else if (suggestion) dispatch({ type: "apply", operation: suggestion.operation });
  }

  // In a demonstration the tutor, not the learner, picks the move, so name the step instead of praising a choice.
  const notice =
    state.notice && state.pending
      ? { ...state.notice, title: `Step ${state.steps.length + 1}: ${describeOperation(state.pending.operation)}` }
      : state.notice;

  return (
    <div className="workspace">
      <div className="workspace-main">
        <EquationDisplay
          equation={state.current}
          applied={state.pending?.operation ?? null}
          solved={state.outcome === "solved"}
          label="Worked example"
        />

        <FeedbackPanel notice={notice} hints={[]} emptyText={level.example.lead} />

        {solution ? (
          <>
            <SubstitutionCheck
              original={state.start}
              value={solution}
              checked={state.checked}
              onCheck={() => dispatch({ type: "check" })}
            />
            <div className="action-buttons action-finish">
              <button type="button" className="button-primary" onClick={onPractise}>
                Try it yourself <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="button-secondary" onClick={() => dispatch({ type: "restart" })}>
                <RotateCcw size={16} aria-hidden="true" /> Watch again
              </button>
            </div>
          </>
        ) : (
          <div className="action-buttons">
            <button type="button" className="button-primary" onClick={advance}>
              <Play size={16} aria-hidden="true" /> {state.pending ? "Simplify both sides" : started ? "Show the next step" : "Show the first step"}
            </button>
            <button type="button" className="text-link" onClick={onPractise}>
              Skip to practice
            </button>
          </div>
        )}
      </div>

      <div className="workspace-side">
        <StepHistory start={state.start} steps={state.steps} />
      </div>
    </div>
  );
}
