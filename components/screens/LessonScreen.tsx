"use client";

import { ArrowLeft, ArrowRight, Check, CircleCheck, Lightbulb, TriangleAlert } from "lucide-react";
import { chapterOf, nextLesson } from "@/content/chapters";
import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { useProgress } from "@/hooks/useProgress";
import { getLevel } from "@/lib/equations";
import { keepMathTogether } from "@/lib/mathText";
import { finishedTopics } from "@/lib/progress";
import { startSession } from "@/components/practice/start";
import { TopicIcon } from "@/components/ui/icons";
import { LessonExample } from "./LessonExample";
import { AppLink } from "@/components/ui/AppLink";

export function LessonScreen({ topicId }: { topicId: string }) {
  const { lang, t } = useI18n();
  const progress = useProgress();
  const topic = getTopic(topicId, lang);
  if (!topic) return null;
  const level = getLevel(topic.id);
  const hasSolver = Boolean(level);
  const place = chapterOf(topic.id, lang);
  const following = nextLesson(topic.id);
  const finished = finishedTopics(progress).includes(topic.id);
  const { before, mark, after } = topic.formula;
  const words = t.lesson;

  return (
    <div className="panel">
      <AppLink className="back-link" route={{ name: "learn" }}>
        <ArrowLeft size={16} aria-hidden="true" /> {words.back}
      </AppLink>

      <header className={`lesson-top mod-${topic.colour}`}>
        <span className="lesson-art" aria-hidden="true">
          <TopicIcon name={topic.icon} size={30} />
        </span>
        <div>
          <p className="lesson-kicker">
            {place ? `${words.chapterKicker(place.chapter.number, place.chapter.title)} · ${words.lessonOf(place.index + 1, place.chapter.lessons.length)}` : words.kicker}
          </p>
          <h1>{topic.title}</h1>
          <p className="lesson-formula">
            {before}
            <mark>{mark}</mark>
            {after}
          </p>
        </div>
        {finished && (
          <span className="lesson-status">
            <CircleCheck size={16} aria-hidden="true" /> {t.topic.finished}
          </span>
        )}
      </header>

      <p className="lead">{keepMathTogether(topic.description)}</p>

      <section className="lesson-card" aria-labelledby="ideas-title">
        <h2 id="ideas-title">{words.keyIdeas}</h2>
        <ol className="lesson-list">
          {topic.lesson.map((line, index) => (
            <li key={line}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{keepMathTogether(line)}</p>
            </li>
          ))}
        </ol>
      </section>

      {level && <LessonExample level={level} />}

      <div className="lesson-notes">
        <section className="note note-remember" aria-labelledby="remember-title">
          <h2 id="remember-title">
            <Lightbulb size={18} aria-hidden="true" /> {words.remember}
          </h2>
          <p>{keepMathTogether(topic.remember)}</p>
        </section>
        <section className="note note-watch" aria-labelledby="watch-title">
          <h2 id="watch-title">
            <TriangleAlert size={18} aria-hidden="true" /> {words.watchOut}
          </h2>
          <p>{keepMathTogether(topic.watchOut)}</p>
        </section>
      </div>

      <section className="path" aria-labelledby="path-title">
        <h2 id="path-title">{words.pathTitle}</h2>
        <ol className="path-steps">
          <li className="path-step path-step-done">
            <span className="path-badge" aria-hidden="true">
              <Check size={18} />
            </span>
            <div className="path-body">
              <h3>{words.readTitle}</h3>
              <p>{words.readText}</p>
            </div>
          </li>

          {hasSolver && (
            <li className={`path-step ${finished ? "path-step-done" : "path-step-next"}`}>
              <span className="path-badge" aria-hidden="true">
                {finished ? <Check size={18} /> : 2}
              </span>
              <div className="path-body">
                <h3>{words.solveTitle}</h3>
                <p>{words.solveText}</p>
                <AppLink className="cta cta-inline" route={{ name: "solver", level: topic.id }}>
                  {words.solve} <ArrowRight size={18} aria-hidden="true" />
                </AppLink>
              </div>
            </li>
          )}

          <li className={`path-step ${hasSolver ? "" : "path-step-next"}`}>
            <span className="path-badge" aria-hidden="true">
              {hasSolver ? 3 : 2}
            </span>
            <div className="path-body">
              <h3>{words.practiseTitle}</h3>
              <p>{words.practiseText}</p>
              <div className="path-actions">
                <button type="button" className={hasSolver ? "button-secondary" : "cta cta-inline"} onClick={() => startSession("exam", topic.id, 10)}>
                  {words.practiseTopic}
                  {!hasSolver && <ArrowRight size={18} aria-hidden="true" />}
                </button>
                <button type="button" className="text-link" onClick={() => startSession("quiz", topic.id, 5)}>
                  {words.quiz}
                </button>
              </div>
            </div>
          </li>
        </ol>
      </section>

      <div className="lesson-next">
        {following ? (
          <AppLink className="button-secondary lesson-next-link" route={{ name: "lesson", topic: following }}>
            {words.nextLesson}: {getTopic(following, lang)?.title} <ArrowRight size={16} aria-hidden="true" />
          </AppLink>
        ) : (
          <p className="lesson-next-done">{words.lastLesson}</p>
        )}
      </div>
    </div>
  );
}
