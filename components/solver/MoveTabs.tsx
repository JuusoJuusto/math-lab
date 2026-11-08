"use client";

import { useId, type ReactNode } from "react";
import { ArrowLeftRight, Scale } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { engineText } from "@/lib/equations";

export type MoveMode = "balance" | "flip";

interface MoveTabsProps {
  mode: MoveMode;
  onChange: (mode: MoveMode) => void;
  /** Controls shown at the end of the row, such as the hint button. */
  children?: ReactNode;
}

/**
 * The two ways to move: do the same to both sides, or flip a term across the
 * equals sign. Native radio buttons, so arrow keys and screen readers work.
 */
export function MoveTabs({ mode, onChange, children }: MoveTabsProps) {
  const { lang, t } = useI18n();
  const name = useId();
  const names = engineText(lang).modeNames;

  const options: readonly { id: MoveMode; label: string; description: string; icon: ReactNode }[] = [
    { id: "balance", label: names.balance, description: t.solver.moveBalance, icon: <Scale size={18} aria-hidden="true" /> },
    { id: "flip", label: names.flip, description: t.solver.moveFlip, icon: <ArrowLeftRight size={18} aria-hidden="true" /> },
  ];

  return (
    <fieldset className="move-tabs">
      <legend className="sr-only">{t.solver.moveHow}</legend>
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
      {children}
    </fieldset>
  );
}
