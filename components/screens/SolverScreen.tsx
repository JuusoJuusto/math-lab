"use client";

import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { navigate } from "@/hooks/useRoute";
import { updateProgress } from "@/hooks/useProgress";
import { getLevel } from "@/lib/equations";
import { XP, addXp, recordSolverLevel } from "@/lib/progress";
import { SolverView } from "@/components/solver/SolverView";
import { startSession } from "@/components/practice/start";

/** Connects the solver to navigation and progress. */
export function SolverScreen({ levelId }: { levelId: string }) {
  const { lang } = useI18n();
  const level = getLevel(levelId);
  const topic = getTopic(levelId, lang);
  if (!level || !topic) return null;

  return (
    <SolverView
      key={level.id}
      level={level}
      topic={topic}
      onComplete={(id) => {
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
