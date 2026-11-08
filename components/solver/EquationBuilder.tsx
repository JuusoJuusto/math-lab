"use client";

import { useId, useState } from "react";
import { ArrowRight, Lightbulb } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  engineText,
  expr,
  formatEquation,
  judgeBuiltEquation,
  type BuildVerdict,
  type Equation,
  type Notice,
} from "@/lib/equations";
import { FeedbackPanel } from "./FeedbackPanel";

type Sign = "+" | "-";

interface Fields {
  lx: string;
  ls: Sign;
  lc: string;
  rx: string;
  rs: Sign;
  rc: string;
}

const EMPTY: Fields = { lx: "", ls: "+", lc: "", rx: "", rs: "+", rc: "" };

/** A whole number up to three digits, or nothing (which counts as 0). `null` when the text cannot be used. */
function toNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return 0;
  return /^\d{1,3}$/.test(trimmed) ? Number(trimmed) : null;
}

/** The equation the boxes describe, or `null` while a box holds something unusable or everything is empty. */
function fieldsToEquation(fields: Fields): Equation | null {
  const numbers = [fields.lx, fields.lc, fields.rx, fields.rc].map(toNumber);
  if (numbers.some((n) => n === null) || numbers.every((n) => n === 0)) return null;
  const [lx, lc, rx, rc] = numbers as number[];
  return { left: expr(lx, fields.ls === "-" ? -lc : lc), right: expr(rx, fields.rs === "-" ? -rc : rc) };
}

export interface BuiltResult {
  readonly equation: Equation;
  readonly verdict: Extract<BuildVerdict, { kind: "exact" | "equivalent" }>;
  readonly mistakes: number;
  readonly hints: number;
}

interface EquationBuilderProps {
  /** The equation the story gives. The learner's equation is judged against it. */
  intended: Equation;
  onBuilt: (result: BuiltResult) => void;
}

/**
 * Where a learner writes the equation a story describes: two sides, each
 * `number × x ± number`. The engine judges it against the story's equation, so
 * an equation that merely has the right answer in it (x = 6) is not enough.
 */
export function EquationBuilder({ intended, onBuilt }: EquationBuilderProps) {
  const { lang, t } = useI18n();
  const text = engineText(lang).build;
  const id = useId();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [accepted, setAccepted] = useState<BuiltResult | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const built = fieldsToEquation(fields);
  const locked = accepted !== null;

  function update(change: Partial<Fields>) {
    setFields((old) => ({ ...old, ...change }));
    if (!locked) setNotice(null);
  }

  function check() {
    if (!built) return;
    const verdict = judgeBuiltEquation(built, intended);

    if (verdict.kind === "exact" || verdict.kind === "equivalent") {
      const words = verdict.kind === "exact" ? text.exact : text.equivalent;
      setNotice({ tone: "success", title: words.title, body: [words.body] });
      setAccepted({ equation: built, verdict, mistakes, hints: hintsUsed });
      return;
    }

    const words =
      verdict.kind === "no-variable" ? text.noVariable : verdict.kind === "answer-given" ? text.answerGiven : text[verdict.hint];
    setNotice({ tone: verdict.kind === "wrong" ? "error" : "warning", title: words.title, body: [words.body] });
    if (verdict.kind === "wrong") setMistakes((n) => n + 1);
  }

  function hint() {
    if (hintLevel >= 3) return;
    setHintLevel(hintLevel + 1);
    setHintsUsed((n) => n + 1);
  }

  const hints = t.word.hints.map((line, index) => (index === 2 ? `${line} ${formatEquation(intended)}` : line));
  const hintLabel = hintLevel === 0 ? t.word.hint : hintLevel < 3 ? t.word.moreHelp(hintLevel) : t.word.allHints;

  const side = (key: "l" | "r", label: string) => {
    const x = key === "l" ? fields.lx : fields.rx;
    const sign = key === "l" ? fields.ls : fields.rs;
    const c = key === "l" ? fields.lc : fields.rc;
    const set = (change: Partial<Fields>) => update(change);
    const signLabel = `${label}: ${sign === "+" ? t.word.plus : t.word.minus}`;
    return (
      <div className="build-side" role="group" aria-label={label}>
        <span className="build-side-label">{label}</span>
        <div className="build-row">
          <input
            className="build-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            aria-label={`${label}, ${t.word.coefficient}`}
            value={x}
            disabled={locked}
            onChange={(event) => set(key === "l" ? { lx: event.target.value } : { rx: event.target.value })}
          />
          <span className="build-x" aria-hidden="true">
            x
          </span>
          <button
            type="button"
            className="build-sign"
            aria-label={signLabel}
            disabled={locked}
            onClick={() => set(key === "l" ? { ls: sign === "+" ? "-" : "+" } : { rs: sign === "+" ? "-" : "+" })}
          >
            {sign === "+" ? "+" : "−"}
          </button>
          <input
            className="build-input"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0"
            aria-label={`${label}, ${t.word.constant}`}
            value={c}
            disabled={locked}
            onChange={(event) => set(key === "l" ? { lc: event.target.value } : { rc: event.target.value })}
          />
        </div>
      </div>
    );
  };

  return (
    <section className="build" aria-labelledby={`${id}-title`}>
      <h3 className="build-title" id={`${id}-title`}>
        {t.word.buildTitle}
      </h3>
      <p className="build-text">{t.word.buildText}</p>

      <div className="build-grid">
        {side("l", t.word.left)}
        <span className="build-equals" aria-hidden="true">
          =
        </span>
        {side("r", t.word.right)}
      </div>

      <p className="build-preview" aria-live="polite">
        <span>{t.word.yourEquation}:</span> <strong>{built ? formatEquation(built) : t.word.nothingYet}</strong>
      </p>

      <FeedbackPanel notice={notice} hints={locked ? [] : hints.slice(0, hintLevel)} emptyText={t.word.pressCheck} />

      <div className="action-buttons">
        {accepted ? (
          <button type="button" className="button-primary" onClick={() => onBuilt(accepted)}>
            {t.word.solveIt} <ArrowRight size={17} aria-hidden="true" />
          </button>
        ) : (
          <>
            <button type="button" className="button-primary" onClick={check} disabled={!built}>
              {t.word.check}
            </button>
            <button type="button" className="button-secondary" onClick={hint} disabled={hintLevel >= 3}>
              <Lightbulb size={16} aria-hidden="true" /> {hintLabel}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
