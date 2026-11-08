"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, Check, CircleCheck, CircleX, X } from "lucide-react";
import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { groupOf, type Grade, type Task, type TaskDisplay } from "@/lib/tasks";
import { GroupIcon } from "@/components/ui/icons";
import { MathLine } from "@/components/ui/MathLine";

export type Phase = "answering" | "feedback";

interface TaskCardProps {
  task: Task;
  phase: Phase;
  grade: Grade | null;
  /** XP earned for this answer. */
  xp: number;
  /** Quick mode (time attack): no explanation, the next task follows by itself. */
  quick: boolean;
  isLast: boolean;
  /** The option the learner picked, for marking it. */
  picked: number | null;
  onChoose: (index: number) => void;
  /** Returns a message when the answer cannot be read, otherwise `null`. */
  onSubmit: (text: string) => string | null;
  onNext: () => void;
}

/** The equation, the before/after pair or the worked lines of a task. */
export function TaskDisplayView({ display }: { display: TaskDisplay }) {
  const { t } = useI18n();
  if (display.type === "equation") {
    return (
      <div className="task-equation">
        <MathLine text={display.text} />
      </div>
    );
  }
  if (display.type === "change") {
    return (
      <div className="task-change">
        <MathLine text={display.from} />
        <span className="task-arrow" aria-hidden="true">
          <ArrowDown size={22} />
          <span>?</span>
        </span>
        <MathLine text={display.to} />
      </div>
    );
  }
  return (
    <ol className="worked">
      {display.lines.map((line, index) => (
        <li key={index}>
          <span className="worked-no" aria-hidden="true">
            {index + 1}
          </span>
          <span className="sr-only">{t.task.line(index + 1)}</span>
          <span className="worked-body">
            <MathLine text={line.text} />
            {line.note && <span className="worked-note">{line.note}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** One task, whatever its kind: choices, a typed answer, or a worked solution to inspect. */
export function TaskCard({ task, phase, grade, xp, quick, isLast, picked, onChoose, onSubmit, onNext }: TaskCardProps) {
  const { lang, t } = useI18n();
  const group = groupOf(task.kind);
  const fieldId = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const next = useRef<HTMLButtonElement>(null);
  const answering = phase === "answering";
  const choice = task.input.type === "choice" ? task.input : null;

  // Number keys pick an answer, like the numbered buttons in MasterModus.
  useEffect(() => {
    if (!answering || !choice) return;
    const onKey = (event: KeyboardEvent) => {
      // Ignore keys typed into a field, and shortcuts such as Ctrl+1.
      const typing = event.target instanceof Element && event.target.closest("input, textarea, select") !== null;
      if (event.ctrlKey || event.metaKey || event.altKey || typing) return;
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && index >= 0 && index < choice.options.length) onChoose(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answering, choice, onChoose]);

  // After answering, put focus on "Next" so Enter carries on.
  useEffect(() => {
    if (phase === "feedback" && !quick) next.current?.focus();
  }, [phase, quick]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(onSubmit(text));
  }

  function toggleSign() {
    setText((value) => (value.trim().startsWith("-") ? value.trim().slice(1) : `-${value.trim()}`));
  }

  const unit = task.input.type === "number" ? task.input.unit : undefined;
  const isEquation = task.display?.type === "equation";

  return (
    <article className="task" aria-labelledby={`${fieldId}-prompt`}>
      <div className="task-tags">
        <span className="tag tag-kind">
          <GroupIcon group={group} /> {t.groups[group].label}
        </span>
        <span className="tag">{getTopic(task.topic, lang)?.title}</span>
      </div>

      <h2 className="task-prompt" id={`${fieldId}-prompt`}>
        {task.prompt}
      </h2>

      {task.display && <TaskDisplayView display={task.display} />}

      {choice && (
        <ul className={choice.options.length === 2 ? "answers answers-two" : "answers"}>
          {choice.options.map((option, index) => {
            const isCorrect = index === choice.correct;
            const state = answering ? "" : isCorrect ? "right" : picked === index ? "wrong" : "dim";
            return (
              <li key={option}>
                <button type="button" className={`answer ${state}`} disabled={!answering} onClick={() => onChoose(index)}>
                  <span className="answer-number" aria-hidden="true">
                    {state === "right" ? <Check size={16} /> : state === "wrong" ? <X size={16} /> : index + 1}
                  </span>
                  <span className="answer-text">{option}</span>
                  {state === "right" && <span className="sr-only">{t.task.correctAnswer}</span>}
                  {state === "wrong" && <span className="sr-only">{t.task.yourWrongAnswer}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {task.input.type === "number" && answering && (
        <form className="answer-form" onSubmit={submit} noValidate>
          <label className="sr-only" htmlFor={fieldId}>
            {t.task.yourAnswer}
          </label>
          <div className="answer-field">
            {isEquation && <span className="answer-prefix">x =</span>}
            <input
              id={fieldId}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="?"
              value={text}
              autoFocus
              aria-invalid={error !== null}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              onChange={(event) => {
                setText(event.target.value);
                setError(null);
              }}
            />
            {unit && <span className="answer-unit">{unit}</span>}
            <button type="button" className="sign-button" onClick={toggleSign} aria-label={t.task.sign}>
              ±
            </button>
          </div>
          {error && (
            <p className="field-error" id={`${fieldId}-error`} role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="cta cta-inline">
            {t.task.check}
          </button>
        </form>
      )}

      {!answering && grade && (
        <>
          {quick ? (
            <p className={grade.correct ? "quick-result quick-good" : "quick-result quick-bad"} role="status">
              {grade.correct ? t.task.quickRight(xp) : t.task.quickWrong(task.answerText)}
            </p>
          ) : (
            <div className={grade.correct ? "feedback feedback-good" : "feedback feedback-bad"} role="status">
              <p className="feedback-title">
                {grade.correct ? <CircleCheck size={22} aria-hidden="true" /> : <CircleX size={22} aria-hidden="true" />}
                {grade.correct ? t.task.correct : t.task.notQuite}
                {grade.correct && xp > 0 && <span className="xp-pop">{t.xp.gain(xp)}</span>}
              </p>
              {!grade.correct && (
                <p>
                  {t.task.theAnswerIs} <strong>{task.answerText}</strong>.
                </p>
              )}
              {grade.feedback.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <ul className="explain">
                {task.explanation.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          {!quick && (
            <button type="button" className="cta cta-inline" ref={next} onClick={onNext}>
              {isLast ? t.task.seeResults : t.task.next} <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </article>
  );
}
