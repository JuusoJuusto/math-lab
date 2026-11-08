/**
 * Practice modes and how a session is put together.
 *
 * A session is a list of `TaskSpec`s built from a seed, so the same options give
 * the same session. Specs are generated for real and compared, so a session
 * never shows the same task twice.
 */

import { createRng, shuffle, type Rng } from "../equations";
import { questions } from "../../content/questions";
import { generateTask, taskFingerprint } from "./generate";
import { int, pick } from "./sample";
import { KIND_TOPICS, TOPIC_ORDER, difficultyOf } from "./support";
import type { TaskKind, TaskSpec } from "./types";

export type ModeId = "daily" | "quiz" | "solve" | "truefalse" | "step" | "mistake" | "equation" | "time" | "exam" | "mistakes";

/** Where a mode's title and description live: `modes` in lib/i18n/ui-*.ts. */
export interface ModeInfo {
  readonly id: ModeId;
  readonly kinds: readonly TaskKind[];
  readonly defaultCount: number;
  readonly counts: readonly number[];
  /** Whether the learner may narrow it to one topic. */
  readonly topicFilter: boolean;
  /** Seconds, for timed modes. */
  readonly seconds?: number;
}

export const MODES: readonly ModeInfo[] = [
  {
    id: "daily",
    kinds: ["solve", "check", "step", "choose", "equation"],
    defaultCount: 5,
    counts: [5],
    topicFilter: false,
  },
  {
    id: "quiz",
    kinds: ["bank", "choose"],
    defaultCount: 10,
    counts: [5, 10, 20],
    topicFilter: true,
  },
  {
    id: "solve",
    kinds: ["solve"],
    defaultCount: 10,
    counts: [5, 10, 20],
    topicFilter: true,
  },
  {
    id: "truefalse",
    kinds: ["check"],
    defaultCount: 10,
    counts: [5, 10, 20],
    topicFilter: true,
  },
  {
    id: "step",
    kinds: ["step"],
    defaultCount: 10,
    counts: [5, 10, 20],
    topicFilter: true,
  },
  {
    id: "mistake",
    kinds: ["mistake"],
    defaultCount: 8,
    counts: [5, 8, 12],
    topicFilter: true,
  },
  {
    id: "equation",
    kinds: ["equation"],
    defaultCount: 8,
    counts: [5, 8, 12],
    topicFilter: false,
  },
  {
    id: "time",
    kinds: ["solve", "check", "choose", "step"],
    defaultCount: 40,
    counts: [40],
    topicFilter: true,
    seconds: 60,
  },
  {
    id: "exam",
    kinds: ["bank", "choose", "solve", "check", "step", "mistake", "equation"],
    defaultCount: 20,
    counts: [10, 20, 30],
    topicFilter: true,
  },
  {
    id: "mistakes",
    kinds: [],
    defaultCount: 10,
    counts: [10],
    topicFilter: false,
  },
];

export function getMode(id: string): ModeInfo | undefined {
  return MODES.find((mode) => mode.id === id);
}

/** Topics a mode can produce tasks for, in learning order. */
export function topicsForMode(mode: ModeInfo): string[] {
  const topics = new Set(mode.kinds.flatMap((kind) => KIND_TOPICS[kind]));
  return TOPIC_ORDER.filter((topic) => topics.has(topic));
}

/** A number from a date such as "2026-11-08", so the daily challenge is the same for everyone that day. */
export function dateSeed(date: string): number {
  let hash = 2166136261;
  for (const char of date) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2147483647 || 1;
}

export interface SessionOptions {
  readonly mode: ModeId;
  /** A topic id, or "all". */
  readonly topic: string;
  readonly count: number;
  readonly seed: number;
  /** The learner's mistake queue, for the "mistakes" mode. */
  readonly missed?: readonly TaskSpec[];
}

function newSeed(rng: Rng): number {
  return int(rng, 1, 2147483646);
}

/** Picks the topic for slot `index` of `count`. Exam practice climbs from easy to hard. */
function chooseTopic(kind: TaskKind, allowed: readonly string[], index: number, count: number, climb: boolean, rng: Rng): string {
  if (!climb || count < 2) return pick(rng, allowed);
  const target = Math.round((index / (count - 1)) * (TOPIC_ORDER.length - 1)) + int(rng, -1, 1);
  const scored = allowed.map((topic) => ({ topic, distance: Math.abs(difficultyOf(topic) - target), tie: rng() }));
  scored.sort((a, b) => a.distance - b.distance || a.tie - b.tie);
  return scored[0].topic;
}

export function buildSession(options: SessionOptions): TaskSpec[] {
  const mode = getMode(options.mode);
  if (!mode) return [];
  if (mode.id === "mistakes") return (options.missed ?? []).slice(0, options.count);

  const rng = createRng(options.seed);
  const kinds = shuffle(mode.kinds, rng);
  const specs: TaskSpec[] = [];
  const seen = new Set<string>();
  const usedBank = new Set<string>();
  const climb = mode.id === "exam";
  let failures = 0;

  for (let index = 0; specs.length < options.count && failures < options.count * 6; index += 1) {
    const kind = kinds[index % kinds.length];
    const allowed = KIND_TOPICS[kind].filter((topic) => options.topic === "all" || topic === options.topic);
    if (allowed.length === 0) {
      failures += 1;
      continue;
    }

    const topic = chooseTopic(kind, allowed, specs.length, options.count, climb, rng);
    let spec: TaskSpec = { kind, topic, seed: newSeed(rng) };

    if (kind === "bank") {
      const pool = questions.filter((question) => question.topic === topic);
      const fresh = pool.filter((question) => !usedBank.has(question.id));
      if (pool.length === 0 || fresh.length === 0) {
        failures += 1;
        continue;
      }
      spec = { ...spec, bankId: pick(rng, fresh).id };
    }

    const fingerprint = taskFingerprint(generateTask(spec));
    if (seen.has(fingerprint)) {
      failures += 1;
      continue;
    }
    seen.add(fingerprint);
    if (spec.bankId) usedBank.add(spec.bankId);
    specs.push(spec);
  }

  return specs;
}
