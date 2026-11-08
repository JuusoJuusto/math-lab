"use client";

import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import { SideView, TokenView } from "./EquationParts";
import { useI18n } from "@/hooks/useLang";
import {
  flipPreview,
  flipTerms,
  formatAppliedEquation,
  formatBar,
  formatEquation,
  sideTokens,
  tokensToText,
  toSpeech,
  type Equation,
  type FlipTarget,
  type FlipTerm,
  type Operation,
} from "@/lib/equations";

interface EquationDisplayProps {
  equation: Equation;
  /**
   * When set, the equation is shown with this operation written on both sides
   * but not yet simplified, for example `2x + 5 − 5 = 17 − 5`.
   */
  applied?: Operation | null;
  /**
   * When set, a term has been flipped across the equals sign but not yet worked
   * out, for example `2x = 17 − 5`. Takes the place of `applied` in the picture.
   */
  flipped?: FlipTarget | null;
  /** When set, the terms are buttons: tapping one flips it across the equals sign. */
  onFlip?: (target: FlipTarget) => void;
  /** Short caption above the equation. Also used in the accessible name. */
  label?: string;
  /** Highlights the equation as finished. */
  solved?: boolean;
}

function FlipSide({ terms, side, onFlip }: { terms: readonly FlipTerm[]; side: "left" | "right"; onFlip: (target: FlipTarget) => void }) {
  const { t } = useI18n();
  return (
    <span className={`eq-side eq-side-${side}`}>
      {terms.length === 0 && <span className="eq-term">0</span>}
      {terms.map((term, index) => {
        const target = term.target;
        if (!target) {
          return (
            <span className="eq-static" key={index}>
              {term.tokens.map((token, i) => (
                <TokenView token={token} key={i} />
              ))}
            </span>
          );
        }
        const label = target.kind === "factor" ? t.solver.flipFactor(term.text, term.becomes) : t.solver.flipTerm(term.text, term.becomes);
        return (
          <button type="button" className="eq-flip" key={index} aria-label={label} title={label} onClick={() => onFlip(target)}>
            {term.tokens.map((token, i) => (
              <TokenView token={token} key={i} />
            ))}
          </button>
        );
      })}
    </span>
  );
}

/**
 * The large, central equation. Left and right sides are drawn as two matching
 * panels joined by an equals sign, and an operation that is being applied is
 * highlighted in the same colour on both, so "do the same to both sides" is
 * something the learner can literally see.
 *
 * In flip mode the terms are buttons. A flipped term is highlighted where it
 * landed, and the operation it stands for is written beside the equation the
 * way it is in a notebook: `| + 5`.
 */
export function EquationDisplay({ equation, applied = null, flipped = null, onFlip, label, solved = false }: EquationDisplayProps) {
  const { lang, t } = useI18n();
  const name = label ?? t.solver.display.current;
  const preview = flipped ? flipPreview(equation, flipped, lang) : null;
  const text = preview
    ? `${tokensToText(preview.left)} = ${tokensToText(preview.right)}`
    : applied
      ? formatAppliedEquation(equation, applied, lang)
      : formatEquation(equation);
  const bar = applied ? formatBar(applied, lang) : null;
  const interactive = Boolean(onFlip) && !applied && !preview;
  const terms = interactive ? flipTerms(equation, lang) : null;
  const caption = preview ? t.solver.display.flipped : applied ? t.solver.display.sameOperation : name;

  return (
    <section
      className={`eq ${solved ? "eq-solved" : ""} ${applied || preview ? "eq-applying" : ""} ${interactive ? "eq-flippable" : ""}`}
      aria-label={name}
      // The stylesheet turns this into a font size that fits the card's own width, so long
      // equations shrink instead of wrapping, wherever the card is placed.
      style={{ "--eq-chars": text.length + (bar ? bar.length + 2 : 0) } as CSSProperties}
    >
      <div className="eq-caption" aria-hidden="true">
        {caption}
        {solved && (
          <span className="eq-badge">
            <Check size={14} /> {t.solver.display.solved}
          </span>
        )}
      </div>
      <p className="sr-only">{`${name}: ${toSpeech(text, lang)}`}</p>
      {terms && onFlip ? (
        <div className="eq-row">
          <FlipSide terms={terms.left} side="left" onFlip={onFlip} />
          <span className="eq-sign" aria-hidden="true">
            =
          </span>
          <FlipSide terms={terms.right} side="right" onFlip={onFlip} />
        </div>
      ) : (
        <div className="eq-row" aria-hidden="true">
          <SideView tokens={preview ? preview.left : sideTokens(equation.left, applied ?? undefined, lang)} side="left" />
          <span className="eq-sign">=</span>
          <SideView tokens={preview ? preview.right : sideTokens(equation.right, applied ?? undefined, lang)} side="right" />
          {bar && <span className="eq-bar">{bar}</span>}
        </div>
      )}
    </section>
  );
}
