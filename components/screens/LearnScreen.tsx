"use client";

import { ArrowRight } from "lucide-react";
import { getChapters, lessonOrder } from "@/content/chapters";
import { useI18n } from "@/hooks/useLang";
import { useProgress } from "@/hooks/useProgress";
import { finishedTopics } from "@/lib/progress";
import { ModuleCard } from "@/components/ui/Cards";
import { AppLink } from "@/components/ui/AppLink";

/** The lessons in chapters, in the order of the textbook, with the next lesson to take marked. */
export function LearnScreen() {
  const { lang, t } = useI18n();
  const finished = finishedTopics(useProgress());
  const chapters = getChapters(lang);
  const upNext = lessonOrder().find((id) => !finished.includes(id));

  return (
    <div className="panel">
      <header className="page-head">
        <h1>{t.learn.title}</h1>
        <p>{t.learn.intro}</p>
      </header>

      <div className="chapters">
        {chapters.map((chapter) => {
          const done = chapter.lessons.filter((lesson) => finished.includes(lesson.id)).length;
          const first = chapter.lessons[0];
          const complete = done === chapter.lessons.length;
          return (
            <section key={chapter.id} className={`chapter chapter-${chapter.colour}`} aria-labelledby={`chapter-${chapter.id}`}>
              <header className="chapter-head">
                <span className="chapter-number" aria-hidden="true">
                  {chapter.number}
                </span>
                <div className="chapter-titles">
                  <p className="chapter-kicker">{t.learn.chapter(chapter.number)}</p>
                  <h2 id={`chapter-${chapter.id}`}>{chapter.title}</h2>
                  <p className="chapter-subtitle">{chapter.subtitle}</p>
                </div>
                <p className={complete ? "chapter-progress chapter-progress-done" : "chapter-progress"}>{t.learn.lessonsDone(done, chapter.lessons.length)}</p>
              </header>
              <p className="chapter-text">{chapter.description}</p>
              <div className="chapter-lessons">
                {chapter.lessons.map((lesson) => (
                  <div key={lesson.id} className={lesson.id === upNext ? "lesson-slot lesson-slot-next" : "lesson-slot"}>
                    {lesson.id === upNext && <span className="lesson-next-tag">{t.learn.upNext}</span>}
                    <ModuleCard topic={lesson} done={finished.includes(lesson.id)} />
                  </div>
                ))}
              </div>
              {!complete && (
                <AppLink className="chapter-go" route={{ name: "lesson", topic: chapter.lessons.find((lesson) => !finished.includes(lesson.id))?.id ?? first.id }}>
                  {done === 0 ? t.learn.start : t.learn.goOn} <ArrowRight size={16} aria-hidden="true" />
                </AppLink>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
