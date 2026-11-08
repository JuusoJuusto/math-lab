"use client";

import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { getTopic } from "@/content/topics";
import { getLevel } from "@/lib/equations";
import { toHash } from "@/lib/routes";
import { startSession } from "@/components/practice/start";
import { TopicIcon } from "@/components/ui/icons";

export function LessonScreen({ topicId }: { topicId: string }) {
  const topic = getTopic(topicId);
  if (!topic) return null;
  const hasSolver = Boolean(getLevel(topic.id));
  const { before, mark, after } = topic.formula;

  return (
    <div className="panel">
      <a className="back-link" href={toHash({ name: "learn" })}>
        <ArrowLeft size={16} aria-hidden="true" /> All topics
      </a>

      <header className={`lesson-top mod-${topic.colour}`}>
        <span className="lesson-art" aria-hidden="true">
          <TopicIcon name={topic.icon} size={30} />
        </span>
        <div>
          <p className="lesson-kicker">Quick lesson</p>
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
        <h2 id="ideas-title">Key ideas</h2>
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
            <Lightbulb size={16} aria-hidden="true" /> Remember
          </div>
          <p>Always perform the same operation on both sides of an equation to keep it balanced.</p>
        </div>
      </section>

      <div className="action-row">
        {hasSolver && (
          <a className="cta cta-inline" href={toHash({ name: "solver", level: topic.id })}>
            Solve step by step <ArrowRight size={18} aria-hidden="true" />
          </a>
        )}
        <button type="button" className={hasSolver ? "button-secondary" : "cta cta-inline"} onClick={() => startSession("exam", topic.id, 10)}>
          Practise this topic
          {!hasSolver && <ArrowRight size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
