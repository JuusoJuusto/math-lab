"use client";

import { BookOpen } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import type { Story } from "@/lib/tasks";

/** The word problem: the situation, what x stands for, and the question. */
export function StoryCard({ story }: { story: Story }) {
  const { lang, t } = useI18n();
  const text = story.i18n[lang];
  return (
    <section className="story" aria-label={t.word.storyLabel}>
      <p className="story-label">
        <BookOpen size={16} aria-hidden="true" /> {t.word.storyLabel}
      </p>
      <p className="story-text">
        {text.situation} <strong>{text.letX}</strong>
      </p>
      <p className="story-question">{text.question}</p>
    </section>
  );
}
