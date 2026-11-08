"use client";

import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { getLevel } from "@/lib/equations";
import { startSession } from "@/components/practice/start";
import { TopicIcon } from "@/components/ui/icons";
import { AppLink } from "@/components/ui/AppLink";

export function LessonScreen({ topicId }: { topicId: string }) {
  const { lang, t } = useI18n();
  const topic = getTopic(topicId, lang);
  if (!topic) return null;
  const hasSolver = Boolean(getLevel(topic.id));
  const { before, mark, after } = topic.formula;

  return (
    <div className="panel">
      <AppLink className="back-link" route={{ name: "learn" }}>
        <ArrowLeft size={16} aria-hidden="true" /> {t.lesson.back}
      </AppLink>

      <header className={`lesson-top mod-${topic.colour}`}>
        <span className="lesson-art" aria-hidden="true">
          <TopicIcon name={topic.icon} size={30} />
        </span>
        <div>
          <p className="lesson-kicker">{t.lesson.kicker}</p>
          <h1>{topic.title}</h1>
          <p className="lesson-formula">
            {before}
            <mark>{mark}</mark>
            {after}
          </p>
        </div>
      </header>

      <p className="lead">{topic.description}</p>

      <section className="lesson-card" aria-labelledby="ideas-title">
        <h2 id="ideas-title">{t.lesson.keyIdeas}</h2>
        <ol className="lesson-list">
          {topic.lesson.map((line, index) => (
            <li key={line}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{line}</p>
            </li>
          ))}
        </ol>
        <div className="example-box">
          <div className="example-label">
            <Lightbulb size={16} aria-hidden="true" /> {t.lesson.remember}
          </div>
          <p>{t.lesson.rememberText}</p>
        </div>
      </section>

      <div className="action-row">
        {hasSolver && (
          <AppLink className="cta cta-inline" route={{ name: "solver", level: topic.id }}>
            {t.lesson.solve} <ArrowRight size={18} aria-hidden="true" />
          </AppLink>
        )}
        <button type="button" className={hasSolver ? "button-secondary" : "cta cta-inline"} onClick={() => startSession("exam", topic.id, 10)}>
          {t.lesson.practiseTopic}
          {!hasSolver && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
