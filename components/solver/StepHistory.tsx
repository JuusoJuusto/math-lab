import { RotateCcw, Undo2 } from "lucide-react";
import { formatAppliedEquation, formatEquation, operationLabel, type Equation, type StepRecord } from "@/lib/equations";

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
 * equation, then for every step the operation, how it looked on both sides,
 * and the simplified result.
 */
export function StepHistory({ start, steps, onUndo, onRestart, canUndo = false }: StepHistoryProps) {
  return (
    <section className="history" aria-label="Your steps">
      <h2 className="history-title">Your steps</h2>
      <ol className="history-list">
        <li className="history-item history-start">
          <span className="history-badge" aria-hidden="true">
            •
          </span>
          <div>
            <span className="history-label">Start</span>
            <p className="history-equation">{formatEquation(start)}</p>
          </div>
        </li>
        {steps.map((step, index) => (
          <li className="history-item" key={index}>
            <span className="history-badge" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              <span className="history-label">
                Step {index + 1} · <span className="history-op">{operationLabel(step.operation)}</span> on both sides
              </span>
              <p className="history-applied">{formatAppliedEquation(step.before, step.operation)}</p>
              <p className="history-equation">{formatEquation(step.after)}</p>
            </div>
          </li>
        ))}
      </ol>
      {steps.length === 0 && <p className="history-empty">Each step you take will be written here.</p>}

      {(onUndo || onRestart) && (
        <div className="history-actions">
          {onUndo && (
            <button type="button" className="chip-button" onClick={onUndo} disabled={!canUndo}>
              <Undo2 size={16} aria-hidden="true" /> Undo
            </button>
          )}
          {onRestart && (
            <button type="button" className="chip-button" onClick={onRestart} disabled={!canUndo}>
              <RotateCcw size={16} aria-hidden="true" /> Start over
            </button>
          )}
        </div>
      )}
    </section>
  );
}
