import { navigate } from "@/hooks/useRoute";
import { getMode, type ModeId } from "@/lib/tasks";

/** A fresh seed, chosen when the learner presses a button so server and client renders never differ. */
export function freshSeed(): number {
  return 1 + Math.floor(Math.random() * 2147483645);
}

/** Starts a practice session straight away. */
export function startSession(mode: ModeId, topic = "all", count?: number, seed = freshSeed()): void {
  const info = getMode(mode);
  if (!info) return;
  navigate({ name: "session", mode, topic, count: count ?? info.defaultCount, seed });
}
