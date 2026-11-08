"use client";

import { Flag, RotateCcw, Undo2 } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  describeOperation,
  findFlipTerm,
  formatAppliedEquation,
  formatBar,
  formatEquation,
  formatFlipPreview,
  type Equation,
  type StepRecord,
} from "@/lib/equations";

interface StepHistoryProps {
  start: Equation;
  steps: readonly StepRecord[];
  /** Omit to hide the undo and restart controls (for example in a worked example). */
  onUndo?: () => void;
  onRestart?: () => void;
  canUndo?: boolean;
}

/**
 * The learner's working so far, written like a notebook: the starting
 * equation, then for every step the equation with the operation beside it
 * (`3x − 5 = 6 | + 5`), how it looked on both sides (or after the flip), and
 * the simplified result.
 */
export function StepHistory({ start, steps, onUndo, onRestart, canUndo = false }: StepHistoryProps) {
  const { lang, t } = useI18n();
  const text = t.solver.history;

  return (
    <section className="history" aria-label={text.title}>
      <h2 className="history-title">{text.title}</h2>
      <ol className="history-list">
        <li className="history-item history-start">
          <span className="history-badge" aria-hidden="true">
            <Flag size={13} />
          </span>
          <div>
            <span className="history-label">{text.start}</span>
            <p className="history-equation">{formatEquation(start)}</p>
          </div>
        </li>
        {steps.map((step, index) => {
          const term = step.flip ? findFlipTerm(step.before, step.flip, lang) : null;
          const moved = step.flip ? formatFlipPreview(step.before, step.flip, lang) : null;
          return (
            <li className="history-item" key={index}>
              <span className="history-badge" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <span className="history-label">
                  {step.flip && term ? text.flip(index + 1, term.text) : text.step(index + 1, describeOperation(step.operation, lang))}
                </span>
                <p className="history-notebook">
                  <span>{formatEquation(step.before)}</span>
                  <span className="history-bar">{formatBar(step.operation, lang)}</span>
                </p>
                <p className="history-applied">{moved ?? formatAppliedEquation(step.before, step.operation, lang)}</p>
                <p className="history-equation">{formatEquation(step.after)}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {steps.length === 0 && <p className="history-empty">{text.empty}</p>}

      {(onUndo || onRestart) && (
        <div className="history-actions">
          {onUndo && (
            <button type="button" className="chip-button" onClick={onUndo} disabled={!canUndo}>
              <Undo2 size={16} aria-hidden="true" /> {text.undo}
            </button>
          )}
          {onRestart && (
            <button type="button" className="chip-button" onClick={onRestart} disabled={!canUndo}>
              <RotateCcw size={16} aria-hidden="true" /> {text.restart}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
