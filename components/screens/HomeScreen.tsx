"use client";

import { ArrowRight, ClipboardCheck } from "lucide-react";
import { getTopics } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { navigate } from "@/hooks/useRoute";
import { useProgress } from "@/hooks/useProgress";
import { LEVELS } from "@/lib/equations";
import { accuracyOf, finishedTopics, levelOf, overallProgress, xpIntoLevel, XP_PER_LEVEL } from "@/lib/progress";
import { getMode, type ModeId } from "@/lib/tasks";
import { LogoMark, Wordmark } from "@/components/shell/Logo";
import { ModeCard, ModuleCard } from "@/components/ui/Cards";
import { TryItNow } from "@/components/ui/TryItNow";
import { AppLink } from "@/components/ui/AppLink";

const HOME_MODES: readonly ModeId[] = ["daily", "quiz", "solve", "truefalse", "step", "mistake", "equation", "exam"];
export function HomeScreen() {
  const { lang, t } = useI18n();
  const topics = getTopics(lang);
  const progress = useProgress();
  const finished = finishedTopics(progress);
  const overall = overallProgress(progress, topics.length);
  const nextLevel = LEVELS.find((level) => !progress.solverLevels.includes(level.id));
  const started = progress.solverLevels.length > 0 || progress.attempts > 0;

  function start() {
    if (nextLevel) navigate({ name: "solver", level: nextLevel.id });
    else navigate({ name: "practice" });
  }

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-brand">
          <LogoMark size={76} />
          <Wordmark large />
        </div>
        <h1 id="hero-title">{t.home.heroTitle}</h1>
        <p>{t.home.heroText}</p>
        <AppLink className="mastery" route={{ name: "progress" }}>
          <span>{t.home.overall}</span>
          <strong>{overall} %</strong>
        </AppLink>
      </section>

      <div className="panel">
        <button type="button" className="cta" onClick={start}>
          {started ? t.home.continue : t.home.start} <ArrowRight size={20} aria-hidden="true" />
        </button>

        <section className="test-promo" aria-labelledby="test-promo-title">
          <span className="test-promo-icon" aria-hidden="true">
            <ClipboardCheck size={34} />
          </span>
          <div>
            <h2 id="test-promo-title">{t.home.testTitle}</h2>
            <p>{t.home.testText}</p>
          </div>
          <AppLink className="cta cta-inline" route={{ name: "test" }}>
            {t.home.testButton} <ArrowRight size={18} aria-hidden="true" />
          </AppLink>
        </section>

        <section className="block" aria-labelledby="learn-title">
          <div className="block-head">
            <h2 id="learn-title">{t.home.learnTitle}</h2>
            <AppLink className="inline-link" route={{ name: "learn" }}>
              {t.home.allTopics}
            </AppLink>
          </div>
          <div className="grid-4">
            {topics.slice(0, 4).map((topic) => (
              <ModuleCard key={topic.id} topic={topic} done={finished.includes(topic.id)} />
            ))}
          </div>
        </section>

        <section className="block" aria-labelledby="practise-title">
          <div className="block-head">
            <h2 id="practise-title">{t.home.practiseTitle}</h2>
            <AppLink className="inline-link" route={{ name: "practice" }}>
              {t.home.allWays}
            </AppLink>
          </div>
          <div className="grid-4">
            {HOME_MODES.map((id) => {
              const mode = getMode(id)!;
              return <ModeCard key={id} mode={mode} caption={t.modes[id].homeCaption} />;
            })}
          </div>
        </section>

        <section className="progress-note" aria-labelledby="note-title">
          <div className="block-head">
            <h2 id="note-title">{t.home.progressTitle}</h2>
            <AppLink className="inline-link" route={{ name: "progress" }}>
              {t.home.allStats}
              <ArrowRight size={14} aria-hidden="true" />
            </AppLink>
          </div>
          {progress.attempts === 0 ? (
            <p>{t.home.notStarted}</p>
          ) : (
            <p>{t.home.summary(progress.attempts, accuracyOf(progress), levelOf(progress.xp), xpIntoLevel(progress.xp), XP_PER_LEVEL)}</p>
          )}
        </section>
      </div>

      <div className="duo">
        <section className="panel how" aria-labelledby="how-title">
          <h2 id="how-title">{t.home.howTitle}</h2>
          <ol>
            {t.home.how.map((item, index) => (
              <li key={item.title}>
                <span aria-hidden="true">{index + 1}</span>
                <p>
                  <strong>{item.title}</strong> {item.text}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <div className="panel">
          <TryItNow />
        </div>
      </div>
    </>
  );
}
