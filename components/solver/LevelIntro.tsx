import { ArrowRight, Lightbulb } from "lucide-react";
import { mustParseEquation, solveWithTutor, type LevelDefinition } from "@/lib/equations";
import { EquationDisplay } from "./EquationDisplay";

interface LevelIntroProps {
  level: LevelDefinition;
  onNext: () => void;
  onSkip: () => void;
}

/** A short introduction: the idea in three points, and the balance rule shown on a real equation. */
export function LevelIntro({ level, onNext, onSkip }: LevelIntroProps) {
  const [firstStep] = solveWithTutor(mustParseEquation(level.example.equation));

  return (
    <section className="intro" aria-labelledby="intro-heading">
      <div className="intro-copy">
        <h2 id="intro-heading" className="intro-heading">
          The big idea
        </h2>
        <p className="intro-lead">{level.intro.lead}</p>
        <ol className="lesson-list">
          {level.intro.points.map((point, index) => (
            <li key={point}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{point}</p>
            </li>
          ))}
        </ol>
        <div className="example-box">
          <div className="example-label">
            <Lightbulb size={16} aria-hidden="true" /> REMEMBER
          </div>
          <p>{level.intro.keyIdea}</p>
        </div>
      </div>

      <div className="intro-demo">
        {firstStep && <EquationDisplay equation={firstStep.before} applied={firstStep.operation} label="Example" />}
        <p className="intro-demo-note">The highlighted part is the same on both sides. That is what keeps the equation balanced.</p>
      </div>

      <div className="action-buttons intro-actions">
        <button type="button" className="button-primary" onClick={onNext}>
          See a worked example <ArrowRight size={17} aria-hidden="true" />
        </button>
        <button type="button" className="text-link" onClick={onSkip}>
          Skip to practice
        </button>
      </div>
    </section>
  );
}
