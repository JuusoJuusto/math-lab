"use client";

import { useId, useState, type FormEvent } from "react";
import { PenLine } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { engineText, equalsEquation, isWorkedOut, mirror, readWritten, type Equation, type Notice } from "@/lib/equations";
import { FeedbackPanel } from "./FeedbackPanel";
import { MathPad } from "./MathPad";

interface CountMyselfProps {
  /** What the equation becomes once both sides are counted. */
  after: Equation;
  /** The two sides, counted for the learner: shown after the second wrong try, as a way forward. */
  hint: readonly string[];
  /** The learner counted both sides, and wrote the equation that is left. */
  onCounted: () => void;
  /** A try that was wrong. */
  onMiss: () => void;
}

/**
 * Counting both sides by yourself, in the way that works with buttons: an operation has been chosen and is
 * written on both sides, and instead of pressing "Work out both sides" the learner writes what is left.
 *
 * The line has to be the right equation, and it has to be counted: `2x = 17 − 5` is the right equation, but
 * the subtraction is still to do. Nothing is lost by a wrong try except that it is counted; the button that
 * counts for the learner is still there.
 */
export function CountMyself({ after, hint, onCounted, onMiss }: CountMyselfProps) {
  const { lang, t } = useI18n();
  const words = t.count;
  const written = engineText(lang);
  const id = useId();
  const [value, setValue] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [misses, setMisses] = useState(0);

  function check(event?: FormEvent) {
    event?.preventDefault();
    if (value.trim() === "") return;
    const line = value.indexOf("||") === -1 ? value : value.slice(0, value.indexOf("||"));
    const read = readWritten(line);
    if (!read.ok) {
      const problem = written.written[read.problem];
      setNotice({ tone: "warning", title: problem.title, body: [problem.body] });
      return;
    }
    if (!equalsEquation(read.equation, after) && !equalsEquation(read.equation, mirror(after))) {
      setMisses((n) => n + 1);
      setNotice({ tone: "error", title: words.wrong, body: [words.wrongBody, ...(misses >= 1 ? hint : [])] });
      onMiss();
      return;
    }
    if (!isWorkedOut(line)) {
      setNotice({ tone: "warning", title: words.notCounted, body: [words.notCountedBody] });
      return;
    }
    onCounted();
  }

  return (
    <form className="count" onSubmit={check} aria-labelledby={`${id}-title`} noValidate>
      <h3 className="count-title" id={`${id}-title`}>
        <PenLine size={18} aria-hidden="true" /> {words.title}
      </h3>
      <p className="count-text">{words.text}</p>
      <label className="build-label" htmlFor={`${id}-field`}>
        {words.label}
      </label>
      <MathPad inputId={`${id}-field`} value={value} onChange={setValue} />
      <FeedbackPanel notice={notice} hints={[]} emptyText={words.empty} />
      <div className="action-buttons">
        <button type="submit" className="button-primary" disabled={value.trim() === ""}>
          {words.check}
        </button>
      </div>
    </form>
  );
}
