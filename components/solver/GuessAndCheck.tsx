"use client";

import { useRef, useState, type FormEvent } from "react";
import { Target } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { compare, evaluate, formatFraction, guessVerdict, type Equation, type Fraction, type GuessVerdict } from "@/lib/equations";
import { parseAnswer } from "@/lib/tasks";

interface GuessAndCheckProps {
  equation: Equation;
  /** Called with x when a guess makes both sides equal. */
  onSolved: (value: Fraction) => void;
}

interface Attempt {
  readonly x: Fraction;
  readonly left: Fraction;
  readonly right: Fraction;
  readonly verdict: GuessVerdict;
}

/**
 * Trial and improvement ("arvaa ja tarkista"). The learner guesses x, the two
 * sides are worked out for that guess, and the result says which way to go.
 * A wrong guess is not a mistake: finding the answer by getting closer is the
 * method. Only a guess that makes both sides equal ends the exercise.
 */
export function GuessAndCheck({ equation, onSolved }: GuessAndCheckProps) {
  const { lang, t } = useI18n();
  const words = t.solver.guess;
  const [text, setText] = useState("");
  const [attempts, setAttempts] = useState<readonly Attempt[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (text.trim() === "") {
      setMessage(words.empty);
      return;
    }
    const parsed = parseAnswer(text, lang);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    const verdict = guessVerdict(equation, parsed.value);
    if (verdict === null) return;

    const attempt: Attempt = { x: parsed.value, left: evaluate(equation.left, parsed.value), right: evaluate(equation.right, parsed.value), verdict };
    setAttempts((earlier) => [...earlier, attempt]);
    setText("");
    if (verdict === "right") {
      setMessage(null);
      onSolved(parsed.value);
      return;
    }
    setMessage(null);
    field.current?.focus();
  }

  const last = attempts[attempts.length - 1];

  return (
    <form className="guess" onSubmit={submit} noValidate>
      <p className="build-text">{words.intro}</p>

      <div className="guess-row">
        <label className="build-label" htmlFor="guess-field">
          {words.label}
        </label>
        <input
          id="guess-field"
          ref={field}
          className="write-input guess-input"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button type="submit" className="button-primary" disabled={text.trim() === ""}>
          <Target size={17} aria-hidden="true" /> {words.button}
        </button>
      </div>

      {message && (
        <p className="final-feedback" role="status">
          {message}
        </p>
      )}

      {last && last.verdict !== "right" && (
        <p className="guess-nudge" role="status">
          {compare(last.left, last.right) < 0 ? words.smallerSide : words.biggerSide} <strong>{last.verdict === "larger" ? words.larger : words.smaller}</strong>
        </p>
      )}

      {attempts.length > 0 && (
        <table className="guess-table">
          <caption>{words.tries(attempts.length)}</caption>
          <thead>
            <tr>
              <th scope="col">{words.columns.x}</th>
              <th scope="col">{words.columns.left}</th>
              <th scope="col">{words.columns.right}</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, index) => (
              <tr key={index} className={attempt.verdict === "right" ? "guess-right" : undefined}>
                <th scope="row">{formatFraction(attempt.x)}</th>
                <td>{formatFraction(attempt.left)}</td>
                <td>{formatFraction(attempt.right)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}
