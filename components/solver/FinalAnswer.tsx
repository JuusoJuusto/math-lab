"use client";

import { useId, useState } from "react";
import { CircleCheck, Flag } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { equals, formatFraction, needsWorkingOut, type Fraction, type Notice } from "@/lib/equations";
import { parseAnswer } from "@/lib/tasks";
import { MathLine } from "@/components/ui/MathLine";
import { FeedbackPanel } from "./FeedbackPanel";
import { MathPad } from "./MathPad";

interface FinalAnswerProps {
  /** What x is. */
  value: Fraction;
  /** The last line the learner wrote, such as `x = 12 : 2` or `x = 6`. */
  lastLine: string;
  /** True while the number in the last line still has to be worked out. A plain number is shown as the answer. */
  needsWork: boolean;
  /** Called once, with the number of wrong tries, when the learner has worked out the number. */
  onAnswered: (mistakes: number) => void;
}

/**
 * The end of a solution: x equals a number.
 *
 * A last line such as `x = 12 : 2` is not the answer yet, because the number has not been counted. The
 * learner works it out and writes it, with the same keys as everywhere (digits, a minus sign, a fraction),
 * and a fraction has to be in its simplest form. A last line that is already a number is simply shown as the
 * answer, so nothing is asked twice.
 */
export function FinalAnswer({ value, lastLine, needsWork, onAnswered }: FinalAnswerProps) {
  const { lang, t } = useI18n();
  const words = t.answer;
  const id = useId();
  const [text, setText] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [misses, setMisses] = useState(0);
  const [done, setDone] = useState(false);
  const answer = formatFraction(value);

  // The part of the last line that is still to be counted, for a hint.
  const sum = lastLine
    .split("||")[0]
    .split("=")
    .find((part) => !/x/i.test(part))
    ?.trim();

  function check() {
    if (done || text.trim() === "") return;
    const parsed = parseAnswer(text, lang);
    if (!parsed.ok) {
      setNotice({ tone: "warning", title: parsed.message, body: [] });
      return;
    }
    if (!equals(parsed.value, value)) {
      setMisses((n) => n + 1);
      const body = [words.wrongBody];
      if (misses >= 1 && sum) body.push(words.hint(sum));
      setNotice({ tone: "error", title: words.wrong(formatFraction(parsed.value)), body });
      return;
    }
    // The right number, but a fraction such as 6/4 is not finished until it is as simple as it gets.
    if (needsWorkingOut(`x = ${text}`)) {
      setNotice({ tone: "warning", title: words.simplest.title, body: [words.simplest.body] });
      return;
    }
    setDone(true);
    setNotice({ tone: "success", title: words.right(answer), body: [words.rightBody] });
    onAnswered(misses);
  }

  if (!needsWork || done) {
    return (
      <section className="final-answer final-answer-done" aria-label={words.done}>
        <span className="final-answer-icon" aria-hidden="true">
          <CircleCheck size={22} />
        </span>
        <div className="final-answer-body">
          <h2>{words.done}</h2>
          <MathLine text={`x = ${answer}`} />
          {done && <p>{words.rightBody}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="final-answer" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="final-answer-title">
        <Flag size={20} aria-hidden="true" /> {words.title}
      </h2>
      <p className="final-answer-text">{words.work(lastLine.split("||")[0].trim().replace(/-/g, "−"))}</p>
      <label className="build-label" htmlFor={`${id}-field`}>
        {words.label}
      </label>
      <MathPad inputId={`${id}-field`} value={text} onChange={setText} mode="number" prefix="x = " />
      <FeedbackPanel notice={notice} hints={[]} emptyText={words.empty} />
      <div className="action-buttons">
        <button type="button" className="button-primary" disabled={text.trim() === ""} onClick={check}>
          {words.check}
        </button>
      </div>
    </section>
  );
}
