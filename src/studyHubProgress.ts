// studyHubProgress: sends a student's progress to Study Hub.
// It never throws, never shows anything, and does nothing when the app was not opened from Study Hub.
const HUB = "https://insaneones.xyz";
const STORAGE_KEY = "studyhub_token";
const KINDS = ["started", "progress", "score", "completed", "level"] as const;
const MAX_EVENTS_PER_VISIT = 200;

export type ProgressKind = (typeof KINDS)[number];

export interface ProgressDetails {
  /** A short readable name, such as "Level 3". */
  label?: string;
  /** A stable id for the thing, such as "level-3". */
  ref?: string;
  value?: number;
  max?: number;
}

interface HubEvent {
  kind: ProgressKind;
  label: string;
  ref: string;
  value: number | null;
  max: number | null;
}

let token: string | null = null;
const queue: HubEvent[] = [];
let timer: ReturnType<typeof setTimeout> | 0 = 0;
let sentCount = 0;

/** Call once when the app starts. Returns true when the student's token is present. */
export function initStudyHub(): boolean {
  try {
    const params = new URLSearchParams(location.hash.slice(1));
    const fromAddress = params.get("hub_token");
    if (fromAddress) {
      token = fromAddress;
      try {
        sessionStorage.setItem(STORAGE_KEY, fromAddress);
      } catch {
        // Private mode: the token stays in memory for this page.
      }
      params.delete("hub_token");
      const rest = params.toString();
      history.replaceState(null, "", location.pathname + location.search + (rest ? "#" + rest : ""));
    } else {
      try {
        token = sessionStorage.getItem(STORAGE_KEY);
      } catch {
        token = null;
      }
    }
  } catch {
    // Never break the app.
  }
  return token !== null;
}

/**
 * kind: 'started' | 'progress' | 'score' | 'completed' | 'level'
 * details (all optional): { label: 'Level 3', ref: 'level-3', value: 7, max: 10 }
 */
export function reportProgress(kind: ProgressKind, details?: ProgressDetails): void {
  try {
    if (!token || (KINDS as readonly string[]).indexOf(kind) === -1) return;
    if (sentCount + queue.length >= MAX_EVENTS_PER_VISIT) return;
    const d = details || {};
    queue.push({ kind: kind, label: text(d.label), ref: text(d.ref), value: number(d.value), max: number(d.max) });
    if (!timer) timer = setTimeout(flush, 2000);
  } catch {
    // Ignore.
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 80) : "";
}

function number(value: unknown): number | null {
  return typeof value === "number" && isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function flush(): void {
  timer = 0;
  try {
    const events = queue.splice(0, 20);
    if (queue.length > 0) timer = setTimeout(flush, 2000);
    if (!token || events.length === 0) return;
    sentCount += events.length;
    // text/plain keeps this a simple cross-origin request (no preflight). No cookies are sent.
    fetch(HUB + "/api/apps/progress", {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ token: token, events: events }),
    }).then(
      function (response) {
        if (response.status === 401) token = null;
      },
      function () {},
    );
  } catch {
    // Ignore.
  }
}

if (typeof addEventListener === "function") {
  addEventListener("pagehide", function () {
    if (queue.length > 0) flush();
  });
}
