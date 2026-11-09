/**
 * Taking a story's own words apart, so the learner can do what the story only used to tell them.
 *
 * Every story says how its equation is built (`build`: "The start fee is added once, and €2 is paid for each
 * kilometre: 2x + 3 = 15.") and ends with the answer as a sentence (`answer`: "The ride was 6 km long.").
 * Shown whole, they give the equation and the answer away. Taken apart, the first becomes a hint that stops
 * short of the equation, and the second becomes a sentence with a gap for the number, which the learner fills.
 */

/** The characters an equation is made of; letters other than x are not among them, so a word ends the run. */
const MATH = /[0-9x+\-−×·÷()/.,\s]/;

/** Words that lead into the equation ("..., so x + 2 = 5"), which are not part of an explanation on their own. */
const LEAD_IN = /(?:[,:;]\s*)?\b(?:so|when|then|thus|therefore|joten|kun|siis|eli)\s*[,:;]?\s*$|[,:;]\s*$/i;

/** Left and right side of an equation written as text, without spaces, for comparing. */
const compact = (text: string) => text.replace(/[\s]/g, "").replace(/[−–]/g, "-").replace(/,/g, ".");

/**
 * How the equation is built, without the equation: the words in front of it, ending with a full stop.
 *
 * Pass the story's equation too, and a text that already says both sides of it is refused: that would not be
 * a hint but the answer. `null` when there is nothing to show, so that a caller never shows half a sentence.
 */
export function explainBuild(build: string, equation?: string): string | null {
  const equals = build.lastIndexOf("=");
  if (equals <= 0) return null;

  // The equation starts where the run of maths in front of its "=" starts.
  let start = equals;
  while (start > 0 && MATH.test(build[start - 1])) start -= 1;
  // The run takes in the spaces and punctuation that follow the words before it; they are not part of the equation.
  const head = build.slice(0, start).replace(LEAD_IN, "").trim();
  if (head === "" || head.includes("=") || head.length < 12) return null;

  if (equation) {
    const [left, right] = equation.split("=").map(compact);
    const text = compact(head);
    // A side is given away when it is said whole. A single digit ("4") is just a number from the story, not a side.
    const said = (side: string) => side.length >= 2 && text.includes(side);
    if (said(left) && said(right)) return null;
  }
  return `${head.replace(/[.!]+$/, "")}.`;
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The answer sentence with a gap where the number goes: "The ride was ", " km long." for 6.
 * `null` when the number cannot be found on its own in the sentence (not as part of another number).
 */
export function answerFrame(answer: string, value: number): { before: string; after: string } | null {
  const digits = escape(String(Math.abs(value)));
  // A number is on its own when no digit touches it and it is not the start of a decimal ("6.5"); a full stop
  // after it is the end of the sentence. No look-behind: older phones' browsers cannot read a pattern that has one.
  const found = new RegExp(`(^|[^\\d.,])([−-]?${digits})(?!\\d|[.,]\\d)`).exec(answer);
  if (!found) return null;
  const start = found.index + found[1].length;
  return { before: answer.slice(0, start), after: answer.slice(start + found[2].length) };
}
