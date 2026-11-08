import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { SideView } from "./EquationParts";
import {
  formatAppliedEquation,
  formatEquation,
  sideTokens,
  toSpeech,
  type Equation,
  type Operation,
} from "@/lib/equations";

interface EquationDisplayProps {
  equation: Equation;
  /**
   * When set, the equation is shown with this operation written on both sides
   * but not yet simplified, for example `2x + 5 − 5 = 17 − 5`.
   */
  applied?: Operation | null;
  /** Short caption above the equation. Also used in the accessible name. */
  label?: string;
  /** Highlights the equation as finished. */
  solved?: boolean;
}

/**
 * The large, central equation. Left and right sides are drawn as two matching
 * panels joined by an equals sign, and an operation that is being applied is
 * highlighted in the same colour on both, so "do the same to both sides" is
 * something the learner can literally see.
 */
export function EquationDisplay({ equation, applied = null, label = "Current equation", solved = false }: EquationDisplayProps) {
  const text = applied ? formatAppliedEquation(equation, applied) : formatEquation(equation);

  return (
    <section
      className={`eq ${solved ? "eq-solved" : ""} ${applied ? "eq-applying" : ""}`}
      aria-label={label}
      // The stylesheet turns this into a font size that fits the card's own width, so long
      // equations shrink instead of wrapping, wherever the card is placed.
      style={{ "--eq-chars": text.length } as CSSProperties}
    >
      <div className="eq-caption" aria-hidden="true">
        {applied ? "Same operation on both sides" : label}
        {solved && (
          <span className="eq-badge">
            <Check size={14} /> Solved
          </span>
        )}
      </div>
      <p className="sr-only">{`${label}: ${toSpeech(text)}`}</p>
      <div className="eq-row" aria-hidden="true">
        <SideView tokens={sideTokens(equation.left, applied ?? undefined)} side="left" />
        <span className="eq-sign">=</span>
        <SideView tokens={sideTokens(equation.right, applied ?? undefined)} side="right" />
      </div>
    </section>
  );
}
