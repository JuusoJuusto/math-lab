"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Timer } from "lucide-react";
import { navigate } from "@/hooks/useRoute";
import { useProgress, updateProgress } from "@/hooks/useProgress";
import { localDate } from "@/hooks/useToday";
import { XP, recordDailyDone, recordTask, recordTimeAttack } from "@/lib/progress";
import { toHash, type Route } from "@/lib/routes";
import { buildSession, generateTask, getMode, gradeChoice, gradeNumber, isInvalid, type Grade } from "@/lib/tasks";
import { startSession } from "./start";
import { SessionResults, type AnswerRecord } from "./SessionResults";
import { TaskCard, type Phase } from "./TaskCard";

type SessionRoute = Extract<Route, { name: "session" }>;

/** How long a quick answer stays on screen before the next task, in milliseconds. */
const QUICK_DELAY = 650;

/**
 * Runs one practice session: shows each task, grades the answer, records
 * progress as it goes (so leaving early never loses XP) and ends with results.
 */
export function PracticeSession({ route }: { route: SessionRoute }) {
  const mode = getMode(route.mode)!;
  const progress = useProgress();
  const quick = mode.seconds !== undefined;

  // Built once. The tasks themselves are generated one at a time from their recipes.
  const [specs] = useState(() => buildSession({ mode: route.mode, topic: route.topic, count: route.count, seed: route.seed, missed: progress.missed }));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("answering");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [records, setRecords] = useState<readonly AnswerRecord[]>([]);
  const [finished, setFinished] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(mode.seconds ?? 0);

  const recordsRef = useRef<readonly AnswerRecord[]>([]);
  const finishedRef = useRef(false);
  const progressRef = useRef(progress);
  const deadline = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  });

  const task = useMemo(() => (specs[index] ? generateTask(specs[index]) : null), [specs, index]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const answered = recordsRef.current;
    const correct = answered.filter((record) => record.correct).length;

    if (mode.id === "daily") {
      const today = localDate();
      if (progressRef.current.dailyDone !== today) setBonus(XP.dailyChallenge);
      updateProgress((old) => recordDailyDone(old, today));
    }
    if (mode.id === "time") updateProgress((old) => recordTimeAttack(old, correct));
    setFinished(true);
  }, [mode.id]);

  const advance = useCallback(() => {
    if (index + 1 >= specs.length) {
      finish();
      return;
    }
    setIndex(index + 1);
    setPhase("answering");
    setGrade(null);
    setPicked(null);
  }, [index, specs.length, finish]);

  const advanceRef = useRef(advance);
  useEffect(() => {
    advanceRef.current = advance;
  });

  // Time attack: count down, and move on by itself shortly after each answer.
  useEffect(() => {
    if (!quick || finished || specs.length === 0) return;
    deadline.current = Date.now() + (mode.seconds ?? 0) * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) finish();
    }, 250);
    return () => window.clearInterval(timer);
  }, [quick, finished, specs.length, mode.seconds, finish]);

  useEffect(() => {
    if (!quick || phase !== "feedback" || finished) return;
    const timer = window.setTimeout(() => advanceRef.current(), QUICK_DELAY);
    return () => window.clearTimeout(timer);
  }, [quick, phase, finished]);

  function record(result: Grade) {
    if (!task) return;
    const xp = quick ? XP.correctTimeAttack : XP.correctTask;
    updateProgress((old) => recordTask(old, { spec: task.spec, correct: result.correct, xp }));
    const entry: AnswerRecord = { spec: task.spec, correct: result.correct, given: result.given, xp: result.correct ? xp : 0 };
    recordsRef.current = [...recordsRef.current, entry];
    setRecords(recordsRef.current);
    setGrade(result);
    setPhase("feedback");
  }

  const choose = useCallback(
    (choice: number) => {
      if (!task || phase !== "answering" || finishedRef.current) return;
      setPicked(choice);
      record(gradeChoice(task, choice));
    },
    // `record` only reads the current task and phase, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [task, phase],
  );

  function submit(text: string): string | null {
    if (!task || phase !== "answering") return null;
    const result = gradeNumber(task, text);
    if (isInvalid(result)) return result.invalid;
    record(result);
    return null;
  }

  if (specs.length === 0) {
    return (
      <div className="panel">
        <a className="back-link" href={toHash({ name: "practice" })}>
          <ArrowLeft size={16} aria-hidden="true" /> Practice
        </a>
        <div className="empty">
          <h1>{mode.id === "mistakes" ? "No mistakes to fix" : "No tasks for this choice"}</h1>
          <p>
            {mode.id === "mistakes"
              ? "Every task you miss is kept here for another try. Right now there is nothing waiting."
              : "This way of practising does not have tasks for that topic. Choose another topic or another mode."}
          </p>
          <a className="cta cta-inline" href={toHash({ name: "practice", mode: mode.id })}>
            Back to practice
          </a>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="panel">
        <SessionResults
          mode={mode}
          records={records}
          bonus={bonus}
          queued={progress.missed.length}
          onAgain={() => (mode.id === "mistakes" ? navigate({ name: "practice" }) : startSession(mode.id, route.topic, route.count, mode.id === "daily" ? route.seed : undefined))}
          onMistakes={() => startSession("mistakes", "all", 10)}
        />
      </div>
    );
  }

  const answeredXp = records.reduce((sum, entry) => sum + entry.xp, 0);

  return (
    <div className="panel session">
      <div className="session-top">
        <a className="back-link" href={toHash({ name: "practice", mode: mode.id })}>
          <ArrowLeft size={16} aria-hidden="true" /> {mode.title}
        </a>
        <span className="session-xp">+{answeredXp} XP</span>
      </div>

      {quick ? (
        <div className="timer" role="timer" aria-label={`${secondsLeft} seconds left`}>
          <Timer size={18} aria-hidden="true" />
          <strong>{secondsLeft}</strong>
          <span className="bar" aria-hidden="true">
            <span style={{ width: `${(secondsLeft / (mode.seconds ?? 1)) * 100}%` }} />
          </span>
          <span>{records.filter((entry) => entry.correct).length} correct</span>
        </div>
      ) : (
        <div className="session-progress">
          <span className="bar" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={specs.length} aria-valuenow={index}>
            <span style={{ width: `${(index / specs.length) * 100}%` }} />
          </span>
          <span className="session-count">
            Task {index + 1} / {specs.length}
          </span>
        </div>
      )}

      {task && (
        <TaskCard
          key={`${index}-${task.spec.seed}`}
          task={task}
          phase={phase}
          grade={grade}
          xp={grade?.correct ? (quick ? XP.correctTimeAttack : XP.correctTask) : 0}
          quick={quick}
          isLast={index + 1 >= specs.length}
          picked={picked}
          onChoose={choose}
          onSubmit={submit}
          onNext={advance}
        />
      )}
    </div>
  );
}
