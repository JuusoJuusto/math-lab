"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { levelText, summariseRound, thinksYouKnow, type LevelDefinition } from "@/lib/equations";
import { reportProgress } from "@/src/studyHubProgress";
import type { Topic } from "@/content/topics";
import { TopicIcon } from "@/components/ui/icons";
import { KnowledgePopup } from "@/components/ui/KnowledgePopup";
import { LevelComplete } from "./LevelComplete";
import { LevelIntro } from "./LevelIntro";
import { PracticeRound, type RoundReport } from "./PracticeRound";
import { WorkedExample } from "./WorkedExample";
import { WordExample, WordRound } from "./WordRound";

type Stage = "learn" | "example" | "practice" | "complete";

const STAGES: readonly Exclude<Stage, "complete">[] = ["learn", "example", "practice"];

interface SolverViewProps {
  level: LevelDefinition;
  topic: Topic;
  /** Called once each time the learner finishes a practice round. */
  onComplete: (levelId: LevelDefinition["id"]) => void;
  /** Called each time an equation is solved, for awarding XP. */
  onEquationSolved?: () => void;
  onExit: () => void;
  onOpenLevel: (levelId: string) => void;
  onQuiz: (topicId: string) => void;
}

/**
 * One level of the equation solver: learn, see an example, practise, finish.
 * The stage switcher lets learners revisit the idea or example at any time.
 */
export function SolverView({ level, topic, onComplete, onEquationSolved, onExit, onOpenLevel, onQuiz }: SolverViewProps) {
  const { lang, t } = useI18n();
  const text = levelText(level, lang);
  const [stage, setStage] = useState<Stage>("learn");
  const [roundId, setRoundId] = useState(0);
  const [previousIds, setPreviousIds] = useState<readonly string[]>([]);
  const [report, setReport] = useState<RoundReport | null>(null);
  // The popup is shown once per finished round; closing it keeps it closed until the next round.
  const [dismissedRound, setDismissedRound] = useState<number | null>(null);
  const root = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // Start at the top when the solver opens.
  useEffect(() => {
    document.documentElement.scrollTop = 0;
  }, []);

  // When the stage changes, the button the learner pressed disappears. Move focus to the new stage
  // marker (or the completion heading) so keyboard and screen-reader users land at the top of the
  // new content, and so phones scroll back up instead of staying at the old position.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    root.current?.querySelector<HTMLElement>('.stage[aria-current="step"], #complete-heading')?.focus();
  }, [stage, roundId]);

  function startPractice() {
    setRoundId((id) => id + 1);
    setStage("practice");
    reportProgress("started", { label: text.title, ref: `lesson-${level.id}` });
  }

  function finishRound(finished: RoundReport) {
    // The score of a round is how many equations were solved without a hint or a wrong move.
    reportProgress("score", { label: text.title, ref: `lesson-${level.id}`, value: summariseRound(finished.results).cleanSolves, max: finished.exercises.length });
    setReport(finished);
    setPreviousIds(finished.exercises.map((exercise) => exercise.id));
    setStage("complete");
    onComplete(level.id);
  }

  const activeIndex = STAGES.findIndex((item) => item === stage);

  return (
    <section className="panel solver" aria-label={t.solver.label(text.title)} ref={root}>
      <button type="button" className="back-link" onClick={onExit}>
        <ArrowLeft size={16} aria-hidden="true" /> {t.solver.back}
      </button>

      <header className={`lesson-top solver-top mod-${topic.colour}`}>
        <span className="lesson-art" aria-hidden="true">
          <TopicIcon name={topic.icon} size={30} />
        </span>
        <div>
          <p className="lesson-kicker">{t.solver.kicker(level.number)}</p>
          <h1>{text.title}</h1>
          <p className="lesson-formula">{text.tagline}</p>
        </div>
      </header>

      {stage !== "complete" && (
        <nav aria-label={t.solver.stagesNav}>
          <ol className="stages">
            {STAGES.map((item, index) => {
              const state = index < activeIndex ? "done" : index === activeIndex ? "current" : "todo";
              return (
                <li key={item}>
                  <button
                    type="button"
                    className={`stage stage-${state}`}
                    aria-current={state === "current" ? "step" : undefined}
                    onClick={() => (item === "practice" ? (stage === "practice" ? undefined : startPractice()) : setStage(item))}
                  >
                    <span className="stage-number" aria-hidden="true">
                      {state === "done" ? <Check size={14} /> : index + 1}
                    </span>
                    {t.solver.stages[item]}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {stage === "learn" && <LevelIntro level={level} onNext={() => setStage("example")} onSkip={startPractice} />}
      {stage === "example" &&
        (level.kind === "stories" ? <WordExample level={level} onPractise={startPractice} /> : <WorkedExample level={level} onPractise={startPractice} />)}
      {stage === "practice" &&
        (level.kind === "stories" ? (
          <WordRound key={roundId} level={level} onComplete={finishRound} onEquationSolved={onEquationSolved} onExit={onExit} />
        ) : (
          <PracticeRound key={roundId} level={level} avoid={previousIds} onComplete={finishRound} onEquationSolved={onEquationSolved} onExit={onExit} />
        ))}
      {stage === "complete" && report && thinksYouKnow(summariseRound(report.results), level.roundSize) && dismissedRound !== roundId && (
        <KnowledgePopup topicTitle={topic.title} onQuiz={() => onQuiz(topic.id)} onClose={() => setDismissedRound(roundId)} />
      )}

      {stage === "complete" && report && (
        <LevelComplete
          level={level}
          report={report}
          onPractiseAgain={startPractice}
          onNextLevel={onOpenLevel}
          onQuiz={() => onQuiz(topic.id)}
          onTopics={onExit}
        />
      )}
    </section>
  );
}
