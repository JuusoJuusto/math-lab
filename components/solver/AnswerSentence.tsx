"use client";

import { useId, useState, type FormEvent } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { answerFrame, type Story } from "@/lib/tasks";

interface AnswerSentenceProps {
  story: Story;
  /** The number the sentence is about: the answer to the question. */
  value: number;
  onCorrect: () => void;
  /** A try that was wrong. */
  onSlip: () => void;
}

/**
 * The last step of a word problem: answer the question in a sentence.
 *
 * The finished sentence is the story's own ("The ride was 6 km long."). It is shown with a gap where the number
 * goes, and the learner fills the gap, so the answer is something they say and not something they are shown.
 * A number that does not fit is sent back to the story: put it in and read the story again.
 */
export function AnswerSentence({ story, value, onCorrect, onSlip }: AnswerSentenceProps) {
  const { lang, t } = useI18n();
  const id = useId();
  const words = story.i18n[lang];
  const frame = answerFrame(words.answer, value) ?? { before: "", after: words.unit ? ` ${words.unit}` : "" };
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ tone: "warning" | "error"; text: string } | null>(null);

  function check(event: FormEvent) {
    event.preventDefault();
    const typed = Number(text.trim().replace(",", ".").replace("−", "-"));
    if (text.trim() === "" || Number.isNaN(typed)) {
      setMessage({ tone: "warning", text: t.word.sentenceNumber });
      return;
    }
    if (typed === value) {
      onCorrect();
      return;
    }
    onSlip();
    setMessage({ tone: "error", text: t.word.sentenceWrong });
  }

  return (
    <form className="answer-card" onSubmit={check} aria-labelledby={`${id}-title`} noValidate>
      <h3 id={`${id}-title`} className="build-title">
        {t.word.sentenceTitle}
      </h3>
      <p className="build-text">{t.word.sentenceText}</p>
      <p className="answer-question">{words.question}</p>
      <p className="answer-frame">
        {/* A fallback sentence has no words before the gap: the question above says what is asked. */}
        {frame.before}
        <input
          aria-label={words.question}
          className="write-input frame-input"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          size={4}
          onChange={(event) => {
            setText(event.target.value);
            setMessage(null);
          }}
        />
        {frame.after}
      </p>
      {message && (
        <p className={`final-feedback final-feedback-${message.tone}`} role="status">
          {message.tone === "error" ? <CircleX size={18} aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />} {message.text}
        </p>
      )}
      <div className="action-buttons">
        <button type="submit" className="button-primary" disabled={text.trim() === ""}>
          {t.word.sentenceCheck}
        </button>
      </div>
    </form>
  );
}
