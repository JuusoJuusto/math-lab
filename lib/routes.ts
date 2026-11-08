/**
 * Screens and their addresses.
 *
 * Every screen is a real page of the static site, under its language:
 * `/fi/learn/two-step/`, `/en/practice/exam/?topic=both&n=20&seed=5`. A shared
 * link or a refresh lands on the same screen, and the browser's Back button
 * works because moving between screens uses the History API.
 *
 * Older links used the hash (`#/learn/two-step`). They are still understood
 * (see {@link parseHash}) and are turned into the new addresses on load.
 */

import { getMode, MODES, type ModeId } from "./tasks/modes";
import { topicDefinitions } from "../content/topics";
import { LANGS, isLang, type Lang } from "./lang";
import { LEVELS } from "./equations/levels";

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

const isTopic = (id: string) => topicDefinitions.some((topic) => topic.id === id);

function clampInt(text: string | null, fallback: number, min: number, max: number): number {
  const n = text === null ? Number.NaN : Number(text);
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/**
 * Reads an address without its language, such as `learn/two-step` or
 * `practice/exam?topic=both&n=20&seed=5`. Anything unknown is the home screen.
 */
export function parseAddress(address: string): Route {
  const [path, query = ""] = address.replace(/^\/+/, "").split("?");
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

/** Reads a legacy location hash such as `#/learn/two-step`. */
export function parseHash(hash: string): Route {
  return parseAddress(hash.replace(/^#\/?/, ""));
}

/** The address of a route without its language: `learn/two-step`, `practice?mode=time`. */
export function toAddress(route: Route): string {
  switch (route.name) {
    case "home":
      return "";
    case "learn":
      return "learn";
    case "lesson":
      return `learn/${route.topic}`;
    case "solver":
      return `solve/${route.level}`;
    case "practice":
      return route.mode ? `practice?mode=${route.mode}` : "practice";
    case "session":
      return `practice/${route.mode}?topic=${route.topic}&n=${route.count}&seed=${route.seed}`;
    case "progress":
      return "progress";
  }
}

/** The legacy hash address of a route. The inverse of {@link parseHash}. */
export function toHash(route: Route): string {
  return `#/${toAddress(route)}`;
}

/** The page of a route in a language: `/fi/learn/two-step/`. Pages end in a slash, as the static export names them. */
export function toPath(route: Route, lang: Lang): string {
  const [path, query] = toAddress(route).split("?");
  return `/${lang}/${path ? `${path}/` : ""}${query ? `?${query}` : ""}`;
}

export interface ParsedLocation {
  /** The language in the address, or `null` when the address has none (or an unknown one). */
  readonly lang: Lang | null;
  readonly route: Route;
}

/** Reads a page address, `/fi/learn/two-step/?x=1`, into its language and screen. */
export function parseLocation(url: string): ParsedLocation {
  const [pathname, query = ""] = url.split("?");
  const [first, ...rest] = pathname.split("/").filter(Boolean);
  if (!isLang(first)) return { lang: null, route: HOME };
  return { lang: first, route: parseAddress(`${rest.join("/")}${query ? `?${query}` : ""}`) };
}

/**
 * Every page that is built ahead of time, as the path segments after the
 * language. Practice sessions share the page of their mode; the learner's
 * choices (topic, number of tasks, seed) travel in the query.
 */
export function staticSegments(): string[][] {
  return [
    [],
    ["learn"],
    ...topicDefinitions.map((topic) => ["learn", topic.id]),
    ...LEVELS.map((level) => ["solve", level.id]),
    ["practice"],
    ...MODES.map((mode) => ["practice", mode.id]),
    ["progress"],
  ];
}

export { LANGS };

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
