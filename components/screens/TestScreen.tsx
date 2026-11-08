"use client";

import { useState } from "react";
import { ClipboardCheck, Play } from "lucide-react";
import { getChapters } from "@/content/chapters";
import { useI18n } from "@/hooks/useLang";
import { useProgress } from "@/hooks/useProgress";
import { finishedTopics } from "@/lib/progress";
import { startSession } from "@/components/practice/start";

const COUNTS = [10, 20, 30] as const;

/**
 * A practice test: the learner picks the chapters the test covers and how many
 * tasks, and gets a mixed set that climbs from easy to hard and includes whole
 * equations solved by hand. The chapters they have already worked on are chosen to begin with.
 */
export function TestScreen() {
  const { lang, t } = useI18n();
  const words = t.testScreen;
  const finished = finishedTopics(useProgress());
  const chapters = getChapters(lang);

  const worked = chapters.filter((chapter) => chapter.lessons.some((lesson) => finished.includes(lesson.id))).map((chapter) => chapter.id);
  const fallback = worked.length > 0 ? worked : chapters.slice(0, 2).map((chapter) => chapter.id);
  const [picked, setPicked] = useState<readonly string[] | null>(null);
  const [count, setCount] = useState<number>(20);
  const chosen = picked ?? fallback;

  function toggle(id: string) {
    setPicked(chosen.includes(id) ? chosen.filter((item) => item !== id) : [...chosen, id]);
  }

  const topics = chapters.filter((chapter) => chosen.includes(chapter.id)).flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id));

  return (
    <div className="panel test-screen">
      <header className="page-head">
        <h1>
          <ClipboardCheck size={30} aria-hidden="true" /> {words.title}
        </h1>
        <p>{words.intro}</p>
      </header>

      <section className="test-kinds" aria-label={words.kinds}>
        <h2>{words.kinds}</h2>
        <ul>
          {words.kindsList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <fieldset className="test-chapters">
        <legend>{words.chapters}</legend>
        <div className="test-actions">
          <button type="button" className="chip-button" onClick={() => setPicked(chapters.map((chapter) => chapter.id))}>
            {words.all}
          </button>
          <button type="button" className="chip-button" onClick={() => setPicked([])}>
            {words.clear}
          </button>
        </div>
        {picked === null && worked.length > 0 && <p className="test-note">{words.chosenFor}</p>}
        <ul className="test-list">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <label className={chosen.includes(chapter.id) ? `test-chapter test-chapter-on chapter-${chapter.colour}` : `test-chapter chapter-${chapter.colour}`}>
                <input type="checkbox" checked={chosen.includes(chapter.id)} onChange={() => toggle(chapter.id)} />
                <span className="chapter-number" aria-hidden="true">
                  {chapter.number}
                </span>
                <span className="test-chapter-text">
                  <strong>{chapter.title}</strong>
                  <span>{chapter.subtitle}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="chips">
        <legend>{words.count}</legend>
        {COUNTS.map((value) => (
          <label key={value} className="chip">
            <input type="radio" name="test-count" checked={count === value} onChange={() => setCount(value)} />
            <span>{words.tasks(value)}</span>
          </label>
        ))}
      </fieldset>

      {topics.length === 0 && <p className="field-error" role="alert">{words.noneChosen}</p>}
      <button type="button" className="cta cta-inline" disabled={topics.length === 0} onClick={() => startSession("test", topics.join(","), count)}>
        <Play size={18} aria-hidden="true" /> {words.start}
      </button>
    </div>
  );
}
