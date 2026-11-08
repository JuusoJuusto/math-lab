"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { MAX_AMOUNT, describeOperation, engineText, operation, operatorSymbol, type Operation, type OperationKind } from "@/lib/equations";

const KINDS: readonly OperationKind[] = ["add", "subtract", "multiply", "divide"];

/** Whole numbers only, within the range the engine can handle exactly. */
function parseAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  return Math.abs(value) <= MAX_AMOUNT ? value : null;
}

interface OperationPickerProps {
  onApply: (operation: Operation) => void;
  /** Moves keyboard focus to the first choice, used after a step has been simplified. */
  autoFocus?: boolean;
  /** Extra controls shown next to the apply button, such as the hint button. */
  extra?: ReactNode;
}

/**
 * Lets the learner decide what to do to both sides: which operation, and by
 * how much. Nothing here knows the answer; the engine judges the choice.
 *
 * The operation uses native radio buttons so arrow keys, focus and screen
 * readers work without extra code, and the form submits on Enter.
 */
export function OperationPicker({ onApply, autoFocus = false, extra }: OperationPickerProps) {
  const { lang, t } = useI18n();
  const words = engineText(lang);
  const name = useId();
  const amountId = useId();
  const errorId = useId();
  const [kind, setKind] = useState<OperationKind | null>(null);
  const [amountText, setAmountText] = useState("");
  const [withVariable, setWithVariable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstChoice = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) firstChoice.current?.focus();
  }, [autoFocus]);

  const canUseX = kind === "add" || kind === "subtract";
  const amount = parseAmount(amountText);
  const sentence =
    kind && amount !== null ? describeOperation(operation(kind, amount, withVariable && canUseX), lang) : t.solver.picker.choose;

  function chooseKind(next: OperationKind) {
    setKind(next);
    setError(null);
    if (next === "multiply" || next === "divide") setWithVariable(false);
  }

  function bump(delta: number) {
    const base = amount ?? 0;
    const next = Math.max(-MAX_AMOUNT, Math.min(MAX_AMOUNT, base + delta));
    setAmountText(String(next));
    setError(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!kind) {
      setError(t.solver.picker.chooseKind);
      return;
    }
    if (amount === null) {
      setError(t.solver.picker.wholeNumber(MAX_AMOUNT));
      return;
    }
    setError(null);
    onApply(operation(kind, amount, withVariable && canUseX));
  }

  return (
    <form className="picker" onSubmit={submit} noValidate>
      <fieldset className="picker-kinds">
        <legend>{t.solver.picker.legend}</legend>
        <div className="picker-kind-grid">
          {KINDS.map((kindId, index) => (
            <label className="picker-kind" key={kindId}>
              <input
                ref={index === 0 ? firstChoice : undefined}
                type="radio"
                name={name}
                value={kindId}
                checked={kind === kindId}
                onChange={() => chooseKind(kindId)}
              />
              <span className="picker-symbol" aria-hidden="true">
                {operatorSymbol(operation(kindId, 1), lang)}
              </span>
              <span className="picker-kind-label">{words.kindNames[kindId]}</span>
              <Check className="picker-check" size={16} strokeWidth={3} aria-hidden="true" />
            </label>
          ))}
        </div>
      </fieldset>

      <div className="picker-amount">
        <label htmlFor={amountId}>{t.solver.picker.amount}</label>
        <div className="picker-amount-row">
          <button type="button" className="picker-step" onClick={() => bump(-1)} aria-label={t.solver.picker.decrease}>
            <Minus size={18} />
          </button>
          <input
            id={amountId}
            className="picker-input"
            type="number"
            step={1}
            min={-MAX_AMOUNT}
            max={MAX_AMOUNT}
            value={amountText}
            placeholder="0"
            onChange={(event) => {
              setAmountText(event.target.value);
              setError(null);
            }}
            aria-invalid={error !== null && amount === null}
            aria-describedby={error ? errorId : undefined}
          />
          <button type="button" className="picker-step" onClick={() => bump(1)} aria-label={t.solver.picker.increase}>
            <Plus size={18} />
          </button>
          {canUseX && (
            <button
              type="button"
              className="picker-x"
              aria-pressed={withVariable}
              onClick={() => setWithVariable((on) => !on)}
              title={t.solver.picker.xTitle}
            >
              <span aria-hidden="true">x</span>
              <span className="sr-only">{t.solver.picker.xState(withVariable)}</span>
            </button>
          )}
        </div>
        {canUseX && <p className="picker-note">{t.solver.picker.xNote}</p>}
      </div>

      <p className="picker-sentence" aria-live="polite">
        {sentence}
      </p>
      {error && (
        <p className="picker-error" id={errorId} role="alert">
          {error}
        </p>
      )}

      <div className="picker-actions">
        <button type="submit" className="button-primary">
          {t.solver.picker.apply}
        </button>
        {extra}
      </div>
    </form>
  );
}
