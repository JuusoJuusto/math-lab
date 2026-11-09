import type { ReactNode } from "react";
import { isInteger, isNegative, isZero, solveEquation, type Equation, type Fraction } from "@/lib/equations";

/**
 * The balance picture (vaaka) that Finnish textbooks use for equations: balls
 * marked x and weights marked with a number sit on two pans. An equation is
 * a scale that is in balance, and doing the same to both sides keeps it so.
 *
 * It is a picture of the same equation shown above it, so it is hidden from
 * screen readers. It is only drawn when it can be honest: every term must be a
 * whole number that is not negative (a scale cannot hold "minus 3 weights").
 */

const MAX_BALLS = 4;
const BALL = 13;
const SIDE_WIDTH = 140;

interface Pan {
  readonly balls: number;
  readonly weight: number;
}

/** The two pans of an equation, or `null` when it cannot be drawn as a scale. */
export function pansOf(eq: Equation): { left: Pan; right: Pan } | null {
  const terms: Fraction[] = [eq.left.x, eq.left.c, eq.right.x, eq.right.c];
  if (terms.some((term) => !isInteger(term) || isNegative(term) || term.n > 999)) return null;
  // A scale is in balance. An equation that is never true (2x + 3 = 2x + 7) cannot be pictured as one.
  if (solveEquation(eq).kind === "none") return null;
  const pan = (x: Fraction, c: Fraction): Pan => ({ balls: x.n, weight: c.n });
  const left = pan(eq.left.x, eq.left.c);
  const right = pan(eq.right.x, eq.right.c);
  if (left.balls + left.weight === 0 || right.balls + right.weight === 0) return null;
  return { left, right };
}

function Contents({ pan, centre }: { pan: Pan; centre: number }) {
  const shown = Math.min(pan.balls, MAX_BALLS);
  const crowded = pan.balls > MAX_BALLS;
  const rowWidth = shown * (BALL * 2 + 2);
  const items: ReactNode[] = [];
  const top = 86;

  for (let i = 0; i < shown; i += 1) {
    const cx = centre - rowWidth / 2 + BALL + i * (BALL * 2 + 2);
    items.push(
      <g key={`ball-${i}`} className="scale-ball">
        <circle cx={cx} cy={top - BALL} r={BALL} />
        <text x={cx} y={top - BALL + 4.5} textAnchor="middle">
          x
        </text>
      </g>,
    );
  }
  if (crowded) {
    items.push(
      <text key="times" className="scale-times" x={centre + rowWidth / 2 + 4} y={top - BALL + 5}>
        {`×${pan.balls}`}
      </text>,
    );
  }
  if (pan.weight > 0) {
    const label = String(pan.weight);
    const width = Math.max(30, 12 + label.length * 9);
    const base = shown > 0 ? top - BALL * 2 : top;
    items.push(
      <g key="weight" className="scale-weight">
        <rect x={centre - width / 2} y={base - 28} width={width} height={28} rx={5} />
        <text x={centre} y={base - 9} textAnchor="middle">
          {label}
        </text>
      </g>,
    );
  }
  return <>{items}</>;
}

export function BalanceScale({ equation }: { equation: Equation }) {
  const pans = pansOf(equation);
  if (!pans) return null;
  if (isZero(equation.left.x) && isZero(equation.right.x) && isZero(equation.left.c) && isZero(equation.right.c)) return null;

  const leftCentre = 20 + SIDE_WIDTH / 2;
  const rightCentre = 340 - 20 - SIDE_WIDTH / 2;

  return (
    <svg className="balance-scale" viewBox="0 0 340 118" aria-hidden="true" focusable="false" data-testid="balance-scale">
      <rect className="scale-pan" x={20} y={86} width={SIDE_WIDTH} height={7} rx={3.5} />
      <rect className="scale-pan" x={340 - 20 - SIDE_WIDTH} y={86} width={SIDE_WIDTH} height={7} rx={3.5} />
      <path className="scale-stand" d="M170 93 L150 114 H190 Z" />
      <rect className="scale-beam" x={20} y={91} width={300} height={5} rx={2.5} />
      <Contents pan={pans.left} centre={leftCentre} />
      <Contents pan={pans.right} centre={rightCentre} />
    </svg>
  );
}
