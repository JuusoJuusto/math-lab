"use client";

import { useEffect, useId, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/hooks/useLang";

interface KnowledgePopupProps {
  /** The lesson the learner seems to know. */
  topicTitle: string;
  onQuiz: () => void;
  onClose: () => void;
}

/**
 * "You seem to know this: want to test it?" A modal dialog that appears when the
 * app thinks the learner has understood a lesson. Escape, a click outside or
 * "Not now" closes it; focus starts on the quiz button so Enter accepts.
 */
export function KnowledgePopup({ topicTitle, onQuiz, onClose }: KnowledgePopupProps) {
  const { t } = useI18n();
  const words = t.solver.knowledge;
  const id = useId();
  const accept = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    accept.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="popup-backdrop" onClick={onClose} data-testid="knowledge-popup">
      <div className="popup" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} onClick={(event) => event.stopPropagation()}>
        <span className="popup-icon" aria-hidden="true">
          <Sparkles size={34} />
        </span>
        <h2 id={`${id}-title`}>{words.title}</h2>
        <p id={`${id}-text`}>{words.text(topicTitle)}</p>
        <div className="popup-actions">
          <button type="button" className="button-primary" ref={accept} onClick={onQuiz}>
            {words.yes}
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            {words.no}
          </button>
        </div>
      </div>
    </div>
  );
}
