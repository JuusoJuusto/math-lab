"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { getTopic, topics } from "@/content/topics";
import { resetProgress, useProgress } from "@/hooks/useProgress";
import { accuracyOf, finishedTopics, levelOf, overallProgress, practisedTopics, weakestTopic, xpIntoLevel, XP_PER_LEVEL } from "@/lib/progress";
import { GROUP_INFO, type TaskGroup } from "@/lib/tasks";
import { toHash } from "@/lib/routes";
import { startSession } from "@/components/practice/start";
import { TopicIcon } from "@/components/ui/icons";

export function ProgressScreen() {
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
        <h1>Progress</h1>
        <p>Saved in this browser on this device only.</p>
      </header>

      <section className="level-card" aria-label="Level">
        <span className="xp-coin xp-coin-large" aria-hidden="true">
          {level}
        </span>
        <div>
          <strong>Level {level}</strong>
          <p>
            {into} / {XP_PER_LEVEL} XP to level {level + 1}
          </p>
          <div className="bar" role="progressbar" aria-label="XP to next level" aria-valuenow={into} aria-valuemin={0} aria-valuemax={XP_PER_LEVEL}>
            <span style={{ width: `${into}%` }} />
          </div>
        </div>
      </section>

      <dl className="stats">
        <div>
          <dt>Tasks answered</dt>
          <dd>{progress.attempts}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{progress.attempts ? `${accuracyOf(progress)} %` : "–"}</dd>
        </div>
        <div>
          <dt>Total XP</dt>
          <dd>{progress.xp}</dd>
        </div>
        <div>
          <dt>Topics finished</dt>
          <dd>
            {finished.length} / {topics.length}
          </dd>
          <dd className="sr-only">{overallProgress(progress, topics.length)} percent</dd>
        </div>
      </dl>

      {(progress.missed.length > 0 || weak) && (
        <section className="suggest" aria-label="What to do next">
          {progress.missed.length > 0 && (
            <button type="button" className="cta cta-inline" onClick={() => startSession("mistakes", "all", 10)}>
              Fix your {progress.missed.length} mistake{progress.missed.length === 1 ? "" : "s"} <ArrowRight size={18} aria-hidden="true" />
            </button>
          )}
          {weak && (
            <p>
              Revise next: <a href={toHash({ name: "lesson", topic: weak })}>{getTopic(weak)?.title}</a> ({accuracyOf(progress.byTopic[weak])} % correct).
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="by-topic">
        <h2 id="by-topic" className="sub-head">
          By topic
        </h2>
        <ul className="rows">
          {topics.map((topic) => {
            const tally = progress.byTopic[topic.id];
            const percent = tally ? accuracyOf(tally) : 0;
            return (
              <li key={topic.id}>
                <a className="row" href={toHash({ name: "lesson", topic: topic.id })}>
                  <span className={`row-icon mod-${topic.colour}`}>
                    <TopicIcon name={topic.icon} size={20} />
                  </span>
                  <span className="row-main">
                    <strong>{topic.title}</strong>
                    <span className="bar" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </span>
                    <span className="row-sub">
                      {tally ? `${tally.correct} of ${tally.attempts} correct (${percent} %)` : "Not practised yet"}
                    </span>
                  </span>
                  <span className="row-tags">
                    {progress.solverLevels.includes(topic.id) && (
                      <span className="tag">
                        <Check size={12} aria-hidden="true" /> Solver
                      </span>
                    )}
                    {practised.includes(topic.id) && (
                      <span className="tag">
                        <Check size={12} aria-hidden="true" /> Practised
                      </span>
                    )}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="by-type">
        <h2 id="by-type" className="sub-head">
          By type of task
        </h2>
        <ul className="rows rows-compact">
          {(Object.keys(GROUP_INFO) as TaskGroup[]).map((group) => {
            const tally = progress.byGroup[group];
            const percent = tally ? accuracyOf(tally) : 0;
            return (
              <li key={group} className="row row-static">
                <span className="row-main">
                  <strong>{GROUP_INFO[group].label}</strong>
                  <span className="bar" aria-hidden="true">
                    <span style={{ width: `${percent}%` }} />
                  </span>
                  <span className="row-sub">{tally ? `${tally.correct} of ${tally.attempts} correct (${percent} %)` : GROUP_INFO[group].hint}</span>
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
              Yes, delete my progress
            </button>
            <button type="button" className="button-secondary" onClick={() => setConfirming(false)}>
              Keep it
            </button>
          </>
        ) : (
          <button type="button" className="button-secondary" onClick={() => setConfirming(true)}>
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
}
