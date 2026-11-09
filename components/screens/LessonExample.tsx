"use client";

import { BookOpen, Check, CircleHelp, Flag } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import {
  checkSolution,
  describeOperation,
  formatAppliedEquation,
  formatBar,
  formatEquation,
  formatFraction,
  localiseDecimals,
  makePrelude,
  mustParseEquation,
  preludeWords,
  solveEquation,
  solveWithTutor,
  type LevelDefinition,
} from "@/lib/equations";
import { EXAMPLE_STORIES } from "@/lib/tasks";

interface LessonExampleProps {
  level: LevelDefinition;
}

/**
 * One equation of the lesson solved from the first line to the check, written like a notebook.
 *
 * It is made by the same tutor that explains the steps in the solver, so it always agrees with it, in both
 * languages, and a new lesson gets its example without anyone writing it out.
 */
export function LessonExample({ level }: LessonExampleProps) {
  const { lang, t } = useI18n();
  const words = t.lesson;
  const clean = preludeWords(lang);
  // A word problem starts earlier: with the story, what x is, and how the story gives the equation.
  const story = level.id === "word" || level.id === "hard-word" ? EXAMPLE_STORIES[level.id] : null;
  const storyWords = story?.i18n[lang];
  const source = level.example.equation;
  const equation = mustParseEquation(source);
  const prelude = makePrelude(source);
  const steps = solveWithTutor(equation);
  const solution = solveEquation(equation);
  if (steps.length === 0 && prelude.steps.length === 0) return null;

  const start = prelude.steps.length > 0 ? clean.local(prelude.source) : formatEquation(equation);
  const check = solution.kind === "one" ? checkSolution(equation, solution.value, lang) : null;
  // The clean-up questions (open the brackets, clear the fractions) come first, then the steps on both sides.
  const rows = [
    ...prelude.steps.map((step, index) => ({ kind: "clean-up" as const, step, key: `clean-${index}` })),
    ...steps.map((step, index) => ({ kind: "solve" as const, step, key: `solve-${index}` })),
  ];

  return (
    <section className="lesson-example" aria-labelledby="example-title">
      <h2 id="example-title">{words.exampleTitle}</h2>
      <p className="lesson-example-lead">{story ? words.exampleStoryLead : words.exampleLead(start)}</p>

      <ol className="example-lines">
        {story && storyWords ? (
          <>
            <li className="example-line example-line-start">
              <span className="example-badge" aria-hidden="true">
                <BookOpen size={14} />
              </span>
              <div>
                <span className="example-label">{words.exampleStory}</span>
                <p className="example-prose">
                  {storyWords.situation} {storyWords.question}
                </p>
              </div>
            </li>
            <li className="example-line example-line-start">
              <span className="example-badge" aria-hidden="true">
                <CircleHelp size={14} />
              </span>
              <div>
                <span className="example-label">{words.exampleX}</span>
                <p className="example-prose">{storyWords.letX}</p>
              </div>
            </li>
            <li className="example-line example-line-start">
              <span className="example-badge" aria-hidden="true">
                <Flag size={14} />
              </span>
              <div>
                <span className="example-label">{words.exampleEquation}</span>
                <p className="example-math">{localiseDecimals(start, lang)}</p>
                <p className="example-prose">{storyWords.build}</p>
              </div>
            </li>
          </>
        ) : (
          <li className="example-line example-line-start">
            <span className="example-badge" aria-hidden="true">
              <Flag size={14} />
            </span>
            <div>
              <span className="example-label">{words.exampleStart}</span>
              <p className="example-math">{localiseDecimals(start, lang)}</p>
            </div>
          </li>
        )}

        {rows.map((row, index) => (
          <li className="example-line" key={row.key} style={{ animationDelay: `${(index + 1) * 90}ms` }}>
            <span className="example-badge" aria-hidden="true">
              {index + 1}
            </span>
            <div>
              {row.kind === "clean-up" ? (
                <>
                  <span className="example-label">{clean.stage(row.step)}</span>
                  <p className="example-math">{clean.local(row.step.after)}</p>
                </>
              ) : (
                <>
                  <span className="example-label">{describeOperation(row.step.operation, lang)}</span>
                  <p className="example-math">
                    <span>{formatAppliedEquation(row.step.before, row.step.operation, lang)}</span>
                    <span className="example-bar">{formatBar(row.step.operation, lang)}</span>
                  </p>
                  <p className="example-math example-result">{localiseDecimals(formatEquation(row.step.after), lang)}</p>
                </>
              )}
            </div>
          </li>
        ))}
      </ol>

      {check && solution.kind === "one" && (
        <div className="example-end">
          <p className="example-answer">
            <Check size={18} aria-hidden="true" /> <span>{words.exampleAnswer}:</span> <strong>x = {formatFraction(solution.value)}</strong>
          </p>
          {storyWords && <p className="example-sentence">{storyWords.answer}</p>}
          <ol className="example-check" aria-label={words.exampleCheck}>
            {check.lines.slice(1).map((entry) => (
              <li key={entry.label}>
                <span className="verify-label">{entry.label}</span>
                <code className="verify-equation">{entry.text}</code>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
