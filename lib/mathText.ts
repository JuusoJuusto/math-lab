/**
 * Keeps an expression in one piece when a sentence wraps on a narrow screen.
 *
 * "In 2x + 5 = 17, x is..." would otherwise break after "2x" or before "=", which reads badly. The spaces
 * around a sign between two parts of an expression become non-breaking spaces, so 2x + 5 = 17 moves as one
 * word. Spaces between ordinary words are left alone, and so is everything that is not maths.
 *
 * (No look-behind: older phones' browsers cannot read a pattern that has one.)
 */
const AROUND_SIGN = /([\dx)]) ([+−=×÷·]) (?=[\dx(−])/g;
const AROUND_COLON = /(\d) : (?=\d)/g;

export function keepMathTogether(text: string): string {
  return text.replace(AROUND_SIGN, "$1 $2 ").replace(AROUND_COLON, "$1 : ");
}
