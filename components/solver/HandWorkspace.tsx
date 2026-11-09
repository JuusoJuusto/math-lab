"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowRight, Lightbulb, PenLine, Undo2 } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  afterStep,
  describeOperation,
  engineText,
  equalsEquation,
  formatAppliedEquation,
  formatBar,
  formatEquation,
  mirror,
  readWritten,
  getHints,
  isWrittenSimply,
  needsWorkingOut,
  judgeLine,
  readNote,
  solveEquation,
  terminalNotice,
  terminalState,
  type Equation,
  type HandPlan,
  type Notice,
  type Operation,
} from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";
import { EquationDisplay } from "./EquationDisplay";
import { FeedbackPanel } from "./FeedbackPanel";
import { FinalAnswer } from "./FinalAnswer";
import { MathPad } from "./MathPad";
import { SubstitutionCheck } from "./SubstitutionCheck";
import type { WorkspaceOutcome } from "./SolverWorkspace";

interface Line {
  /** What the learner wrote, without any note. */
  readonly text: string;
  readonly equation: Equation;
  readonly operation: Operation | null;
  /** The step the learner named beside the line, such as `|| − 5`, if any. */
  readonly note: Operation | null;
  /** A line that was given, not written by the learner. */
  readonly given?: boolean;
}

interface HandWorkspaceProps {
  /** The equation as it is written in the exercise, which may have brackets or fractions. */
  source: string;
  /** The same equation in simple form. */
  equation: Equation;
  continueLabel: string;
  /**
   * What kind of task it is: the whole equation, the rest of a solution that is begun, or one step to write.
   * Without it, the whole equation is solved.
   */
  plan?: HandPlan;
  onContinue: (outcome: WorkspaceOutcome) => void;
}

/**
 * Solving by hand: no operation buttons, no term to tap. The learner types every
 * line of the solution, and the engine checks each one against the line above.
 * It is the notebook way of working, with the check done for them.
 */
export function HandWorkspace({ source, equation, continueLabel, plan: planned, onContinue }: HandWorkspaceProps) {
  const { lang, t } = useI18n();
  const words = t.solver.hand;
  const written = engineText(lang);
  const id = useId();

  const [value, setValue] = useState("");
  // A task that gives some lines, or asks for one step, can be set aside to work out the whole equation alone.
  const [wholeAlone, setWholeAlone] = useState(false);
  const plan = wholeAlone ? undefined : planned;
  // What is shown as "the equation": for one step to write, the equation just before that step.
  const startText = plan?.source ?? source;
  const variant = plan?.variant ?? "full";
  const original = plan?.original ?? equation;
  const [lines, setLines] = useState<readonly Line[]>(() =>
    (plan?.given ?? []).map((line) => ({ text: line.text, equation: line.equation, operation: line.operation, note: null, given: true })),
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [checked, setChecked] = useState(false);
  // Wrong tries at the final answer; `null` until the number has been worked out.
  const [answerMisses, setAnswerMisses] = useState<number | null>(null);

  // The equation the learner starts from: for one step to write, the equation just before that step.
  const start = plan?.equation ?? equation;
  const current = lines.length > 0 ? lines[lines.length - 1].equation : start;
  const aboveText = lines.length > 0 ? lines[lines.length - 1].text : startText;
  // A solution ends with x alone, or, when x cancels out, with a statement such as 3 = 7 (never true) or 4 = 4 (always true).
  const typedLines = lines.filter((line) => !line.given);
  const ended = lines.length > 0 ? terminalState(current) : null;
  // A task that asks for one step is finished by writing it; the others end with x alone or with x gone.
  const finished = variant === "write" ? typedLines.length > 0 : ended !== null;
  const solved = ended === "solved" && variant !== "write" ? solveEquation(original) : null;
  const answer = solved?.kind === "one" ? solved.value : null;
  // `x = 12 : 2` has x alone, but the number is not counted yet: it has to be worked out before the answer is one.
  const lastText = lines.length > 0 ? lines[lines.length - 1].text : "";
  const needsAnswer = answer !== null && needsWorkingOut(lastText);
  const answered = !needsAnswer || answerMisses !== null;

  function add(event?: FormEvent) {
    event?.preventDefault();
    if (finished || value.trim() === "") return;
    const verdict = judgeLine(current, value, isWrittenSimply(aboveText, current), lang);

    if (verdict.kind === "unreadable") {
      const problem = written.written[verdict.problem];
      setNotice({ tone: "warning", title: problem.title, body: [problem.body] });
      return;
    }
    if (variant === "write" && plan?.step) {
      // One step was asked for, so that step's equation is what counts; another valid step is not wrong, but not what was asked.
      const expected = afterStep(current, plan.step);
      const read = readWritten(value.indexOf("||") === -1 ? value : value.slice(0, value.indexOf("||")));
      if (expected && read.ok && (equalsEquation(read.equation, expected) || equalsEquation(read.equation, mirror(expected)))) {
        const text = value.indexOf("||") === -1 ? value.trim() : value.slice(0, value.indexOf("||")).trim();
        setLines([{ text, equation: read.equation, operation: plan.step, note: readNote(value) }]);
        setValue("");
        setNotice({ tone: "success", title: words.writeDone(describeOperation(plan.step, lang)), body: [] });
        return;
      }
      if (verdict.kind === "ok" || verdict.kind === "tidy") {
        setNotice({ tone: "warning", title: words.writeOther.title, body: [words.writeOther.body] });
        return;
      }
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
    const end = terminalState(verdict.equation);
    setNotice(
      end !== null && end !== "solved"
        ? terminalNotice(end, verdict.equation, lang)
        : { tone: "success", title: t.solver.hand.stepLabel(lines.length + 1, praise), body: end === "solved" ? [needsWorkingOut(typed) ? words.countNumber : words.done] : [] },
    );
  }

  function undo() {
    if (lines.length === 0 || lines[lines.length - 1].given) return;
    setLines(lines.slice(0, -1));
    setNotice(null);
    setChecked(false);
    setAnswerMisses(null);
    setHintLevel(0);
  }

  function doWholeAlone() {
    setWholeAlone(true);
    setLines([]);
    setValue("");
    setNotice(null);
    setHintLevel(0);
  }

  function stuck() {
    if (hintLevel >= hintCount) return;
    setHintLevel(hintLevel + 1);
    setHintsUsed((n) => n + 1);
  }

  const hints =
    variant === "write" && plan?.step
      ? [words.writeHint1(formatAppliedEquation(current, plan.step, lang)), words.writeHint2(formatEquation(afterStep(current, plan.step) ?? current))]
      : getHints(current, lang);
  const hintCount = hints ? hints.length : 0;
  const shown = hints ? hints.slice(0, hintLevel) : [];
  function finish() {
    onContinue({ steps: typedLines.filter((line) => line.operation !== null).length, mistakes: mistakes + (answerMisses ?? 0), hints: hintsUsed });
  }

  return (
    <div className="workspace workspace-single hand">
      <div className="workspace-main">
        <section className="hand-intro" aria-labelledby={`${id}-title`}>
          <h3 id={`${id}-title`} className="build-title">
            <PenLine size={20} aria-hidden="true" /> {words.title}
          </h3>
          <p className="build-text">{variant === "continue" ? words.continueIntro : variant === "write" ? words.writeIntro : words.intro}</p>
          {variant === "write" && plan?.step && <p className="hand-task">{words.writePrompt(describeOperation(plan.step, lang))}</p>}
          {planned && planned.variant !== "full" && !wholeAlone && typedLines.length === 0 && (
            <button type="button" className="text-link hand-whole" onClick={doWholeAlone}>
              {words.wholeAlone}
            </button>
          )}
        </section>

        <section className="eq eq-written" aria-label={words.start} data-source={startText} data-variant={variant} data-given={plan?.given.length ?? 0}>
          <div className="eq-caption" aria-hidden="true">
            {words.start}
          </div>
          <MathLine text={startText.replace(/-/g, "−")} />
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
                      {line.given && line.operation
                        ? words.givenLabel(index + 1, describeOperation(line.operation, lang))
                        : line.operation
                          ? words.stepLabel(index + 1, describeOperation(line.operation, lang))
                          : words.tidyLabel}
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
              <button type="button" className="chip-button" onClick={undo} disabled={typedLines.length === 0}>
                <Undo2 size={16} aria-hidden="true" /> {words.undo}
              </button>
            </div>
          </section>
        )}

        {/* x = 1 · 2 is shown as the learner wrote it, in the lines above: the picture would count it for them. */}
        {lines.length > 0 && answered && <EquationDisplay equation={current} solved={finished} />}

        <FeedbackPanel notice={notice} hints={shown} emptyText={lines.length === 0 ? words.none : words.yourMove} />

        {finished ? (
          <>
            {answer && <FinalAnswer value={answer} lastLine={lastText} needsWork={needsAnswer} onAnswered={setAnswerMisses} />}
            {answer && answered && <SubstitutionCheck original={original} value={answer} checked={checked} onCheck={() => setChecked(true)} />}
            {answered && (checked || !answer) && (
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
            <MathPad inputId={`${id}-field`} value={value} onChange={setValue} bar={{ name: words.barKey }} />
            <div className="action-buttons">
              <button type="submit" className="button-primary" disabled={value.trim() === ""}>
                {words.add}
              </button>
              <button type="button" className="button-secondary" onClick={stuck} disabled={hintLevel >= hintCount}>
                <Lightbulb size={16} aria-hidden="true" /> {hintLevel === 0 ? words.stuck : hintLevel < hintCount ? t.solver.moreHelp(hintLevel) : t.solver.allHints}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
