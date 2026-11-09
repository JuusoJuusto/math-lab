"use client";

import { forwardRef } from "react";
import { CircleCheck, CircleX, ScanSearch } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
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
  const { lang, t } = useI18n();
  const answer = formatFraction(value);

  if (!checked) {
    const text = t.solver.verify.text(answer);
    return (
      <section className="verify" aria-label={t.solver.verify.region}>
        <div className="verify-head">
          <ScanSearch size={22} aria-hidden="true" />
          <h2>{t.solver.verify.head(answer)}</h2>
        </div>
        <p className="verify-text">
          {text.before}
          <strong>{text.strong}</strong>
          {text.after}
        </p>
        <button type="button" className="button-primary" onClick={onCheck} ref={checkButtonRef}>
          {t.solver.verify.button}
        </button>
      </section>
    );
  }

  const result = checkSolution(original, value, lang);
  const Icon = result.holds ? CircleCheck : CircleX;

  return (
    <section className={`verify verify-done ${result.holds ? "verify-pass" : "verify-fail"}`} aria-label={t.solver.verify.done}>
      <div className="verify-head">
        <Icon size={22} aria-hidden="true" />
        <h2>{result.holds ? t.solver.verify.pass(answer) : t.solver.verify.fail(answer)}</h2>
      </div>
      <ol className="verify-lines">
        {result.lines.map((line, index) => (
          <li key={index}>
            <span className="verify-label">{line.label}</span>
            <code className="verify-equation">{line.text}</code>
          </li>
        ))}
      </ol>
      <p className="verify-verdict">{result.holds ? t.solver.verify.verdictTrue : t.solver.verify.verdictFalse}</p>
      <p className="verify-text">
        {result.holds
          ? t.solver.verify.passText(formatFraction(result.leftValue), formatFraction(result.rightValue))
          : t.solver.verify.failText}
      </p>
    </section>
  );
});
