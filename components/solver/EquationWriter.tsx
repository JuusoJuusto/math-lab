"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Delete, Lightbulb } from "lucide-react";
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
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [accepted, setAccepted] = useState<BuiltResult | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const locked = accepted !== null;
  const read = readWritten(value);
  const reading = value.trim() !== "" && read.ok ? formatEquation(read.equation) : null;

  // After a key is pressed, put the caret back where the learner was typing.
  useEffect(() => {
    if (caret.current !== null && input.current) {
      input.current.focus();
      input.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });

  function change(next: string) {
    setValue(next);
    if (!locked) setNotice(null);
  }

  function insert(text: string) {
    const field = input.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    caret.current = start + text.length;
    change(`${value.slice(0, start)}${text}${value.slice(end)}`);
  }

  function backspace() {
    const field = input.current;
    const start = field?.selectionStart ?? value.length;
    const end = field?.selectionEnd ?? value.length;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    caret.current = from;
    change(`${value.slice(0, from)}${value.slice(end)}`);
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
  const names = t.word.keyNames;

  const keys: readonly { label: string; insert: string; name: string }[] = [
    { label: "x", insert: "x", name: names.x },
    { label: "+", insert: " + ", name: names.plus },
    { label: "−", insert: " − ", name: names.minus },
    { label: words.times, insert: ` ${words.times} `, name: names.times },
    { label: words.divide, insert: ` ${words.divide} `, name: names.divide },
    { label: "(", insert: "(", name: names.open },
    { label: ")", insert: ")", name: names.close },
    { label: "=", insert: " = ", name: names.equals },
    { label: lang === "fi" ? "," : ".", insert: lang === "fi" ? "," : ".", name: names.point },
  ];

  return (
    <form className="build" onSubmit={check} aria-labelledby={`${id}-title`} noValidate>
      <h3 className="build-title" id={`${id}-title`}>
        {t.word.buildTitle}
      </h3>
      <p className="build-text">{t.word.buildText}</p>

      <label className="build-label" htmlFor={`${id}-field`}>
        {t.word.writeLabel}
      </label>
      <input
        id={`${id}-field`}
        ref={input}
        className="write-input"
        type="text"
        inputMode="text"
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        disabled={locked}
        onChange={(event) => change(event.target.value)}
      />

      {!locked && (
        <div className="keypad" role="group" aria-label={t.word.keysLabel}>
          {keys.map((key) => (
            <button type="button" className="key" key={key.name} aria-label={key.name} onClick={() => insert(key.insert)}>
              {key.label}
            </button>
          ))}
          <button type="button" className="key key-delete" aria-label={names.delete} onClick={backspace}>
            <Delete size={20} aria-hidden="true" />
          </button>
        </div>
      )}

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
