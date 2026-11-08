"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  canGetHint,
  canUndo,
  chainOf,
  createSession,
  currentPreludeStep,
  hintsWithFlip,
  preludeShown,
  sessionReducer,
  solutionOf,
  type Equation,
  type ExerciseResult,
  type Prelude,
} from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";
import { PreludeCard } from "./PreludeCard";
import { BalanceScale } from "./BalanceScale";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { MoveTabs, type MoveMode } from "./MoveTabs";
import { GraphView } from "./GraphView";
import { OperationPicker } from "./OperationPicker";
import { ReverseChain } from "./ReverseChain";
import { StepHistory } from "./StepHistory";
import { SubstitutionCheck } from "./SubstitutionCheck";

export type WorkspaceOutcome = Omit<ExerciseResult, "id">;

interface SolverWorkspaceProps {
  equation: Equation;
  /** The questions that bring the equation as written (brackets, fractions) into simple form, if it needs them. */
  prelude?: Prelude;
  /** Called when the learner moves on from this equation. */
  onContinue: (outcome: WorkspaceOutcome) => void;
  /** Label for the button that moves on, for example "Next equation" or "Finish level". */
  continueLabel: string;
  /** How the learner moves: the same on both sides, or flipping a term across the equals sign. */
  moveMode?: MoveMode;
  onMoveModeChange?: (mode: MoveMode) => void;
}

/**
 * One interactive exercise.
 *
 * The learner chooses a move; the engine judges it. A move is either an
 * operation done to both sides, or a term flipped across the equals sign (which
 * is the same thing in a shorter form). A good move is shown first, and the
 * learner then simplifies it into the next equation. Mistakes get an
 * explanation and another try, hints get stronger one at a time, and the final
 * answer can be verified by substitution.
 */
export function SolverWorkspace({
  equation,
  prelude,
  onContinue,
  continueLabel,
  moveMode: controlledMode,
  onMoveModeChange,
}: SolverWorkspaceProps) {
  const { lang, t } = useI18n();
  const [state, dispatch] = useReducer(sessionReducer, equation, (start: Equation) => createSession(start, lang, prelude ?? null));
  const [ownMode, setOwnMode] = useState<MoveMode>("balance");
  const chosenMode = controlledMode ?? ownMode;
  const changeMode = onMoveModeChange ?? setOwnMode;
  // "Work backwards" needs x once, on one side; if the equation no longer fits, the usual way takes over.
  const chain = state.pending ? null : chainOf(state.current);
  const moveMode: MoveMode = chosenMode === "chain" && !chain ? "balance" : chosenMode;

  const root = useRef<HTMLDivElement>(null);
  const simplifyButton = useRef<HTMLButtonElement>(null);
  const checkButton = useRef<HTMLButtonElement>(null);
  const continueButton = useRef<HTMLButtonElement>(null);

  // Keep keyboard and screen-reader users in the flow as the screen changes.
  useEffect(() => {
    if (state.pending) simplifyButton.current?.focus();
  }, [state.pending]);

  // After a step in flip mode, put focus on the first term that can be flipped.
  useEffect(() => {
    if (moveMode !== "flip" || state.pending || state.outcome !== "solving" || state.steps.length === 0) return;
    root.current?.querySelector<HTMLElement>(".eq-flip")?.focus();
  }, [moveMode, state.pending, state.outcome, state.steps.length]);

  useEffect(() => {
    if (state.outcome !== "solving") (checkButton.current ?? continueButton.current)?.focus();
  }, [state.outcome]);

  useEffect(() => {
    if (state.checked) continueButton.current?.focus();
  }, [state.checked]);

  const preludeStep = currentPreludeStep(state);
  const written = preludeShown(state);
  const hints = hintsWithFlip(state.current, lang);
  const shownHints = hints ? hints.slice(0, state.hintLevel) : [];
  const solution = solutionOf(state);
  const finished = state.outcome !== "solving";
  const flipping = moveMode === "flip" && !state.pending && !finished;

  function finish() {
    onContinue({ steps: state.steps.length, mistakes: state.mistakes, hints: state.hintsUsed });
  }

  const hintLabel =
    state.hintLevel === 0 ? t.solver.hint : state.hintLevel < 3 ? t.solver.moreHelp(state.hintLevel) : t.solver.allHints;

  const hintButton = (
    <button type="button" className="button-secondary" onClick={() => dispatch({ type: "hint" })} disabled={!canGetHint(state)}>
      <Lightbulb size={16} aria-hidden="true" /> {hintLabel}
    </button>
  );

  return (
    <div className="workspace" ref={root}>
      <div className="workspace-main">
        {preludeStep && written !== null ? (
          <>
            <section className="eq eq-written" aria-label={t.solver.written}>
              <div className="eq-caption" aria-hidden="true">
                {t.solver.written}
              </div>
              <MathLine text={written} />
            </section>
            <FeedbackPanel notice={state.notice} hints={[]} emptyText={t.solver.preludeEmpty} />
            <PreludeCard step={preludeStep} wrong={state.preludeWrong} onChoose={(choice) => dispatch({ type: "prelude", choice })} />
          </>
        ) : (
        <>
        <EquationDisplay
          equation={state.current}
          applied={state.pending && !state.pending.flip ? state.pending.operation : null}
          flipped={state.pending?.flip ?? null}
          onFlip={flipping ? (target) => dispatch({ type: "flip", target }) : undefined}
          solved={state.outcome === "solved"}
        />

        <BalanceScale equation={state.current} />

        <FeedbackPanel notice={state.notice} hints={shownHints} emptyText={moveMode === "flip" ? t.solver.emptyFlip : t.solver.empty} />

        {state.pending ? (
          <section className="action-card" aria-label={t.solver.simplifyLabel}>
            <p className="action-text">{t.solver.simplifyText}</p>
            <div className="action-buttons">
              <button type="button" className="button-primary" ref={simplifyButton} onClick={() => dispatch({ type: "simplify" })}>
                {t.solver.simplify}
              </button>
              <button type="button" className="button-secondary" onClick={() => dispatch({ type: "undo" })}>
                {t.solver.chooseAgain}
              </button>
            </div>
          </section>
        ) : finished ? (
          <>
            <GraphView equation={state.start} />
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
                  {t.solver.skipCheck(continueLabel)}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <MoveTabs mode={moveMode} onChange={changeMode} canChain={chain !== null}>
              {moveMode === "flip" ? hintButton : null}
            </MoveTabs>
            {moveMode === "chain" && chain ? (
              <ReverseChain
                chain={chain}
                onSolved={(value) => dispatch({ type: "answer", value })}
                onMiss={() => dispatch({ type: "miss" })}
              />
            ) : moveMode === "flip" ? (
              <p className="flip-help">{t.solver.flipHelp}</p>
            ) : (
              <OperationPicker
                key={state.steps.length}
                autoFocus={state.steps.length > 0}
                onApply={(operation) => dispatch({ type: "apply", operation })}
                extra={hintButton}
              />
            )}
          </>
        )}
        </>
        )}
      </div>

      <div className="workspace-side">
        <StepHistory
          start={state.start}
          prelude={state.prelude}
          preludeDone={state.preludeIndex}
          steps={state.steps}
          canUndo={canUndo(state)}
          onUndo={() => dispatch({ type: "undo" })}
          onRestart={() => dispatch({ type: "restart" })}
        />
      </div>
    </div>
  );
}
