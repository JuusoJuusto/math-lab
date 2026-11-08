import { ArrowRight, CircleCheck, RotateCcw, Trophy } from "lucide-react";
import { formatEquation, formatFraction, getNextLevel, solveEquation, summariseRound, type LevelDefinition } from "@/lib/equations";
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
  const summary = summariseRound(report.results);
  const next = getNextLevel(level.id);

  return (
    <section className="results-card level-complete" aria-labelledby="complete-heading">
      <div className="results-medal">
        <Trophy size={34} aria-hidden="true" />
      </div>
      <span className="section-kicker">LEVEL {level.number} COMPLETE</span>
      <h2 id="complete-heading" className="complete-heading" tabIndex={-1}>
        {level.title}: done!
      </h2>
      <p>
        You solved {summary.solved} equations.{" "}
        {summary.hintsUsed === 0 ? "No hints needed." : `You used ${summary.hintsUsed} hint${summary.hintsUsed === 1 ? "" : "s"}, which is exactly what they are for.`}
      </p>

      <ul className="recap">
        {report.exercises.map((exercise) => {
          const result = report.results.find((item) => item.id === exercise.id);
          const solution = solveEquation(exercise.equation);
          return (
            <li key={exercise.id}>
              <CircleCheck size={18} aria-hidden="true" />
              <span className="recap-equation">{formatEquation(exercise.equation)}</span>
              <span className="recap-answer">{solution.kind === "one" ? `x = ${formatFraction(solution.value)}` : ""}</span>
              {result && result.hints > 0 && <span className="recap-note">{result.hints} hint{result.hints === 1 ? "" : "s"}</span>}
            </li>
          );
        })}
      </ul>

      <div className="results-actions">
        {next ? (
          <button type="button" className="button-primary" onClick={() => onNextLevel(next.id)}>
            Next: {next.title} <ArrowRight size={16} aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="button-primary" onClick={onTopics}>
            Explore more topics <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
        <button type="button" className="button-secondary" onClick={onPractiseAgain}>
          <RotateCcw size={16} aria-hidden="true" /> Practise again
        </button>
        <button type="button" className="text-link" onClick={onQuiz}>
          Take the quiz <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
