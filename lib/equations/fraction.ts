/**
 * Exact rational arithmetic.
 *
 * Every number in the equation engine is a `Fraction` made of two safe
 * integers. This removes floating-point display errors such as
 * `0.1 + 0.2 = 0.30000000000000004` and makes equality checks exact.
 *
 * Fractions are always stored in lowest terms with a positive denominator, so
 * two fractions are equal exactly when their parts are equal.
 */

export interface Fraction {
  /** Numerator. Carries the sign. */
  readonly n: number;
  /** Denominator. Always a positive integer. */
  readonly d: number;
}

/**
 * Largest absolute value allowed for a numerator or denominator.
 *
 * Keeping parts at or below one million guarantees that the products formed
 * while adding or multiplying two fractions (at most about 2 * 10^12) stay far
 * inside the safe-integer range, so no intermediate result can lose precision.
 */
export const FRACTION_LIMIT = 1_000_000;

/** Raised when a value would grow beyond what the engine can represent exactly. */
export class FractionRangeError extends RangeError {
  constructor() {
    super("That number is too large to work with.");
    this.name = "FractionRangeError";
  }
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export const ZERO: Fraction = { n: 0, d: 1 };
export const ONE: Fraction = { n: 1, d: 1 };
export const MINUS_ONE: Fraction = { n: -1, d: 1 };

/**
 * Creates a fraction in lowest terms.
 *
 * @throws TypeError when a part is not an integer.
 * @throws RangeError when the denominator is zero.
 * @throws FractionRangeError when the reduced value exceeds {@link FRACTION_LIMIT}.
 */
export function frac(numerator: number, denominator = 1): Fraction {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new TypeError("Fractions are built from whole numbers.");
  }
  if (denominator === 0) {
    throw new RangeError("The denominator of a fraction cannot be zero.");
  }
  if (numerator === 0) return ZERO;

  const divisor = gcd(numerator, denominator);
  const sign = denominator < 0 ? -1 : 1;
  const n = (sign * numerator) / divisor;
  const d = (sign * denominator) / divisor;

  if (Math.abs(n) > FRACTION_LIMIT || d > FRACTION_LIMIT) {
    throw new FractionRangeError();
  }
  return { n, d };
}

export function add(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Fraction, b: Fraction): Fraction {
  return frac(a.n * b.n, a.d * b.d);
}

/** @throws RangeError when dividing by zero. */
export function div(a: Fraction, b: Fraction): Fraction {
  if (isZero(b)) {
    throw new RangeError("Division by zero is undefined.");
  }
  return frac(a.n * b.d, a.d * b.n);
}

export function neg(a: Fraction): Fraction {
  return a.n === 0 ? ZERO : { n: -a.n, d: a.d };
}

export function abs(a: Fraction): Fraction {
  return a.n < 0 ? neg(a) : a;
}

export function isZero(a: Fraction): boolean {
  return a.n === 0;
}

export function isOne(a: Fraction): boolean {
  return a.n === 1 && a.d === 1;
}

export function isInteger(a: Fraction): boolean {
  return a.d === 1;
}

/** True for values such as 1/3 or -1/4, which read naturally as "x divided by 3". */
export function isUnitFraction(a: Fraction): boolean {
  return Math.abs(a.n) === 1 && a.d > 1;
}

export function equals(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d;
}

/** Returns -1, 0 or 1. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const difference = a.n * b.d - b.n * a.d;
  return difference < 0 ? -1 : difference > 0 ? 1 : 0;
}

export function sign(a: Fraction): -1 | 0 | 1 {
  return a.n < 0 ? -1 : a.n > 0 ? 1 : 0;
}

export function isNegative(a: Fraction): boolean {
  return a.n < 0;
}

/** Approximate value for display-free checks such as tests. Never used for equality. */
export function toNumber(a: Fraction): number {
  return a.n / a.d;
}
