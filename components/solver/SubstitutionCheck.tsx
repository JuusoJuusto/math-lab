"use client";

import { forwardRef } from "react";
import { CircleCheck, CircleX, ScanSearch } from "lucide-react";
import { checkSolution, formatFraction, type Equation, type Fraction } from "@/lib/equations";

interface SubstitutionCheckProps {
  /** The equation the exercise started with. */
  original: Equation;
  /** The value of x the learner arrived at. */
  value: Fraction;
  checked: boolean;
  onCheck: () => void;
}

/**
 * Verification by substitution: put the answer back into the original
 * equation and see whether both sides really are equal.
 */
export const SubstitutionCheck = forwardRef<HTMLButtonElement, SubstitutionCheckProps>(function SubstitutionCheck(
  { original, value, checked, onCheck },
  checkButtonRef,
) {
  const answer = formatFraction(value);

  if (!checked) {
    return (
      <section className="verify" aria-label="Check your answer">
        <div className="verify-head">
          <ScanSearch size={22} aria-hidden="true" />
          <h2>Is x = {answer} really right?</h2>
        </div>
        <p className="verify-text">
          Put {answer} in place of x in the <strong>original</strong> equation. If both sides come out equal, the answer works.
        </p>
        <button type="button" className="button-primary" onClick={onCheck} ref={checkButtonRef}>
          Check by substituting
        </button>
      </section>
    );
  }

  const result = checkSolution(original, value);
  const Icon = result.holds ? CircleCheck : CircleX;

  return (
    <section className={`verify verify-done ${result.holds ? "verify-pass" : "verify-fail"}`} aria-label="Substitution check">
      <div className="verify-head">
        <Icon size={22} aria-hidden="true" />
        <h2>{result.holds ? `Both sides are equal, so x = ${answer} is correct!` : `The sides are different, so x = ${answer} is not a solution.`}</h2>
      </div>
      <ol className="verify-lines">
        {result.lines.map((line, index) => (
          <li key={index}>
            <span className="verify-label">{line.label}</span>
            <code className="verify-equation">{line.text}</code>
          </li>
        ))}
      </ol>
      <p className="verify-text">
        {result.holds
          ? `Left side: ${formatFraction(result.leftValue)}. Right side: ${formatFraction(result.rightValue)}. A solution is exactly a value that makes both sides equal, so this check proves the answer.`
          : "A solution must make both sides equal. Go back and look for the step where something went wrong."}
      </p>
    </section>
  );
});
