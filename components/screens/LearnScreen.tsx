"use client";

import { topics } from "@/content/topics";
import { useProgress } from "@/hooks/useProgress";
import { finishedTopics } from "@/lib/progress";
import { ModuleCard } from "@/components/ui/Cards";

export function LearnScreen() {
  const finished = finishedTopics(useProgress());
  return (
    <div className="panel">
      <header className="page-head">
        <h1>Learn</h1>
        <p>Pick a topic. Start with the idea, then solve equations step by step.</p>
      </header>
      <div className="grid-4">
        {topics.map((topic) => (
          <ModuleCard key={topic.id} topic={topic} done={finished.includes(topic.id)} />
        ))}
      </div>
    </div>
  );
}
