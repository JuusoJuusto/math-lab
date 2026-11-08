"use client";

import { useMemo, useReducer } from "react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  createSession,
  currentPreludeStep,
  describeOperation,
  levelText,
  makePrelude,
  mustParseEquation,
  preludeShown,
  sessionReducer,
  solutionOf,
  suggestNextMove,
  type Equation,
  type LevelDefinition,
} from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";
import { BalanceScale } from "./BalanceScale";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { OtherWay } from "./OtherWay";
import { StepHistory } from "./StepHistory";
import { SubstitutionCheck } from "./SubstitutionCheck";

interface WorkedExampleProps {
  level: LevelDefinition;
  onPractise: () => void;
}

/**
 * A guided demonstration. It runs on the same engine as the exercises, but
 * the tutor, not the learner, chooses the moves, one click at a time, and explains each one.
 */
export function WorkedExample({ level, onPractise }: WorkedExampleProps) {
  const { lang, t } = useI18n();
  const equation = useMemo(() => mustParseEquation(level.example.equation), [level.example.equation]);
  const prelude = useMemo(() => makePrelude(level.example.equation), [level.example.equation]);
  const [state, dispatch] = useReducer(sessionReducer, equation, (start: Equation) => createSession(start, lang, prelude));

  const suggestion = suggestNextMove(state.current);
  const solution = solutionOf(state);
  const started = state.steps.length > 0 || state.pending !== null || state.preludeIndex > 0;

  const preludeStep = currentPreludeStep(state);
  const written = preludeShown(state);

  function advance() {
    if (preludeStep) dispatch({ type: "prelude", choice: preludeStep.correct });
    else if (state.pending) dispatch({ type: "simplify" });
    else if (suggestion) dispatch({ type: "apply", operation: suggestion.operation });
  }

  // In a demonstration the tutor picks the move, so name the step instead of praising a choice.
  const notice =
    state.notice && state.pending
      ? { ...state.notice, title: t.solver.example.stepTitle(state.steps.length + 1, describeOperation(state.pending.operation, lang)) }
      : state.notice;

  return (
    <div className="workspace">
      <div className="workspace-main">
        {written !== null ? (
          <section className="eq eq-written" aria-label={t.solver.display.worked}>
            <div className="eq-caption" aria-hidden="true">
              {t.solver.written}
            </div>
            <MathLine text={written} />
          </section>
        ) : (
          <EquationDisplay
            equation={state.current}
            applied={state.pending?.operation ?? null}
            solved={state.outcome === "solved"}
            label={t.solver.display.worked}
          />
        )}

        {written === null && <BalanceScale equation={state.current} />}

        <FeedbackPanel notice={notice} hints={[]} emptyText={levelText(level, lang).exampleLead} />

        {solution ? (
          <>
            <SubstitutionCheck
              original={state.start}
              value={solution}
              checked={state.checked}
              onCheck={() => dispatch({ type: "check" })}
            />
            <OtherWay equation={equation} />
            <div className="action-buttons action-finish">
              <button type="button" className="button-primary" onClick={onPractise}>
                {t.solver.example.tryIt} <ArrowRight size={17} aria-hidden="true" />
              </button>
              <button type="button" className="button-secondary" onClick={() => dispatch({ type: "restart" })}>
                <RotateCcw size={16} aria-hidden="true" /> {t.solver.example.again}
              </button>
            </div>
          </>
        ) : (
          <div className="action-buttons">
            <button type="button" className="button-primary" onClick={advance}>
              <Play size={16} aria-hidden="true" /> {state.pending ? t.solver.simplify : started ? t.solver.example.next : t.solver.example.first}
            </button>
            <button type="button" className="text-link" onClick={onPractise}>
              {t.solver.example.skip}
            </button>
          </div>
        )}
      </div>

      <div className="workspace-side">
        <StepHistory start={state.start} steps={state.steps} prelude={state.prelude} preludeDone={state.preludeIndex} />
      </div>
    </div>
  );
}
