import type { CSSProperties } from "react";
import { Check } from "lucide-react";
import {
  formatAppliedEquation,
  formatEquation,
  sideTokens,
  toSpeech,
  type Equation,
  type Operation,
  type Token,
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

const OPERATOR_TEXTS = new Set(["+", "−", "×", "÷"]);

/** Groups neighbouring tokens so the learner's operation reads as one highlighted unit. */
function groupByApplied(tokens: readonly Token[]): { applied: boolean; tokens: Token[] }[] {
  const groups: { applied: boolean; tokens: Token[] }[] = [];
  for (const token of tokens) {
    const applied = Boolean(token.applied);
    const last = groups[groups.length - 1];
    if (last && last.applied === applied) last.tokens.push(token);
    else groups.push({ applied, tokens: [token] });
  }
  return groups;
}

function TokenView({ token }: { token: Token }) {
  if (token.denominator) {
    return (
      <span className="eq-term">
        {token.prefix}
        <span className="eq-frac">
          <span className="eq-frac-top">{token.text}</span>
          <span className="eq-frac-bottom">{token.denominator}</span>
        </span>
      </span>
    );
  }
  if (token.text === "(") return <span className="eq-paren eq-paren-open">(</span>;
  if (token.text === ")") return <span className="eq-paren eq-paren-close">)</span>;
  if (OPERATOR_TEXTS.has(token.text) && !token.prefix) return <span className="eq-op">{token.text}</span>;
  return (
    <span className="eq-term">
      {token.prefix}
      {token.text}
    </span>
  );
}

function SideView({ tokens, side }: { tokens: readonly Token[]; side: "left" | "right" }) {
  return (
    <span className={`eq-side eq-side-${side}`}>
      {groupByApplied(tokens).map((group, index) =>
        group.applied ? (
          <span className="eq-applied" key={index}>
            {group.tokens.map((token, i) => (
              <TokenView token={token} key={i} />
            ))}
          </span>
        ) : (
          group.tokens.map((token, i) => <TokenView token={token} key={`${index}-${i}`} />)
        ),
      )}
    </span>
  );
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
