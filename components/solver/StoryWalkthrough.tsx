"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { formatEquation, mustParseEquation, type LevelDefinition } from "@/lib/equations";
import { answerFrame, explainBuild, type Story } from "@/lib/tasks";
import { MathLine } from "@/components/ui/MathLine";
import { StoryCard } from "./StoryCard";
import { WorkedExample } from "./WorkedExample";

interface StoryWalkthroughProps {
  level: LevelDefinition;
  story: Story;
  /** Called when the learner is ready to try it themselves. */
  onPractise: () => void;
}

/**
 * How a story becomes an equation, in the six steps a textbook gives, one at a time: read it, say what x is,
 * find what is equal to what, write the equation, solve it, answer in a sentence.
 *
 * Each step stays on the screen when the next arrives, so the whole way from the words to the answer can be
 * seen at once. The fifth step is the same worked example as everywhere else, with the tutor solving.
 */
export function StoryWalkthrough({ level, story, onPractise }: StoryWalkthroughProps) {
  const { lang, t } = useI18n();
  const walk = t.word.walk;
  const words = story.i18n[lang];
  const equation = mustParseEquation(story.equations[0]);
  const [step, setStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  // A new step is announced by moving to its heading, so that keyboard and screen-reader users arrive with it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [step]);

  const frame = answerFrame(words.answer, story.final ?? story.solution);
  const explanation = explainBuild(words.build, story.equations[0]) ?? words.build;

  const bodies = [
    <StoryCard key="read" story={story} hideX />,
    <p key="x" className="walk-x">
      <strong>{words.letX}</strong>
    </p>,
    <p key="equal" className="walk-text">
      <strong>{walk.equalWhat}</strong> {explanation}
    </p>,
    <div key="write" className="walk-equation">
      <MathLine text={formatEquation(equation)} />
    </div>,
    <WorkedExample key="solve" level={level} onPractise={() => setStep(5)} continueLabel={walk.next} showSkip={false} />,
    <div key="answer" className="walk-answer">
      <p className="answer-sentence">
        {frame ? (
          <>
            {frame.before}
            <mark>{String(story.final ?? story.solution)}</mark>
            {frame.after}
          </>
        ) : (
          words.answer
        )}
      </p>
      <p className="walk-text">{walk.checkStory}</p>
      <button type="button" className="button-primary" onClick={onPractise}>
        {t.solver.example.tryIt} <ArrowRight size={17} aria-hidden="true" />
      </button>
    </div>,
  ];

  return (
    <section className="walk" aria-labelledby="walk-title">
      <h3 className="walk-title" id="walk-title">
        {walk.title}
      </h3>
      <p className="walk-intro">{walk.intro}</p>

      <ol className="walk-steps">
        {walk.steps.slice(0, step + 1).map((label, index) => {
          const current = index === step;
          return (
            <li key={label} className={current ? "walk-step walk-step-current" : "walk-step walk-step-done"} aria-current={current ? "step" : undefined}>
              <h4 className="walk-step-head" tabIndex={-1} ref={current ? heading : undefined}>
                <span className="walk-badge" aria-hidden="true">
                  {current ? index + 1 : <Check size={15} />}
                </span>
                {label}
              </h4>
              <div className="walk-body">{bodies[index]}</div>
              {current && index < 4 && (
                <button type="button" className="button-primary walk-next" onClick={() => setStep(index + 1)}>
                  {walk.next} <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {step < 5 && (
        <button type="button" className="text-link walk-skip" onClick={onPractise}>
          {t.solver.example.skip}
        </button>
      )}
    </section>
  );
}
