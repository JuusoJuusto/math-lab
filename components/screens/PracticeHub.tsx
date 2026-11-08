"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { getTopic, getTopics } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import type { UiMessages } from "@/lib/i18n";
import { dateSeed, MODES, getMode, topicsForMode, type ModeId, type ModeInfo } from "@/lib/tasks";
import { useProgress } from "@/hooks/useProgress";
import { useToday } from "@/hooks/useToday";
import { ModeCard, modeTone } from "@/components/ui/Cards";
import { ModeIcon } from "@/components/ui/icons";
import { startSession } from "@/components/practice/start";
import { AppLink } from "@/components/ui/AppLink";

function caption(mode: ModeInfo, t: UiMessages): string {
  if (mode.id === "daily") return t.practice.dailyCaption;
  if (mode.id === "time") return t.practice.seconds;
  if (mode.id === "mistakes") return t.practice.queue;
  return t.practice.tasks(mode.defaultCount);
}

function Setup({ mode }: { mode: ModeInfo }) {
  if (mode.id === "test") return <TestSetup mode={mode} />;
  return <ModeSetup mode={mode} />;
}

/** The practice test is set up on its own screen, where the chapters are chosen. */
function TestSetup({ mode }: { mode: ModeInfo }) {
  const { t } = useI18n();
  return (
    <section className="setup" aria-labelledby="setup-title">
      <div className="setup-head">
        <span className={`setup-icon ${modeTone(mode.id)}`}>
          <ModeIcon id={mode.id} size={30} />
        </span>
        <div>
          <h2 id="setup-title">{t.modes[mode.id].title}</h2>
          <p>{t.modes[mode.id].description}</p>
        </div>
      </div>
      <AppLink className="cta cta-inline" route={{ name: "test" }}>
        <Play size={18} aria-hidden="true" /> {t.testScreen.start}
      </AppLink>
    </section>
  );
}

function ModeSetup({ mode }: { mode: ModeInfo }) {
  const { lang, t } = useI18n();
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
          <h2 id="setup-title">{t.modes[mode.id].title}</h2>
          <p>{t.modes[mode.id].description}</p>
        </div>
      </div>

      {mode.topicFilter && available.length > 1 && (
        <fieldset className="chips">
          <legend>{t.practice.topic}</legend>
          {["all", ...available].map((id) => (
            <label key={id} className="chip">
              <input type="radio" name="setup-topic" checked={topic === id} onChange={() => setTopic(id)} />
              <span>{id === "all" ? t.practice.allTopics : getTopic(id, lang)?.title}</span>
            </label>
          ))}
        </fieldset>
      )}

      {mode.counts.length > 1 && (
        <fieldset className="chips">
          <legend>{t.practice.count}</legend>
          {mode.counts.map((value) => (
            <label key={value} className="chip">
              <input type="radio" name="setup-count" checked={count === value} onChange={() => setCount(value)} />
              <span>{value}</span>
            </label>
          ))}
        </fieldset>
      )}

      {mode.id === "mistakes" && (
        <p className="setup-note">{queued === 0 ? t.practice.noMistakes : t.practice.waitingNote(queued)}</p>
      )}
      {mode.id === "daily" && (
        <p className="setup-note">{doneToday ? t.practice.dailyDone : t.practice.dailyFresh}</p>
      )}
      {mode.id === "time" && <p className="setup-note">{t.practice.timeNote(progress.bestTime)}</p>}

      <button type="button" className="cta cta-inline" onClick={start} disabled={empty || (mode.id === "daily" && today === "")}>
        <Play size={18} aria-hidden="true" /> {t.practice.start}
      </button>
    </section>
  );
}

export function PracticeHub({ modeId }: { modeId?: ModeId }) {
  const { lang, t } = useI18n();
  const topics = getTopics(lang);
  const mode = modeId ? getMode(modeId) : undefined;
  const progress = useProgress();
  const queued = progress.missed.length;

  return (
    <div className="panel">
      <header className="page-head">
        <h1>{t.practice.title}</h1>
        <p>{t.practice.intro}</p>
      </header>

      {mode && <Setup key={mode.id} mode={mode} />}

      <div className="grid-4">
        {MODES.map((item) => (
          <ModeCard key={item.id} mode={item} selected={item.id === modeId} caption={item.id === "mistakes" ? t.practice.waiting(queued) : caption(item, t)} />
        ))}
      </div>
      <p className="hub-note">
        {t.practice.hubNote(topics.length, MODES.length)}
      </p>
    </div>
  );
}
