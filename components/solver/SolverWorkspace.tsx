"use client";

import { useEffect, useReducer, useRef } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import {
  canGetHint,
  canUndo,
  createSession,
  getHints,
  sessionReducer,
  solutionOf,
  type Equation,
  type ExerciseResult,
} from "@/lib/equations";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { OperationPicker } from "./OperationPicker";
import { StepHistory } from "./StepHistory";
import { SubstitutionCheck } from "./SubstitutionCheck";

export type WorkspaceOutcome = Omit<ExerciseResult, "id">;

interface SolverWorkspaceProps {
  equation: Equation;
  /** Called when the learner moves on from this equation. */
  onContinue: (outcome: WorkspaceOutcome) => void;
  /** Label for the button that moves on, for example "Next equation" or "Finish level". */
  continueLabel: string;
}

const EMPTY_TEXT =
  "Your move. Choose an operation and a number, then apply it to both sides. Whatever you do to one side, do to the other too.";

/**
 * One interactive exercise.
 *
 * The learner chooses an operation and a number; the engine judges the choice.
 * A good choice is shown written on both sides first, and the learner then
 * simplifies it into the next equation. Mistakes get an explanation and
 * another try, hints get stronger one at a time, and the final answer can be
 * verified by substitution.
 */
export function SolverWorkspace({ equation, onContinue, continueLabel }: SolverWorkspaceProps) {
  const [state, dispatch] = useReducer(sessionReducer, equation, createSession);

  const simplifyButton = useRef<HTMLButtonElement>(null);
  const checkButton = useRef<HTMLButtonElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);

  // Keep keyboard and screen-reader users in the flow as the screen changes.
  useEffect(() => {
    if (state.pending) simplifyButton.current?.focus();
  }, [state.pending]);

  useEffect(() => {
    if (state.outcome !== "solving") (checkButton.current ?? continueButton.current)?.focus();
  }, [state.outcome]);

  useEffect(() => {
    if (state.checked) continueButton.current?.focus();
  }, [state.checked]);

  const hints = getHints(state.current);
  const shownHints = hints ? hints.slice(0, state.hintLevel) : [];
  const solution = solutionOf(state);
  const finished = state.outcome !== "solving";

  function finish() {
    onContinue({ steps: state.steps.length, mistakes: state.mistakes, hints: state.hintsUsed });
  }

  const hintLabel =
    state.hintLevel === 0 ? "Hint" : state.hintLevel < 3 ? `More help (${state.hintLevel}/3)` : "All hints shown";

  return (
    <div className="workspace">
      <div className="workspace-main">
        <EquationDisplay
          equation={state.current}
          applied={state.pending?.operation ?? null}
          solved={state.outcome === "solved"}
        />

        <FeedbackPanel notice={state.notice} hints={shownHints} emptyText={EMPTY_TEXT} />

        {state.pending ? (
          <section className="action-card" aria-label="Simplify">
            <p className="action-text">Now work out each side to get the next equation.</p>
            <div className="action-buttons">
              <button type="button" className="button-primary" ref={simplifyButton} onClick={() => dispatch({ type: "simplify" })}>
                Simplify both sides
              </button>
              <button type="button" className="button-secondary" onClick={() => dispatch({ type: "undo" })}>
                Choose again
              </button>
            </div>
          </section>
        ) : finished ? (
          <>
            {solution && (
              <SubstitutionCheck
                original={state.start}
                value={solution}
                checked={state.checked}
                onCheck={() => dispatch({ type: "check" })}
                ref={checkButton}
              />
            )}
            <div className="action-buttons action-finish">
              {(state.checked || !solution) && (
                <button type="button" className="button-primary" ref={continueButton} onClick={finish}>
                  {continueLabel} <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
              {solution && !state.checked && (
                <button type="button" className="text-link" ref={continueButton} onClick={finish}>
                  Skip the check and {continueLabel.toLowerCase()}
                </button>
              )}
            </div>
          </>
        ) : (
          <OperationPicker
            key={state.steps.length}
            autoFocus={state.steps.length > 0}
            onApply={(operation) => dispatch({ type: "apply", operation })}
            extra={
              <button
                type="button"
                className="button-secondary"
                onClick={() => dispatch({ type: "hint" })}
                disabled={!canGetHint(state)}
              >
                <Lightbulb size={16} aria-hidden="true" /> {hintLabel}
              </button>
            }
          />
        )}
      </div>

      <div className="workspace-side">
        <StepHistory
          start={state.start}
          steps={state.steps}
          canUndo={canUndo(state)}
          onUndo={() => dispatch({ type: "undo" })}
          onRestart={() => dispatch({ type: "restart" })}
        />
      </div>
    </div>
  );
}
