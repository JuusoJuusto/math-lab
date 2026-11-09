"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  formatEquation,
  formatFraction,
  frac,
  levelText,
  mustParseEquation,
  pickFrom,
  planHand,
  roundVariant,
  toExercise,
  type Exercise,
  type HandVariant,
  type ExerciseResult,
  type LevelDefinition,
} from "@/lib/equations";
import { EXAMPLE_STORIES, explainBuild, pickStoryRound, type Story } from "@/lib/tasks";
import { crossedMilestones, percentDone } from "@/src/studyHubMilestones";
import { reportProgress } from "@/src/studyHubProgress";
import { AnswerSentence } from "./AnswerSentence";
import { EquationWriter, type BuiltResult } from "./EquationWriter";
import type { RoundReport } from "./PracticeRound";
import { HandWorkspace } from "./HandWorkspace";
import { StoryCard } from "./StoryCard";
import { StoryWalkthrough } from "./StoryWalkthrough";
import { SolverWorkspace, type WorkspaceOutcome } from "./SolverWorkspace";
import type { MoveMode } from "./MoveTabs";

type Stage = "build" | "solve" | "answer";

/**
 * A story whose question asks for something worked out from x (the dearer of
 * two prices, the longest side). Solving the equation is not the end: the
 * learner has to go back to the question, as the textbook procedure says.
 */
function QuestionAnswer({ story, onCorrect, onSlip }: { story: Story; onCorrect: () => void; onSlip: () => void }) {
  const { lang, t } = useI18n();
  const id = useId();
  const words = story.i18n[lang];
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function check(event: FormEvent) {
    event.preventDefault();
    const typed = Number(value.trim().replace(",", "."));
    if (value.trim() === "" || Number.isNaN(typed)) {
      setMessage(t.word.finalNumber);
      return;
    }
    if (typed === story.final) {
      onCorrect();
      return;
    }
    onSlip();
    setMessage(typed === story.solution ? t.word.finalWasX(formatFraction(frac(story.solution))) : t.word.finalWrong);
  }

  return (
    <form className="answer-card" onSubmit={check} aria-labelledby={`${id}-title`} noValidate>
      <h3 id={`${id}-title`} className="build-title">
        {t.word.finalTitle}
      </h3>
      <p className="answer-line">
        <CircleCheck size={20} aria-hidden="true" />
        <strong>{t.word.answerSolution(formatFraction(frac(story.solution)))}</strong>
      </p>
      <p className="build-text">{t.word.finalText}</p>
      <p className="answer-sentence">{words.question}</p>
      <label className="build-label" htmlFor={`${id}-field`}>
        {t.word.finalLabel}
      </label>
      <div className="final-row">
        <input
          id={`${id}-field`}
          className="write-input final-input"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        {words.unit && <span className="final-unit">{words.unit}</span>}
      </div>
      {message && (
        <p className="final-feedback" role="status">
          {message}
        </p>
      )}
      <div className="action-buttons">
        <button type="submit" className="button-primary" disabled={value.trim() === ""}>
          {t.word.finalCheck}
        </button>
      </div>
    </form>
  );
}

interface WordProblemProps {
  story: Story;
  moveMode: MoveMode;
  onMoveModeChange: (mode: MoveMode) => void;
  continueLabel: string;
  /** How the built equation is solved: by hand in one of the formats, or with the buttons when `null`. */
  handVariant?: HandVariant | null;
  onDone: (outcome: WorkspaceOutcome) => void;
}

/** One story: write the equation, solve it, then answer the question in words. */
function WordProblem({ story, moveMode, onMoveModeChange, continueLabel, handVariant = null, onDone }: WordProblemProps) {
  const { lang, t } = useI18n();
  const intended = mustParseEquation(story.equations[0]);
  const [stage, setStage] = useState<Stage>("build");
  const [built, setBuilt] = useState<BuiltResult | null>(null);
  const [solved, setSolved] = useState<WorkspaceOutcome | null>(null);
  // Every story ends with the learner answering the question: a number for what is asked, then the sentence.
  const [finalDone, setFinalDone] = useState(false);
  const [slips, setSlips] = useState(0);

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
        <EquationWriter
          // A change of language starts the story again, so every message is in one language.
          key={lang}
          intended={intended}
          help={{ letX: words.letX, build: words.build, explain: explainBuild(words.build, story.equations[0]) }}
          onBuilt={(result) => {
            setBuilt(result);
            setStage("solve");
          }}
        />
      )}

      {stage === "solve" && built && handVariant !== null && (
        <HandWorkspace
          key={`${lang}-hand`}
          source={formatEquation(built.equation)}
          equation={built.equation}
          plan={planHand(formatEquation(built.equation), handVariant, pickFrom(story.id))}
          continueLabel={t.word.answerTitle}
          onContinue={(outcome) => {
            setSolved(outcome);
            setStage("answer");
          }}
        />
      )}

      {stage === "solve" && built && handVariant === null && (
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

      {stage === "answer" && built && solved && !finalDone && (
        story.final !== undefined ? (
          <QuestionAnswer story={story} onCorrect={() => setFinalDone(true)} onSlip={() => setSlips((count) => count + 1)} />
        ) : (
          <AnswerSentence story={story} value={story.solution} onCorrect={() => setFinalDone(true)} onSlip={() => setSlips((count) => count + 1)} />
        )
      )}

      {stage === "answer" && built && solved && finalDone && (
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
                mistakes: solved.mistakes + built.mistakes + slips,
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
  return toExercise({ id: `${story.id}-${index}`, equation: story.equations[0] });
}

/** A run of word problems, easy ones first. Each one: write the equation, solve it, answer in words. */
export function WordRound({ level, onComplete, onEquationSolved, onExit }: WordRoundProps) {
  const { lang, t } = useI18n();
  // Chosen once, when the learner starts the round, so server-rendered HTML never differs from the client.
  const [stories] = useState(() => pickStoryRound(Math.random, level.roundSize, level.tiers));
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
    for (const value of crossedMilestones(percentDone(index, stories.length), percentDone(index + 1, stories.length))) {
      reportProgress("progress", { label: levelText(level, lang).title, ref: `lesson-${level.id}`, value });
    }
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
        handVariant={roundVariant(index, stories.length)}
        onDone={next}
      />
    </section>
  );
}

/** The worked example of the word-problem level: a story, turned into an equation in six steps, and solved. */
export function WordExample({ level, onPractise }: { level: LevelDefinition; onPractise: () => void }) {
  const story = EXAMPLE_STORIES[level.id === "hard-word" ? "hard-word" : "word"];
  return <StoryWalkthrough level={level} story={story} onPractise={onPractise} />;
}
