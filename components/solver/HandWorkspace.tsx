"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Delete, Lightbulb, PenLine, Undo2 } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  describeOperation,
  engineText,
  formatBar,
  getHints,
  isSolved,
  isWrittenSimply,
  judgeLine,
  readNote,
  solveEquation,
  type Equation,
  type Notice,
  type Operation,
} from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { SubstitutionCheck } from "./SubstitutionCheck";
import type { WorkspaceOutcome } from "./SolverWorkspace";

interface Line {
  /** What the learner wrote, without any note. */
  readonly text: string;
  readonly equation: Equation;
  readonly operation: Operation | null;
  /** The step the learner named beside the line, such as `|| − 5`, if any. */
  readonly note: Operation | null;
}

interface HandWorkspaceProps {
  /** The equation as it is written in the exercise, which may have brackets or fractions. */
  source: string;
  /** The same equation in simple form. */
  equation: Equation;
  continueLabel: string;
  onContinue: (outcome: WorkspaceOutcome) => void;
}

/**
 * Solving by hand: no operation buttons, no term to tap. The learner types every
 * line of the solution, and the engine checks each one against the line above.
 * It is the notebook way of working, with the check done for them.
 */
export function HandWorkspace({ source, equation, continueLabel, onContinue }: HandWorkspaceProps) {
  const { lang, t } = useI18n();
  const words = t.solver.hand;
  const written = engineText(lang);
  const id = useId();
  const field = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  const [value, setValue] = useState("");
  const [lines, setLines] = useState<readonly Line[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [checked, setChecked] = useState(false);

  const current = lines.length > 0 ? lines[lines.length - 1].equation : equation;
  const aboveText = lines.length > 0 ? lines[lines.length - 1].text : source;
  const finished = lines.length > 0 && isSolved(current);
  const solved = finished ? solveEquation(equation) : null;
  const answer = solved?.kind === "one" ? solved.value : null;

  useEffect(() => {
    if (caret.current !== null && field.current) {
      field.current.focus();
      field.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });

  function insert(text: string) {
    const input = field.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    caret.current = start + text.length;
    setValue(`${value.slice(0, start)}${text}${value.slice(end)}`);
  }

  function backspace() {
    const input = field.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    caret.current = from;
    setValue(`${value.slice(0, from)}${value.slice(end)}`);
  }

  function add(event?: FormEvent) {
    event?.preventDefault();
    if (finished || value.trim() === "") return;
    const verdict = judgeLine(current, value, isWrittenSimply(aboveText, current), lang);

    if (verdict.kind === "unreadable") {
      const problem = written.written[verdict.problem];
      setNotice({ tone: "warning", title: problem.title, body: [problem.body] });
      return;
    }
    if (verdict.kind === "same" || verdict.kind === "skips" || verdict.kind === "wrong") {
      const text = words[verdict.kind];
      setNotice({ tone: verdict.kind === "wrong" ? "error" : "warning", title: text.title, body: [text.body] });
      if (verdict.kind === "wrong") setMistakes((n) => n + 1);
      return;
    }

    const typed = value.trim();
    const text = typed.indexOf("||") === -1 ? typed : typed.slice(0, typed.indexOf("||")).trim();
    const line: Line = {
      text,
      equation: verdict.equation,
      operation: verdict.kind === "ok" ? verdict.operation : null,
      note: readNote(typed),
    };
    setLines([...lines, line]);
    setValue("");
    setHintLevel(0);
    const praise = verdict.kind === "ok" ? words.ok(describeOperation(verdict.operation, lang)) : words.tidy;
    setNotice({ tone: "success", title: t.solver.hand.stepLabel(lines.length + 1, praise), body: isSolved(verdict.equation) ? [words.done] : [] });
  }

  function undo() {
    setLines(lines.slice(0, -1));
    setNotice(null);
    setChecked(false);
    setHintLevel(0);
  }

  function stuck() {
    if (hintLevel >= 3) return;
    setHintLevel(hintLevel + 1);
    setHintsUsed((n) => n + 1);
  }

  const hints = getHints(current, lang);
  const shown = hints ? hints.slice(0, hintLevel) : [];
  const names = t.word.keyNames;
  const keys: readonly { label: string; insert: string; name: string }[] = [
    { label: "x", insert: "x", name: names.x },
    { label: "+", insert: " + ", name: names.plus },
    { label: "−", insert: " − ", name: names.minus },
    { label: written.times, insert: ` ${written.times} `, name: names.times },
    { label: written.divide, insert: ` ${written.divide} `, name: names.divide },
    { label: "(", insert: "(", name: names.open },
    { label: ")", insert: ")", name: names.close },
    { label: "=", insert: " = ", name: names.equals },
    { label: "||", insert: " || ", name: words.barKey },
  ];

  function finish() {
    onContinue({ steps: lines.filter((line) => line.operation !== null).length, mistakes, hints: hintsUsed });
  }

  return (
    <div className="workspace workspace-single hand">
      <div className="workspace-main">
        <section className="hand-intro" aria-labelledby={`${id}-title`}>
          <h3 id={`${id}-title`} className="build-title">
            <PenLine size={20} aria-hidden="true" /> {words.title}
          </h3>
          <p className="build-text">{words.intro}</p>
        </section>

        <section className="eq eq-written" aria-label={words.start} data-source={source}>
          <div className="eq-caption" aria-hidden="true">
            {words.start}
          </div>
          <MathLine text={source.replace(/-/g, "−")} />
        </section>

        {lines.length > 0 && (
          <section className="history history-sheet" aria-label={words.sheet}>
            <h2 className="history-title">{words.sheet}</h2>
            <ol className="history-list">
              {lines.map((line, index) => (
                <li className="history-item" key={`${index}-${line.text}`}>
                  <span className="history-badge" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <span className="history-label">
                      {line.operation ? words.stepLabel(index + 1, describeOperation(line.operation, lang)) : words.tidyLabel}
                    </span>
                    <p className="history-notebook">
                      <span>{line.text.replace(/-/g, "−")}</span>
                      {line.operation && <span className="history-bar">{formatBar(line.operation, lang)}</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="history-actions">
              <button type="button" className="chip-button" onClick={undo}>
                <Undo2 size={16} aria-hidden="true" /> {words.undo}
              </button>
            </div>
          </section>
        )}

        {lines.length > 0 && <EquationDisplay equation={current} solved={finished} />}

        <FeedbackPanel notice={notice} hints={shown} emptyText={lines.length === 0 ? words.none : t.solver.empty} />

        {finished ? (
          <>
            {answer && <SubstitutionCheck original={equation} value={answer} checked={checked} onCheck={() => setChecked(true)} />}
            {checked && (
              <div className="action-buttons action-finish">
                <button type="button" className="button-primary" onClick={finish}>
                  {continueLabel} <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        ) : (
          <form className="hand-form" onSubmit={add} noValidate>
            <label className="build-label" htmlFor={`${id}-field`}>
              {words.label}
            </label>
            <input
              id={`${id}-field`}
              ref={field}
              className="write-input"
              type="text"
              inputMode="text"
              enterKeyHint="done"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
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
            <div className="action-buttons">
              <button type="submit" className="button-primary" disabled={value.trim() === ""}>
                {words.add}
              </button>
              <button type="button" className="button-secondary" onClick={stuck} disabled={hintLevel >= 3}>
                <Lightbulb size={16} aria-hidden="true" /> {hintLevel === 0 ? words.stuck : hintLevel < 3 ? t.solver.moreHelp(hintLevel) : t.solver.allHints}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
