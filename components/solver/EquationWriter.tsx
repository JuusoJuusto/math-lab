"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  engineText,
  formatEquation,
  judgeBuiltEquation,
  readWritten,
  type BuildVerdict,
  type Equation,
  type Notice,
} from "@/lib/equations";
import { FeedbackPanel } from "./FeedbackPanel";
import { MathPad } from "./MathPad";

export interface BuiltResult {
  readonly equation: Equation;
  readonly verdict: Extract<BuildVerdict, { kind: "exact" | "equivalent" }>;
  readonly mistakes: number;
  readonly hints: number;
}

interface EquationWriterProps {
  /** The equation the story gives. What the learner writes is judged against it. */
  intended: Equation;
  onBuilt: (result: BuiltResult) => void;
}

/**
 * Where a learner writes the equation a story describes, from a blank field.
 *
 * Nothing is filled in: no boxes, no template, no starting text. The engine
 * reads what was typed (brackets, fractions and decimals included) and judges it
 * against the story's equation, so an equation that merely states the answer
 * (x = 6) is not enough. The keypad is only for phones, where x, brackets and
 * the equals sign hide behind keyboard layers.
 */
export function EquationWriter({ intended, onBuilt }: EquationWriterProps) {
  const { lang, t } = useI18n();
  const words = engineText(lang);
  const id = useId();

  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [accepted, setAccepted] = useState<BuiltResult | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const locked = accepted !== null;
  const read = readWritten(value);
  const reading = value.trim() !== "" && read.ok ? formatEquation(read.equation) : null;

  function change(next: string) {
    setValue(next);
    if (!locked) setNotice(null);
  }

  function check(event?: FormEvent) {
    event?.preventDefault();
    if (locked) return;
    const written = readWritten(value);

    if (!written.ok) {
      const problem = words.written[written.problem];
      setNotice({ tone: "warning", title: problem.title, body: [problem.body] });
      return;
    }

    const verdict = judgeBuiltEquation(written.equation, intended);
    if (verdict.kind === "exact" || verdict.kind === "equivalent") {
      const text = verdict.kind === "exact" ? words.build.exact : words.build.equivalent;
      setNotice({ tone: "success", title: text.title, body: [text.body] });
      setAccepted({ equation: written.equation, verdict, mistakes, hints: hintsUsed });
      return;
    }

    const text =
      verdict.kind === "no-variable" ? words.build.noVariable : verdict.kind === "answer-given" ? words.build.answerGiven : words.build[verdict.hint];
    setNotice({ tone: verdict.kind === "wrong" ? "error" : "warning", title: text.title, body: [text.body] });
    if (verdict.kind === "wrong") setMistakes((n) => n + 1);
  }

  function hint() {
    if (hintLevel >= 3) return;
    setHintLevel(hintLevel + 1);
    setHintsUsed((n) => n + 1);
  }

  const hints = t.word.hints.map((line, index) => (index === 2 ? `${line} ${formatEquation(intended)}` : line));
  const hintLabel = hintLevel === 0 ? t.word.hint : hintLevel < 3 ? t.word.moreHelp(hintLevel) : t.word.allHints;
  return (
    <form className="build" onSubmit={check} aria-labelledby={`${id}-title`} noValidate>
      <h3 className="build-title" id={`${id}-title`}>
        {t.word.buildTitle}
      </h3>
      <p className="build-text">{t.word.buildText}</p>

      <label className="build-label" htmlFor={`${id}-field`}>
        {t.word.writeLabel}
      </label>
      <MathPad inputId={`${id}-field`} value={value} onChange={change} disabled={locked} />

      <p className="build-preview" aria-live="polite">
        {reading ? (
          <>
            <span>{t.word.reads}:</span> <strong>{reading}</strong>
          </>
        ) : (
          <span className="sr-only">{t.word.pressCheck}</span>
        )}
      </p>

      <FeedbackPanel notice={notice} hints={locked ? [] : hints.slice(0, hintLevel)} emptyText={t.word.pressCheck} />

      <div className="action-buttons">
        {accepted ? (
          <button type="button" className="button-primary" onClick={() => onBuilt(accepted)}>
            {t.word.solveIt} <ArrowRight size={17} aria-hidden="true" />
          </button>
        ) : (
          <>
            <button type="submit" className="button-primary" disabled={value.trim() === ""}>
              {t.word.check}
            </button>
            <button type="button" className="button-secondary" onClick={hint} disabled={hintLevel >= 3}>
              <Lightbulb size={16} aria-hidden="true" /> {hintLabel}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
