"use client";

import { ArrowRight, ArrowLeftRight, Lightbulb } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  flipTerms,
  levelText,
  mustParseEquation,
  operationsEqual,
  solveWithTutor,
  type LevelDefinition,
} from "@/lib/equations";
import { EquationDisplay } from "./EquationDisplay";

interface LevelIntroProps {
  level: LevelDefinition;
  onNext: () => void;
  onSkip: () => void;
}

/**
 * A short introduction: the idea in three points, the balance rule shown on a
 * real equation, and the same first step again as a flip.
 */
export function LevelIntro({ level, onNext, onSkip }: LevelIntroProps) {
  const { lang, t } = useI18n();
  const text = levelText(level, lang);
  const equation = mustParseEquation(level.example.equation);
  const [firstStep] = solveWithTutor(equation);

  // The flip that does the same as the first step, so the two ways can be compared.
  const { left, right } = flipTerms(equation, lang);
  const flip = firstStep ? [...left, ...right].find((term) => term.target && term.operation && operationsEqual(term.operation, firstStep.operation)) : undefined;

  return (
    <section className="intro" aria-labelledby="intro-heading">
      <div className="intro-copy">
        <h2 id="intro-heading" className="intro-heading">
          {t.solver.intro.heading}
        </h2>
        <p className="intro-lead">{text.intro.lead}</p>
        <ol className="lesson-list">
          {text.intro.points.map((point, index) => (
            <li key={point}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{point}</p>
            </li>
          ))}
        </ol>
        <div className="example-box">
          <div className="example-label">
            <Lightbulb size={16} aria-hidden="true" /> {t.solver.intro.remember}
          </div>
          <p>{text.intro.keyIdea}</p>
        </div>
      </div>

      <div className="intro-demo">
        {firstStep && <EquationDisplay equation={firstStep.before} applied={firstStep.operation} label={t.solver.display.example} />}
        <p className="intro-demo-note">{t.solver.intro.demoNote}</p>

        {firstStep && flip?.target && (
          <div className="intro-flip">
            <h3 className="intro-flip-title">
              <ArrowLeftRight size={18} aria-hidden="true" /> {t.solver.intro.flipHeading}
            </h3>
            <EquationDisplay equation={firstStep.before} flipped={flip.target} label={t.solver.display.example} />
            <p className="intro-demo-note">{t.solver.intro.flipText(flip.text, flip.becomes)}</p>
          </div>
        )}
      </div>

      <div className="action-buttons intro-actions">
        <button type="button" className="button-primary" onClick={onNext}>
          {t.solver.intro.seeExample} <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button type="button" className="text-link" onClick={onSkip}>
          {t.solver.intro.skip}
        </button>
      </div>
    </section>
  );
}
