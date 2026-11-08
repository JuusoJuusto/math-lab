"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

const OPTIONS = [
  { text: "Add 5", tone: "blue" },
  { text: "Subtract 5", tone: "red" },
  { text: "Multiply by 5", tone: "purple" },
  { text: "Divide by 5", tone: "orange" },
] as const;
const CORRECT = 1;

/** A one-question taster on the home page, with the same four coloured answers as MasterModus. */
export function TryItNow() {
  const [picked, setPicked] = useState<number | null>(null);

  return (
    <section className="tryit" aria-labelledby="tryit-title">
      <div className="tryit-head">
        <h2 id="tryit-title">Try it now</h2>
      </div>
      <p className="tryit-kicker">What do you do to both sides to get x alone?</p>
      <p className="tryit-question">
        <mark>x + 5 = 12</mark>
      </p>
      <div className="tryit-options">
        {OPTIONS.map((option, index) => {
          // A wrong pick is marked but the answer is not revealed, so the learner can try again.
          const state = picked === null ? "" : picked === CORRECT ? (index === CORRECT ? "right" : "dim") : index === picked ? "wrong" : "";
          return (
            <button
              key={option.text}
              type="button"
              className={`tryit-option tone-${option.tone} ${state}`}
              onClick={() => setPicked(index)}
              aria-pressed={picked === index}
            >
              <span className="tryit-number" aria-hidden="true">
                {state === "right" ? <Check size={16} /> : state === "wrong" ? <X size={16} /> : index + 1}
              </span>
              {option.text}
            </button>
          );
        })}
      </div>
      <p className="tryit-result" role="status">
        {picked === null
          ? ""
          : picked === CORRECT
            ? "Yes! Subtracting 5 undoes the + 5: x = 12 − 5 = 7. Do the same to both sides."
            : "Not quite. Think about what undoes + 5, then do it to both sides. Pick again."}
      </p>
    </section>
  );
}
