"use client";

import { ArrowRight, CircleCheck, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { getTopic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { formatEquation, formatFraction, getNextLevel, levelText, localiseDecimals, solveEquation, summariseRound, type LevelDefinition } from "@/lib/equations";
import { keepMathTogether } from "@/lib/mathText";
import type { RoundReport } from "./PracticeRound";

interface LevelCompleteProps {
  level: LevelDefinition;
  report: RoundReport;
  onPractiseAgain: () => void;
  onNextLevel: (levelId: string) => void;
  onQuiz: () => void;
  onTopics: () => void;
}

/** The completion state: a short recap, and clear next steps including practising again. */
export function LevelComplete({ level, report, onPractiseAgain, onNextLevel, onQuiz, onTopics }: LevelCompleteProps) {
  const { lang, t } = useI18n();
  const summary = summariseRound(report.results);
  const next = getNextLevel(level.id);
  const words = t.solver.complete;
  const mistakes = report.results.reduce((total, result) => total + result.mistakes, 0);
  const idea = getTopic(level.id, lang)?.remember;

  return (
    <section className="results-card level-complete" aria-labelledby="complete-heading">
      <div className="results-medal">
        <Trophy size={34} aria-hidden="true" />
      </div>
      <span className="section-kicker">{words.kicker(level.number)}</span>
      <h2 id="complete-heading" className="complete-heading" tabIndex={-1}>
        {words.heading(levelText(level, lang).title)}
      </h2>
      <p>{words.solved(summary.solved, summary.hintsUsed, level.kind === "stories")}</p>

      <ul className="round-stats" aria-label={words.statsLabel}>
        <li className={summary.cleanSolves === summary.solved ? "stat stat-good" : "stat"}>{words.statClean(summary.cleanSolves, summary.solved)}</li>
        {summary.hintsUsed > 0 && <li className="stat">{words.statHints(summary.hintsUsed)}</li>}
        {mistakes > 0 && <li className="stat">{words.statMistakes(mistakes)}</li>}
      </ul>

      <ul className="recap">
        {report.exercises.map((exercise) => {
          const result = report.results.find((item) => item.id === exercise.id);
          const solution = solveEquation(exercise.equation);
          return (
            <li key={exercise.id}>
              <CircleCheck size={18} aria-hidden="true" />
              <span className="recap-equation">{exercise.prelude.steps.length > 0 ? localiseDecimals(exercise.prelude.source, lang) : formatEquation(exercise.equation)}</span>
              <span className="recap-answer">
                {solution.kind === "one" ? `x = ${formatFraction(solution.value)}` : solution.kind === "none" ? words.noSolution : words.infinite}
              </span>
              {result && result.hints > 0 && <span className="recap-note">{words.hintTag(result.hints)}</span>}
            </li>
          );
        })}
      </ul>

      {idea && (
        <div className="complete-remember">
          <div className="example-label">
            <Lightbulb size={16} aria-hidden="true" /> {words.remember}
          </div>
          <p>{keepMathTogether(idea)}</p>
        </div>
      )}

      <div className="action-row action-center">
        {next ? (
          <button type="button" className="button-primary" onClick={() => onNextLevel(next.id)}>
            {words.next(levelText(next, lang).title)} <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button-primary" onClick={onTopics}>
            {words.explore} <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="button-secondary" onClick={onPractiseAgain}>
          <RotateCcw size={16} aria-hidden="true" /> {words.again}
        </button>
        <button type="button" className="text-link" onClick={onQuiz}>
          {words.quiz} <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
