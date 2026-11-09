"use client";

import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { navigate } from "@/hooks/useRoute";
import { updateProgress, useProgress } from "@/hooks/useProgress";
import { getLevel } from "@/lib/equations";
import { XP, addXp, finishedTopics, recordSolverLevel } from "@/lib/progress";
import { chapterOf } from "@/content/chapters";
import { reportProgress } from "@/src/studyHubProgress";
import { SolverView } from "@/components/solver/SolverView";
import { startSession } from "@/components/practice/start";

/** Connects the solver to navigation and progress. */
export function SolverScreen({ levelId }: { levelId: string }) {
  const { lang } = useI18n();
  const level = getLevel(levelId);
  const topic = getTopic(levelId, lang);
  const progress = useProgress();
  if (!level || !topic) return null;

  // Finishing a lesson for the first time is worth noting, and so is finishing the last lesson of a chapter.
  function reportCompletion(id: string) {
    if (progress.solverLevels.includes(id)) return;
    reportProgress("completed", { label: topic!.title, ref: `lesson-${id}` });
    const place = chapterOf(id, lang);
    if (!place) return;
    const before = finishedTopics(progress);
    const after = finishedTopics({ ...progress, solverLevels: [...progress.solverLevels, id] });
    const allNow = place.chapter.lessons.every((lesson) => after.includes(lesson.id));
    const allBefore = place.chapter.lessons.every((lesson) => before.includes(lesson.id));
    if (allNow && !allBefore) reportProgress("completed", { label: place.chapter.title, ref: `chapter-${place.chapter.id}` });
  }

  return (
    <SolverView
      key={level.id}
      level={level}
      topic={topic}
      onComplete={(id) => {
        reportCompletion(id);
        updateProgress((old) => recordSolverLevel(old, id));
      }}
      onEquationSolved={() => updateProgress((old) => addXp(old, XP.solverEquation))}
      onExit={() => navigate({ name: "learn" })}
      onOpenLevel={(id) => navigate({ name: "solver", level: id })}
      // A short quiz: five questions on this lesson.
      onQuiz={(topicId) => startSession("quiz", topicId, 5)}
    />
  );
}
