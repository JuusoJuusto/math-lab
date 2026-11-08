"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Topic } from "@/content/topics";
import { useI18n } from "@/hooks/useLang";
import type { ModeInfo } from "@/lib/tasks";
import { ModeIcon, TopicIcon } from "./icons";
import { AppLink } from "@/components/ui/AppLink";

/** A topic as a coloured card: large formula, darker title band, short description. */
export function ModuleCard({ topic, done }: { topic: Topic; done: boolean }) {
  const { t } = useI18n();
  const { before, mark, after, caption } = topic.formula;
  return (
    <AppLink className={`module mod-${topic.colour}`} route={{ name: "lesson", topic: topic.id }}>
      <span className="module-art">
        <span className="module-formula">
          {before}
          <mark>{mark}</mark>
          {after}
        </span>
        <span className="module-caption">{caption}</span>
        {done && (
          <span className="module-done">
            <Check size={14} aria-hidden="true" />
            <span className="sr-only">{t.topic.finished}</span>
          </span>
        )}
      </span>
      <span className="module-band">{topic.title}</span>
      <span className="module-text">{topic.subtitle}</span>
    </AppLink>
  );
}

const MODE_TONE: Record<string, string> = {
  daily: "game-sea",
  quiz: "game-green",
  solve: "game-navy",
  truefalse: "game-magenta",
  step: "game-indigo",
  mistake: "game-red",
  equation: "game-purple",
  time: "game-night",
  exam: "game-gold",
  mistakes: "game-slate",
};

export function modeTone(id: string): string {
  return MODE_TONE[id] ?? "game-green";
}

/** A practice mode as a card, in the same style as the module cards. */
export function ModeCard({ mode, caption, selected = false }: { mode: ModeInfo; caption: ReactNode; selected?: boolean }) {
  const { t } = useI18n();
  const text = t.modes[mode.id];
  return (
    <AppLink
      className={`game ${modeTone(mode.id)}`}
      route={{ name: "practice", mode: mode.id }}
      aria-current={selected ? "true" : undefined}
    >
      <span className="game-art">
        <span className="game-icon">
          <ModeIcon id={mode.id} size={44} />
        </span>
        <span className="game-caption">{caption}</span>
      </span>
      <span className="game-band">{text.title}</span>
      <span className="game-text">{text.description}</span>
    </AppLink>
  );
}

export { TopicIcon };
