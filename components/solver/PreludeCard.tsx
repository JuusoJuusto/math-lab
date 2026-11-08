"use client";

import { Check, X } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { preludeWords, type PreludeStep } from "@/lib/equations";
import { DistributeArrows } from "./DistributeArrows";

interface PreludeCardProps {
  step: PreludeStep;
  /** Options already tried and found wrong. */
  wrong: readonly number[];
  onChoose: (choice: number) => void;
}

/**
 * One clean-up question of an equation that is not yet in simple form: "Open
 * the brackets in 3(x − 2). What do you get?", with the answers a learner is
 * most likely to give. A wrong answer is explained and marked, and the learner
 * tries again.
 */
export function PreludeCard({ step, wrong, onChoose }: PreludeCardProps) {
  const { lang } = useI18n();
  const words = preludeWords(lang);
  // Non-breaking spaces keep an expression such as 2(x + 3) together when the question wraps on a narrow screen.
  const part = words.local(step.part).replace(/ /g, "\u00a0");
  const question = words.question(step, part);

  return (
    <section className="prelude" aria-label={words.stage(step)}>
      <h3 className="prelude-question">{question}</h3>
      {step.kind === "expand" && <DistributeArrows part={step.part} />}
      <ul className="answers answers-prelude">
        {step.options.map((option, index) => {
          const tried = wrong.includes(index);
          return (
            <li key={option.text}>
              <button type="button" className={`answer ${tried ? "wrong" : ""}`} disabled={tried} onClick={() => onChoose(index)}>
                <span className="answer-number" aria-hidden="true">
                  {tried ? <X size={16} /> : index + 1}
                </span>
                <span className="answer-text">{words.local(option.text)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A tick for a finished prelude step, used in the history. */
export function PreludeDone() {
  return <Check size={13} aria-hidden="true" />;
}
