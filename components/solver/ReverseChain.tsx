"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { equals, formatFraction, operationLabel, type Chain, type Fraction } from "@/lib/equations";
import { parseAnswer } from "@/lib/tasks";

interface ReverseChainProps {
  chain: Chain;
  /** Called with x when every box is right. */
  onSolved: (value: Fraction) => void;
  /** Called once for each check that is not right. */
  onMiss: () => void;
}

/**
 * The "work backwards" method (käänteisoperaatiot). First what is done to x, as
 * a chain from x to the result (x, times 2, plus 5, 17). Then the same chain
 * undone from the end, where the learner works out the number after each step.
 */
export function ReverseChain({ chain, onSolved, onMiss }: ReverseChainProps) {
  const { lang, t } = useI18n();
  const words = t.solver.chain;
  const [values, setValues] = useState<string[]>(() => chain.backward.map(() => ""));
  const [marks, setMarks] = useState<("ok" | "wrong" | null)[]>(() => chain.backward.map(() => null));
  const [message, setMessage] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (values.some((value) => value.trim() === "")) {
      setMessage(words.empty);
      return;
    }

    const next = chain.backward.map((step, index) => {
      const parsed = parseAnswer(values[index], lang);
      return parsed.ok && equals(parsed.value, step.to) ? ("ok" as const) : ("wrong" as const);
    });
    setMarks(next);

    const firstWrong = next.indexOf("wrong");
    if (firstWrong === -1) {
      setMessage(null);
      onSolved(chain.backward[chain.backward.length - 1]?.to ?? chain.result);
      return;
    }
    const step = chain.backward[firstWrong];
    setMessage(words.wrong(firstWrong + 1, formatFraction(step.from), operationLabel(step.operation, lang)));
    onMiss();
  }

  return (
    <form className="chain" onSubmit={submit} noValidate>
      <p className="build-text">{words.intro}</p>

      <div className="chain-row">
        <span className="chain-label">{words.forward}</span>
        <ol className="chain-flow" aria-label={words.forward}>
          <li className="chain-chip chain-x">x</li>
          {chain.forward.map((step, index) => (
            <li className="chain-step" key={index}>
              <ArrowRight size={16} aria-hidden="true" />
              <span className="chain-chip chain-op">{operationLabel({ kind: step.kind, amount: step.amount, withVariable: false }, lang)}</span>
            </li>
          ))}
          <li className="chain-step">
            <ArrowRight size={16} aria-hidden="true" />
            <span className="chain-chip chain-end">{formatFraction(chain.result)}</span>
          </li>
        </ol>
      </div>

      <div className="chain-row">
        <span className="chain-label">{words.backward}</span>
        <ol className="chain-flow" aria-label={words.backward}>
          <li className="chain-chip chain-end">{formatFraction(chain.result)}</li>
          {chain.backward.map((step, index) => {
            const last = index === chain.backward.length - 1;
            const op = operationLabel(step.operation, lang);
            return (
              <li className="chain-step" key={index}>
                <ArrowRight size={16} aria-hidden="true" />
                <span className="chain-chip chain-op">{op}</span>
                <ArrowRight size={16} aria-hidden="true" />
                {last && <span className="chain-chip chain-x">{words.result}</span>}
                <input
                  ref={index === 0 ? first : undefined}
                  className={`chain-input ${marks[index] ?? ""}`}
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  aria-label={last ? words.xLabel : words.stepLabel(index + 1, formatFraction(step.from), op)}
                  aria-invalid={marks[index] === "wrong"}
                  value={values[index]}
                  onChange={(event) => {
                    setValues((old) => old.map((value, i) => (i === index ? event.target.value : value)));
                    setMarks((old) => old.map((mark, i) => (i === index ? null : mark)));
                    setMessage(null);
                  }}
                />
              </li>
            );
          })}
        </ol>
      </div>

      {message && (
        <p className="picker-error" role="alert">
          {message}
        </p>
      )}
      <div className="action-buttons">
        <button type="submit" className="button-primary">
          {words.check}
        </button>
      </div>
    </form>
  );
}
