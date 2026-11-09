/**
 * Counting it yourself.
 *
 * Two questions the screens ask about what a learner wrote:
 *
 *  - Is it *worked out*? `2x + 5 − 5 = 17 − 5` is the right equation but nothing has been counted yet;
 *    `2x = 12` is. A side is worked out when it has at most one term with x and at most one number,
 *    and a fraction in it is in its simplest form.
 *  - Does the last line of a solution still need its number counted? `x = 6` is an answer; `x = 12 : 2`
 *    and `x = 6/4` are not yet: the number has to be worked out (and a fraction reduced) before it is one.
 *
 * Both only look at how it was written. Whether it is *right* is for the engine's own checks.
 */

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/** The text with no spaces, true minus signs as hyphens and a decimal point for a decimal comma. */
const compact = (text: string) => text.replace(/\s+/g, "").replace(/[−–]/g, "-").replace(/,/g, ".");

/** The line without a note written beside it (`|| − 5`). */
const beforeNote = (text: string) => (text.indexOf("||") === -1 ? text : text.slice(0, text.indexOf("||")));

/** `3/2` is in its simplest form; `6/4` and `4/2` and `3/1` are not. */
function simplestFraction(numerator: number, denominator: number): boolean {
  return denominator > 1 && gcd(numerator, denominator) === 1;
}

function numberTerm(body: string): boolean {
  if (/^\d+(\.\d+)?$/.test(body)) return true;
  const fraction = body.match(/^(\d+)\/(\d+)$/);
  return fraction !== null && simplestFraction(Number(fraction[1]), Number(fraction[2]));
}

function xTerm(body: string): boolean {
  const match = body.match(/^(\d+(?:\.\d+)?)?x(?:\/(\d+))?$/);
  if (!match) return false;
  const [, coefficient, denominator] = match;
  if (denominator === undefined) return true;
  // x/2 and 3x/4, but not 2x/4 (reduce it), 0.5x/2 (one way of writing the part is enough) or x/1.
  if (coefficient?.includes(".")) return false;
  return simplestFraction(Number(coefficient ?? 1), Number(denominator));
}

function sideWorkedOut(side: string): boolean {
  const text = compact(side);
  if (text === "" || /[()*×·:÷]/.test(text)) return false;
  const terms = text.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== text || terms.length > 2) return false;

  let withX = 0;
  let numbers = 0;
  for (const term of terms) {
    const body = term.replace(/^[+-]/, "");
    if (numberTerm(body)) numbers += 1;
    else if (xTerm(body)) withX += 1;
    else return false;
  }
  return withX <= 1 && numbers <= 1;
}

/**
 * True when both sides of the line are counted: `2x = 12`, `x/2 + 3 = 5`, `12 = 2x`. A note beside the
 * line is ignored. `2x = 17 − 5`, `2x + 3x = 10`, `3(x + 1) = 9` and `x = 12 : 2` are not.
 */
export function isWorkedOut(text: string): boolean {
  const sides = beforeNote(text).split("=");
  return sides.length === 2 && sideWorkedOut(sides[0]) && sideWorkedOut(sides[1]);
}

/**
 * True when the last line of a solution has x alone but the number beside it still has to be counted:
 * `x = 12 : 2`, `x = 17 − 5`, `x = 6/4`, `x = 4/2`. A plain number (`6`, `−2`, `0,5`, `3/2`) is an answer.
 */
export function needsWorkingOut(text: string): boolean {
  const sides = beforeNote(text).split("=");
  if (sides.length !== 2) return false;
  const side = sides.find((part) => !/x/i.test(part));
  if (side === undefined) return false;
  const number = compact(side);
  if (/^-?\d+(\.\d+)?$/.test(number)) return false;
  const fraction = number.match(/^-?(\d+)\/(\d+)$/);
  return !(fraction !== null && simplestFraction(Number(fraction[1]), Number(fraction[2])));
}
