"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  formatEquation,
  formatFraction,
  frac,
  mustParseEquation,
  type Exercise,
  type ExerciseResult,
  type LevelDefinition,
} from "@/lib/equations";
import { EXAMPLE_STORY, pickStoryRound, type Story } from "@/lib/tasks";
import { EquationBuilder, type BuiltResult } from "./EquationBuilder";
import type { RoundReport } from "./PracticeRound";
import { StoryCard } from "./StoryCard";
import { SolverWorkspace, type WorkspaceOutcome } from "./SolverWorkspace";
import { WorkedExample } from "./WorkedExample";
import type { MoveMode } from "./MoveTabs";

type Stage = "build" | "solve" | "answer";

interface WordProblemProps {
  story: Story;
  moveMode: MoveMode;
  onMoveModeChange: (mode: MoveMode) => void;
  continueLabel: string;
  onDone: (outcome: WorkspaceOutcome) => void;
}

/** One story: write the equation, solve it, then answer the question in words. */
function WordProblem({ story, moveMode, onMoveModeChange, continueLabel, onDone }: WordProblemProps) {
  const { lang, t } = useI18n();
  const intended = mustParseEquation(story.equations[0]);
  const [stage, setStage] = useState<Stage>("build");
  const [built, setBuilt] = useState<BuiltResult | null>(null);
  const [solved, setSolved] = useState<WorkspaceOutcome | null>(null);

  const words = story.i18n[lang];

  return (
    <div className="word-problem">
      <StoryCard story={story} />

      <ol className="word-steps" aria-label={t.word.storyLabel}>
        {[
          ["build", t.word.step1],
          ["solve", t.word.step2],
          ["answer", t.word.step3],
        ].map(([id, label]) => (
          <li key={id} className={id === stage ? "word-step word-step-current" : "word-step"} aria-current={id === stage ? "step" : undefined}>
            {label}
          </li>
        ))}
      </ol>

      {stage === "build" && (
        <EquationBuilder
          // A change of language starts the story again, so every message is in one language.
          key={lang}
          intended={intended}
          onBuilt={(result) => {
            setBuilt(result);
            setStage("solve");
          }}
        />
      )}

      {stage === "solve" && built && (
        <SolverWorkspace
          key={lang}
          equation={built.equation}
          continueLabel={t.word.answerTitle}
          moveMode={moveMode}
          onMoveModeChange={onMoveModeChange}
          onContinue={(outcome) => {
            setSolved(outcome);
            setStage("answer");
          }}
        />
      )}

      {stage === "answer" && built && solved && (
        <section className="answer-card" aria-labelledby="answer-heading">
          <h3 id="answer-heading" className="build-title">
            {t.word.answerTitle}
          </h3>
          <p className="answer-line">
            <CircleCheck size={20} aria-hidden="true" />
            <strong>{t.word.answerSolution(formatFraction(frac(story.solution)))}</strong>
          </p>
          <p className="answer-sentence">{words.answer}</p>
          <p className="build-text">{t.word.answerCheck}</p>
          <button
            type="button"
            className="button-primary"
            onClick={() =>
              onDone({
                steps: solved.steps,
                mistakes: solved.mistakes + built.mistakes,
                hints: solved.hints + built.hints,
              })
            }
          >
            {continueLabel} <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>
      )}
    </div>
  );
}

interface WordRoundProps {
  level: LevelDefinition;
  onComplete: (report: RoundReport) => void;
  onEquationSolved?: () => void;
  onExit: () => void;
}

function storyExercise(story: Story, index: number): Exercise {
  return { id: `${story.id}-${index}`, source: story.equations[0], equation: mustParseEquation(story.equations[0]) };
}

/** A run of word problems, easy ones first. Each one: write the equation, solve it, answer in words. */
export function WordRound({ level, onComplete, onEquationSolved, onExit }: WordRoundProps) {
  const { t } = useI18n();
  // Chosen once, when the learner starts the round, so server-rendered HTML never differs from the client.
  const [stories] = useState(() => pickStoryRound(Math.random, level.roundSize));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<readonly ExerciseResult[]>([]);
  const [moveMode, setMoveMode] = useState<MoveMode>("balance");
  const heading = useRef<HTMLHeadingElement>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    heading.current?.focus();
  }, [index]);

  const isLast = index + 1 === stories.length;

  function next(outcome: WorkspaceOutcome) {
    const exercise = storyExercise(stories[index], index);
    const updated = [...results, { id: exercise.id, ...outcome }];
    onEquationSolved?.();
    if (isLast) {
      onComplete({ exercises: stories.map(storyExercise), results: updated });
      return;
    }
    setResults(updated);
    setIndex(index + 1);
  }

  return (
    <section aria-label={t.solver.round.label}>
      <div className="round-head">
        <button type="button" className="back-link" onClick={onExit}>
          <ArrowLeft size={16} aria-hidden="true" /> {t.solver.round.leave}
        </button>
        <h2 className="round-title" tabIndex={-1} ref={heading}>
          {t.solver.round.titleWord(index + 1, stories.length)}
        </h2>
      </div>
      <ol className="pips" aria-label={t.solver.round.progress}>
        {stories.map((story, i) => (
          <li key={`${story.id}-${i}`} className={i < index ? "pip pip-done" : i === index ? "pip pip-current" : "pip"} aria-current={i === index ? "step" : undefined}>
            <span className="sr-only">{i < index ? t.solver.round.done : i === index ? t.solver.round.current : t.solver.round.todo}</span>
          </li>
        ))}
      </ol>
      <WordProblem
        key={`${stories[index].id}-${index}`}
        story={stories[index]}
        moveMode={moveMode}
        onMoveModeChange={setMoveMode}
        continueLabel={isLast ? t.word.finish : t.word.next}
        onDone={next}
      />
    </section>
  );
}

/** The worked example of the word-problem level: the story, how it becomes an equation, then the solution. */
export function WordExample({ level, onPractise }: { level: LevelDefinition; onPractise: () => void }) {
  const { lang, t } = useI18n();
  const words = EXAMPLE_STORY.i18n[lang];
  const equation = mustParseEquation(EXAMPLE_STORY.equations[0]);

  return (
    <div className="word-example">
      <StoryCard story={EXAMPLE_STORY} />
      <section className="build" aria-labelledby="example-build">
        <h3 className="build-title" id="example-build">
          {t.word.step1}
        </h3>
        <p className="build-text">{words.build}</p>
        <p className="build-preview">
          <span>{t.word.yourEquation}:</span> <strong>{formatEquation(equation)}</strong>
        </p>
      </section>
      <h3 className="build-title word-example-solve">{t.word.step2}</h3>
      <WorkedExample level={level} onPractise={onPractise} />
      <p className="answer-sentence">{words.answer}</p>
    </div>
  );
}
