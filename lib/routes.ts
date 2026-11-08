/**
 * Screens and their addresses.
 *
 * Every screen has a hash address such as `#/practice/exam?topic=both&n=20&seed=5`.
 * That is what makes the browser's Back button, a page refresh and a shared
 * link work, while the site stays a plain static export.
 */

import { getMode, type ModeId } from "./tasks/modes";
import { topics } from "../content/topics";

export type Route =
  | { readonly name: "home" }
  | { readonly name: "learn" }
  | { readonly name: "lesson"; readonly topic: string }
  | { readonly name: "solver"; readonly level: string }
  /** The practice hub. A mode can be pre-selected, which shows its setup. */
  | { readonly name: "practice"; readonly mode?: ModeId }
  | { readonly name: "session"; readonly mode: ModeId; readonly topic: string; readonly count: number; readonly seed: number }
  | { readonly name: "progress" };

export const HOME: Route = { name: "home" };

const isTopic = (id: string) => topics.some((topic) => topic.id === id);

function clampInt(text: string | null, fallback: number, min: number, max: number): number {
  const n = text === null ? Number.NaN : Number(text);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** Reads a location hash such as `#/learn/two-step`. Anything unknown is the home screen. */
export function parseHash(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(query);

  switch (parts[0]) {
    case "learn":
      return parts[1] && isTopic(parts[1]) ? { name: "lesson", topic: parts[1] } : { name: "learn" };
    case "solve":
      return parts[1] && isTopic(parts[1]) ? { name: "solver", level: parts[1] } : { name: "learn" };
    case "practice": {
      const mode = parts[1] ? getMode(parts[1]) : undefined;
      if (!mode) {
        const chosen = getMode(params.get("mode") ?? "");
        return chosen ? { name: "practice", mode: chosen.id } : { name: "practice" };
      }
      const topic = params.get("topic") ?? "all";
      return {
        name: "session",
        mode: mode.id,
        topic: topic === "all" || isTopic(topic) ? topic : "all",
        count: clampInt(params.get("n"), mode.defaultCount, 1, 50),
        seed: clampInt(params.get("seed"), 1, 1, 2147483646),
      };
    }
    case "progress":
      return { name: "progress" };
    default:
      return HOME;
  }
}

/** The hash address of a route. The inverse of {@link parseHash}. */
export function toHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "learn":
      return "#/learn";
    case "lesson":
      return `#/learn/${route.topic}`;
    case "solver":
      return `#/solve/${route.level}`;
    case "practice":
      return route.mode ? `#/practice?mode=${route.mode}` : "#/practice";
    case "session":
      return `#/practice/${route.mode}?topic=${route.topic}&n=${route.count}&seed=${route.seed}`;
    case "progress":
      return "#/progress";
  }
}

/** Which item of the main navigation a route belongs to. */
export function sectionOf(route: Route): "home" | "learn" | "practice" | "progress" {
  switch (route.name) {
    case "home":
      return "home";
    case "learn":
    case "lesson":
    case "solver":
      return "learn";
    case "practice":
    case "session":
      return "practice";
    case "progress":
      return "progress";
  }
}
