"use client";

import { ArrowRight } from "lucide-react";
import { topics } from "@/content/topics";
import { navigate } from "@/hooks/useRoute";
import { useProgress } from "@/hooks/useProgress";
import { LEVELS } from "@/lib/equations";
import { accuracyOf, finishedTopics, levelOf, overallProgress, xpIntoLevel, XP_PER_LEVEL } from "@/lib/progress";
import { getMode, type ModeId } from "@/lib/tasks";
import { toHash } from "@/lib/routes";
import { LogoMark, Wordmark } from "@/components/shell/Logo";
import { ModeCard, ModuleCard } from "@/components/ui/Cards";
import { TryItNow } from "@/components/ui/TryItNow";

const HOME_MODES: readonly ModeId[] = ["daily", "quiz", "solve", "truefalse", "step", "mistake", "equation", "exam"];
const CAPTIONS: Partial<Record<ModeId, string>> = {
  daily: "5 tasks · +25 XP",
  quiz: "10 questions",
  solve: "Type the answer",
  truefalse: "Is it a solution?",
  step: "Name the step",
  mistake: "Spot the error",
  equation: "From a story",
  exam: "20 tasks",
};

export function HomeScreen() {
  const progress = useProgress();
  const finished = finishedTopics(progress);
  const overall = overallProgress(progress, topics.length);
  const nextLevel = LEVELS.find((level) => !progress.solverLevels.includes(level.id));
  const started = progress.solverLevels.length > 0 || progress.attempts > 0;

  function start() {
    if (nextLevel) navigate({ name: "solver", level: nextLevel.id });
    else navigate({ name: "practice" });
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-brand">
          <LogoMark size={76} />
          <Wordmark large />
        </div>
        <h1 id="hero-title">Solve equations, step by step!</h1>
        <p>
          Learn how equations work, then practise for your exam with quizzes, mistake hunts and timed challenges. Every answer comes with an explanation.
        </p>
        <a className="mastery" href={toHash({ name: "progress" })}>
          <span>Overall progress</span>
          <strong>{overall} %</strong>
        </a>
      </section>

      <div className="panel">
        <button type="button" className="cta" onClick={start}>
          {started ? "Continue learning" : "Start learning"} <ArrowRight size={20} aria-hidden="true" />
        </button>

        <section className="block" aria-labelledby="learn-title">
          <div className="block-head">
            <h2 id="learn-title">Learn equations</h2>
            <a className="inline-link" href={toHash({ name: "learn" })}>
              All topics
            </a>
          </div>
          <div className="grid-4">
            {topics.slice(0, 4).map((topic) => (
              <ModuleCard key={topic.id} topic={topic} done={finished.includes(topic.id)} />
            ))}
          </div>
        </section>

        <section className="block" aria-labelledby="practise-title">
          <div className="block-head">
            <h2 id="practise-title">Practise</h2>
            <a className="inline-link" href={toHash({ name: "practice" })}>
              All ways to practise
            </a>
          </div>
          <div className="grid-4">
            {HOME_MODES.map((id) => {
              const mode = getMode(id)!;
              return <ModeCard key={id} mode={mode} caption={CAPTIONS[id]} />;
            })}
          </div>
        </section>

        <section className="progress-note" aria-labelledby="note-title">
          <div className="block-head">
            <h2 id="note-title">Your progress</h2>
            <a className="inline-link" href={toHash({ name: "progress" })}>
              All stats
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
          {progress.attempts === 0 ? (
            <p>You have not practised yet. The first round takes only a few minutes, and every correct answer earns XP.</p>
          ) : (
            <p>
              {progress.attempts} tasks answered · {accuracyOf(progress)} % correct · level {levelOf(progress.xp)} ({xpIntoLevel(progress.xp)} / {XP_PER_LEVEL} XP to the next level)
            </p>
          )}
        </section>
      </div>

      <div className="duo">
        <section className="panel how" aria-labelledby="how-title">
          <h2 id="how-title">How MathLab works</h2>
          <ol>
            <li>
              <span aria-hidden="true">1</span>
              <p>
                <strong>Learn the idea.</strong> Open a topic, read the key ideas and watch a worked example.
              </p>
            </li>
            <li>
              <span aria-hidden="true">2</span>
              <p>
                <strong>Solve it yourself.</strong> Choose what to do to both sides. You get feedback on every step.
              </p>
            </li>
            <li>
              <span aria-hidden="true">3</span>
              <p>
                <strong>Practise for the exam.</strong> Mix task types, fix your mistakes and earn XP.
              </p>
            </li>
          </ol>
        </section>
        <div className="panel">
          <TryItNow />
        </div>
      </div>
    </>
  );
}
