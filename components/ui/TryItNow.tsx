"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { useI18n } from "@/hooks/useLang";

const TONES = ["blue", "red", "purple", "orange"] as const;
const CORRECT = 1;

/** A one-question taster on the home page, with the same four coloured answers as MasterModus. */
export function TryItNow() {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <section className="tryit" aria-labelledby="tryit-title">
      <div className="tryit-head">
        <h2 id="tryit-title">{t.tryit.title}</h2>
      </div>
      <p className="tryit-kicker">{t.tryit.question}</p>
      <p className="tryit-question">
        <mark>x + 5 = 12</mark>
      </p>
      <div className="tryit-options">
        {t.tryit.options.map((text, index) => {
          // A wrong pick is marked but the answer is not revealed, so the learner can try again.
          const state = picked === null ? "" : picked === CORRECT ? (index === CORRECT ? "right" : "dim") : index === picked ? "wrong" : "";
          return (
            <button
              key={index}
              type="button"
              className={`tryit-option tone-${TONES[index]} ${state}`}
              onClick={() => setPicked(index)}
              aria-pressed={picked === index}
            >
              <span className="tryit-number" aria-hidden="true">
                {state === "right" ? <Check size={16} /> : state === "wrong" ? <X size={16} /> : index + 1}
              </span>
              {text}
            </button>
          );
        })}
      </div>
      <p className="tryit-result" role="status">
        {picked === null
          ? ""
          : picked === CORRECT
            ? t.tryit.right
            : t.tryit.wrong}
      </p>
    </section>
  );
}
