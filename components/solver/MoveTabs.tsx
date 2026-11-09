"use client";

import { useId, type ReactNode } from "react";
import { ArrowLeftRight, Scale, Target, Undo2 } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { engineText } from "@/lib/equations";

export type MoveMode = "balance" | "flip" | "chain" | "guess";

interface MoveTabsProps {
  mode: MoveMode;
  onChange: (mode: MoveMode) => void;
  /** Whether "work backwards" is offered: x must appear once, on one side. */
  canChain?: boolean;
  /** Whether "guess and check" is offered: the equation needs exactly one solution. */
  canGuess?: boolean;
  /** Controls shown at the end of the row, such as the hint button. */
  children?: ReactNode;
}

/**
 * The ways to move: do the same to both sides, flip a term across the equals
 * sign, work backwards, or guess and check. Native radio buttons, so arrow keys and screen readers work.
 */
export function MoveTabs({ mode, onChange, canChain = false, canGuess = false, children }: MoveTabsProps) {
  const { lang, t } = useI18n();
  const name = useId();
  const names = engineText(lang).modeNames;

  const options: readonly { id: MoveMode; label: string; description: string; icon: ReactNode }[] = [
    { id: "balance", label: names.balance, description: t.solver.moveBalance, icon: <Scale size={18} aria-hidden="true" /> },
    { id: "flip", label: names.flip, description: t.solver.moveFlip, icon: <ArrowLeftRight size={18} aria-hidden="true" /> },
    ...(canChain ? [{ id: "chain" as const, label: names.chain, description: t.solver.moveChain, icon: <Undo2 size={18} aria-hidden="true" /> }] : []),
    ...(canGuess ? [{ id: "guess" as const, label: names.guess, description: t.solver.moveGuess, icon: <Target size={18} aria-hidden="true" /> }] : []),
  ];

  return (
    <fieldset className="move-tabs">
      <legend className="move-title">{t.solver.moveHow}</legend>
      <div className="move-options">
        {options.map((option) => (
          <label className="move-option" key={option.id} title={option.description}>
            <input type="radio" name={name} value={option.id} checked={mode === option.id} onChange={() => onChange(option.id)} />
            <span className="move-face">
              {option.icon}
              <span>{option.label}</span>
            </span>
            <span className="sr-only">{option.description}</span>
          </label>
        ))}
      </div>
      <p className="move-hint" aria-live="polite">
        {options.find((option) => option.id === mode)?.description}
      </p>
      {children}
    </fieldset>
  );
}
