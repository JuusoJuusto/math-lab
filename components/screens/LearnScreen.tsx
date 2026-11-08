"use client";

import { getTopics } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import { useProgress } from "@/hooks/useProgress";
import { finishedTopics } from "@/lib/progress";
import { ModuleCard } from "@/components/ui/Cards";

export function LearnScreen() {
  const { lang, t } = useI18n();
  const finished = finishedTopics(useProgress());
  return (
    <div className="panel">
      <header className="page-head">
        <h1>{t.learn.title}</h1>
        <p>{t.learn.intro}</p>
      </header>
      <div className="grid-4">
        {getTopics(lang).map((topic) => (
          <ModuleCard key={topic.id} topic={topic} done={finished.includes(topic.id)} />
        ))}
      </div>
    </div>
  );
}
