"use client";

import { useMemo } from "react";
import { Shuffle } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { formatBar, formatEquation, waysToSolve, type Equation } from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";

interface OtherWayProps {
  /** The equation the example started with. */
  equation: Equation;
}

/**
 * The same equation solved in a different order ("Tapa 2"). Textbooks show
 * this so learners see that the order of the steps is a choice, and that the
 * answer does not depend on it. The route is computed by the engine.
 */
export function OtherWay({ equation }: OtherWayProps) {
  const { lang, t } = useI18n();
  const way = useMemo(() => waysToSolve(equation)[1] ?? null, [equation]);
  if (!way) return null;

  const last = way.steps[way.steps.length - 1];
  return (
    <section className="other-way" aria-label={t.solver.otherWay.title}>
      <div className="verify-head">
        <Shuffle size={22} aria-hidden="true" />
        <h2>{t.solver.otherWay.title}</h2>
      </div>
      <p className="verify-text">{t.solver.otherWay.text}</p>
      <ol className="other-way-steps">
        {way.steps.map((step, index) => (
          <li key={index}>
            <MathLine text={formatEquation(step.before)} />
            <span className="history-bar">{formatBar(step.operation, lang)}</span>
          </li>
        ))}
        <li>
          <MathLine text={formatEquation(last.after)} />
        </li>
      </ol>
    </section>
  );
}
