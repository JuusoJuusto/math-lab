"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import type { LevelDefinition } from "@/lib/equations";
import type { Topic } from "@/content/topics";
import { LevelComplete } from "./LevelComplete";
import { LevelIntro } from "./LevelIntro";
import { PracticeRound, type RoundReport } from "./PracticeRound";
import { WorkedExample } from "./WorkedExample";

type Stage = "learn" | "example" | "practice" | "complete";

const STAGES: readonly { id: Exclude<Stage, "complete">; label: string }[] = [
  { id: "learn", label: "Learn" },
  { id: "example", label: "Example" },
  { id: "practice", label: "Practise" },
];

interface SolverViewProps {
  level: LevelDefinition;
  topic: Topic;
  /** Called once each time the learner finishes a practice round. */
  onComplete: (levelId: LevelDefinition["id"]) => void;
  onExit: () => void;
  onOpenLevel: (levelId: string) => void;
  onQuiz: (topicId: string) => void;
}

/**
 * One level of the equation solver: learn, see an example, practise, finish.
 * The stage switcher lets learners revisit the idea or example at any time.
 */
export function SolverView({ level, topic, onComplete, onExit, onOpenLevel, onQuiz }: SolverViewProps) {
  const [stage, setStage] = useState<Stage>("learn");
  const [roundId, setRoundId] = useState(0);
  const [previousIds, setPreviousIds] = useState<readonly string[]>([]);
  const [report, setReport] = useState<RoundReport | null>(null);
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
  }

  function finishRound(finished: RoundReport) {
    setReport(finished);
    setPreviousIds(finished.exercises.map((exercise) => exercise.id));
    setStage("complete");
    onComplete(level.id);
  }

  const activeIndex = STAGES.findIndex((item) => item.id === stage);

  return (
    <section className="page-section solver" aria-label={`${level.title} solver`} ref={root}>
      <button type="button" className="back-link" onClick={onExit}>
        <ArrowLeft size={16} aria-hidden="true" /> All topics
      </button>

      <div className="lesson-hero">
        <span className={`topic-icon large tone-${topic.colour}`} aria-hidden="true">
          {topic.icon}
        </span>
        <div>
          <span className="section-kicker">LEVEL {level.number} · EQUATION SOLVER</span>
          <h1>{level.title}</h1>
          <p>{level.tagline}</p>
        </div>
      </div>

      {stage !== "complete" && (
        <nav aria-label="Level steps">
          <ol className="stages">
            {STAGES.map((item, index) => {
              const state = index < activeIndex ? "done" : index === activeIndex ? "current" : "todo";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`stage stage-${state}`}
                    aria-current={state === "current" ? "step" : undefined}
                    onClick={() => (item.id === "practice" ? (stage === "practice" ? undefined : startPractice()) : setStage(item.id))}
                  >
                    <span className="stage-number" aria-hidden="true">
                      {state === "done" ? <Check size={14} /> : index + 1}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {stage === "learn" && <LevelIntro level={level} onNext={() => setStage("example")} onSkip={startPractice} />}
      {stage === "example" && <WorkedExample level={level} onPractise={startPractice} />}
      {stage === "practice" && (
        <PracticeRound key={roundId} level={level} avoid={previousIds} onComplete={finishRound} onExit={onExit} />
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
