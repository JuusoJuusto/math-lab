"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getTopic, topics } from "@/content/topics";
import { dateSeed, MODES, getMode, topicsForMode, type ModeId, type ModeInfo } from "@/lib/tasks";
import { useProgress } from "@/hooks/useProgress";
import { useToday } from "@/hooks/useToday";
import { ModeCard, modeTone } from "@/components/ui/Cards";
import { ModeIcon } from "@/components/ui/icons";
import { startSession } from "@/components/practice/start";

function caption(mode: ModeInfo): string {
  if (mode.id === "daily") return "5 tasks · +25 XP";
  if (mode.id === "time") return "60 seconds";
  if (mode.id === "mistakes") return "Your queue";
  return `${mode.defaultCount} tasks`;
}

function Setup({ mode }: { mode: ModeInfo }) {
  const progress = useProgress();
  const today = useToday();
  const available = topicsForMode(mode);
  const [topic, setTopic] = useState("all");
  const [count, setCount] = useState(mode.defaultCount);

  const queued = progress.missed.length;
  const doneToday = mode.id === "daily" && today !== "" && progress.dailyDone === today;
  const empty = mode.id === "mistakes" && queued === 0;

  function start() {
    if (mode.id === "daily") startSession("daily", "all", 5, dateSeed(today));
    else startSession(mode.id, mode.topicFilter ? topic : "all", count);
  }

  return (
    <section className="setup" aria-labelledby="setup-title">
      <div className="setup-head">
        <span className={`setup-icon ${modeTone(mode.id)}`}>
          <ModeIcon id={mode.id} size={30} />
        </span>
        <div>
          <h2 id="setup-title">{mode.title}</h2>
          <p>{mode.description}</p>
        </div>
      </div>

      {mode.topicFilter && available.length > 1 && (
        <fieldset className="chips">
          <legend>Topic</legend>
          {["all", ...available].map((id) => (
            <label key={id} className="chip">
              <input type="radio" name="setup-topic" checked={topic === id} onChange={() => setTopic(id)} />
              <span>{id === "all" ? "All topics" : getTopic(id)?.title}</span>
            </label>
          ))}
        </fieldset>
      )}

      {mode.counts.length > 1 && (
        <fieldset className="chips">
          <legend>Number of tasks</legend>
          {mode.counts.map((value) => (
            <label key={value} className="chip">
              <input type="radio" name="setup-count" checked={count === value} onChange={() => setCount(value)} />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
      )}

      {mode.id === "mistakes" && (
        <p className="setup-note">{queued === 0 ? "No mistakes to fix. Every task you miss will wait here for another try." : `${queued} task${queued === 1 ? "" : "s"} waiting for another try.`}</p>
      )}
      {mode.id === "daily" && (
        <p className="setup-note">{doneToday ? "You finished today's challenge. Play it again for practice (no extra XP)." : "The same five tasks for everyone today. Finish them for +25 XP."}</p>
      )}
      {mode.id === "time" && <p className="setup-note">Answer as many as you can in 60 seconds. Your best: {progress.bestTime}.</p>}

      <button type="button" className="cta cta-inline" onClick={start} disabled={empty || (mode.id === "daily" && today === "")}>
        <Play size={18} aria-hidden="true" /> Start
      </button>
    </section>
  );
}

export function PracticeHub({ modeId }: { modeId?: ModeId }) {
  const mode = modeId ? getMode(modeId) : undefined;
  const progress = useProgress();
  const queued = progress.missed.length;

  return (
    <div className="panel">
      <header className="page-head">
        <h1>Practice</h1>
        <p>Pick a way to practise for your exam. Every answer comes with an explanation, and correct answers earn XP.</p>
      </header>

      {mode && <Setup key={mode.id} mode={mode} />}

      <div className="grid-4">
        {MODES.map((item) => (
          <ModeCard key={item.id} mode={item} selected={item.id === modeId} caption={item.id === "mistakes" ? `${queued} waiting` : caption(item)} />
        ))}
      </div>
      <p className="hub-note">
        {topics.length} topics · {MODES.length} ways to practise · tasks are generated fresh every time, so you will not run out.
      </p>
    </div>
  );
}
