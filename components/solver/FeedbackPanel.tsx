"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, CircleX, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import type { Notice, NoticeTone } from "@/lib/equations";

const ICONS: Record<NoticeTone, typeof Info> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
};

interface FeedbackPanelProps {
  notice: Notice | null;
  /** Hints revealed so far, weakest first. */
  hints: readonly string[];
  /** Shown while nothing has happened yet. */
  emptyText: string;
}

/**
 * Where the tutor talks to the learner.
 *
 * It is a polite live region, so screen readers announce new feedback and
 * hints without moving focus. Colour is never the only signal: every tone has
 * its own icon and a clear title.
 */
export function FeedbackPanel({ notice, hints, emptyText }: FeedbackPanelProps) {
  const { t } = useI18n();
  const Icon = notice ? ICONS[notice.tone] : Info;

  // Every new message is a new element, so its motion plays each time: a good answer glows, a mistake shakes.
  const [shown, setShown] = useState({ notice, count: 0 });
  if (shown.notice !== notice) setShown({ notice, count: shown.count + 1 });

  return (
    <div className="feedback-region" role="status" aria-live="polite">
      {notice ? (
        <div className={`notice notice-${notice.tone}`} key={shown.count}>
          <Icon className="notice-icon" size={22} aria-hidden="true" />
          <div className="notice-content">
            <p className="notice-title">{notice.title}</p>
            {notice.body.map((paragraph) => (
              <p className="notice-text" key={paragraph}>
                {paragraph}
              </p>
            ))}
            {notice.work && (
              <ul className="notice-work">
                {notice.work.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
            {notice.preview && (
              <p className="notice-preview">
                <span>{t.solver.feedback.ifYouDidThat}</span> <code>{notice.preview.applied}</code> <ArrowRight className="inline-icon" size={14} aria-hidden="true" />{" "}
                <code>{notice.preview.result}</code>
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="notice notice-empty">
          <Info className="notice-icon" size={22} aria-hidden="true" />
          <p className="notice-text">{emptyText}</p>
        </div>
      )}

      {hints.length > 0 && (
        <ol className="hints" aria-label={t.solver.feedback.hints}>
          {hints.map((hint, index) => (
            <li className="hint" key={index}>
              <Lightbulb className="hint-icon" size={18} aria-hidden="true" />
              <div>
                <span className="hint-label">{t.solver.feedback.hintOf(index + 1)}</span>
                <p>{hint}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
