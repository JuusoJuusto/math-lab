"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { getTopic, getTopics } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { resetProgress, useProgress } from "@/hooks/useProgress";
import { accuracyOf, finishedTopics, levelOf, overallProgress, practisedTopics, weakestTopic, xpIntoLevel, XP_PER_LEVEL } from "@/lib/progress";
import type { TaskGroup } from "@/lib/tasks";
import { startSession } from "@/components/practice/start";
import { TopicIcon } from "@/components/ui/icons";
import { AppLink } from "@/components/ui/AppLink";

const GROUPS: readonly TaskGroup[] = ["quiz", "solve", "check", "step", "mistake", "equation"];

export function ProgressScreen() {
  const { lang, t } = useI18n();
  const topics = getTopics(lang);
  const progress = useProgress();
  const [confirming, setConfirming] = useState(false);
  const finished = finishedTopics(progress);
  const practised = practisedTopics(progress);
  const weak = weakestTopic(progress);
  const level = levelOf(progress.xp);
  const into = xpIntoLevel(progress.xp);

  return (
    <div className="panel">
      <header className="page-head">
        <h1>{t.progress.title}</h1>
        <p>{t.progress.saved}</p>
      </header>

      <section className="level-card" aria-label={t.progress.levelAria}>
        <span className="xp-coin xp-coin-large" aria-hidden="true">
          {level}
        </span>
        <div>
          <strong>{t.progress.level(level)}</strong>
          <p>
            {t.progress.toNext(into, XP_PER_LEVEL, level + 1)}
          </p>
          <div className="bar" role="progressbar" aria-label={t.progress.xpBar} aria-valuenow={into} aria-valuemin={0} aria-valuemax={XP_PER_LEVEL}>
            <span style={{ width: `${into}%` }} />
          </div>
        </div>
      </section>

      <dl className="stats">
        <div>
          <dt>{t.progress.answered}</dt>
          <dd>{progress.attempts}</dd>
        </div>
        <div>
          <dt>{t.progress.correct}</dt>
          <dd>{progress.attempts ? `${accuracyOf(progress)} %` : "–"}</dd>
        </div>
        <div>
          <dt>{t.progress.totalXp}</dt>
          <dd>{progress.xp}</dd>
        </div>
        <div>
          <dt>{t.progress.topicsFinished}</dt>
          <dd>
            {finished.length} / {topics.length}
          </dd>
          <dd className="sr-only">{t.progress.percent(overallProgress(progress, topics.length))}</dd>
        </div>
      </dl>

      {(progress.missed.length > 0 || weak) && (
        <section className="suggest" aria-label={t.progress.next}>
          {progress.missed.length > 0 && (
            <button type="button" className="cta cta-inline" onClick={() => startSession("mistakes", "all", 10)}>
              {t.progress.fix(progress.missed.length)} <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
          {weak && (
            <p>
              {t.progress.revise} <AppLink route={{ name: "lesson", topic: weak }}>{getTopic(weak, lang)?.title}</AppLink> ({t.progress.correctPercent(accuracyOf(progress.byTopic[weak]))}).
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="by-topic">
        <h2 id="by-topic" className="sub-head">
          {t.progress.byTopic}
        </h2>
        <ul className="rows">
          {topics.map((topic) => {
            const tally = progress.byTopic[topic.id];
            const percent = tally ? accuracyOf(tally) : 0;
            return (
              <li key={topic.id}>
                <AppLink className="row" route={{ name: "lesson", topic: topic.id }}>
                  <span className={`row-icon mod-${topic.colour}`}>
                    <TopicIcon name={topic.icon} size={20} />
                  </span>
                  <span className="row-main">
                    <strong>{topic.title}</strong>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </span>
                    <span className="row-sub">
                      {tally ? t.progress.tally(tally.correct, tally.attempts, percent) : t.progress.notPractised}
                    </span>
                  </span>
                  <span className="row-tags">
                    {progress.solverLevels.includes(topic.id) && (
                      <span className="tag">
                        <Check size={12} aria-hidden="true" /> {t.progress.solverTag}
                      </span>
                    )}
                    {practised.includes(topic.id) && (
                      <span className="tag">
                        <Check size={12} aria-hidden="true" /> {t.progress.practisedTag}
                      </span>
                    )}
                  </span>
                </AppLink>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="by-type">
        <h2 id="by-type" className="sub-head">
          {t.progress.byType}
        </h2>
        <ul className="rows rows-compact">
          {GROUPS.map((group) => {
            const tally = progress.byGroup[group];
            const percent = tally ? accuracyOf(tally) : 0;
            return (
              <li key={group} className="row row-static">
                <span className="row-main">
                  <strong>{t.groups[group].label}</strong>
                  <span className="bar" aria-hidden="true">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                  <span className="row-sub">{tally ? t.progress.tally(tally.correct, tally.attempts, percent) : t.groups[group].hint}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="action-row">
        {confirming ? (
          <>
            <button type="button" className="button-danger" onClick={() => { resetProgress(); setConfirming(false); }}>
              {t.progress.resetYes}
            </button>
            <button type="button" className="button-secondary" onClick={() => setConfirming(false)}>
              {t.progress.keep}
            </button>
          </>
        ) : (
          <button type="button" className="button-secondary" onClick={() => setConfirming(true)}>
            {t.progress.reset}
          </button>
        )}
      </div>
    </div>
  );
}
