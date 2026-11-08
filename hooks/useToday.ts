"use client";

import { useSyncExternalStore } from "react";

/** Today's date as YYYY-MM-DD in the learner's own time zone. */
export function localDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

const subscribe = () => () => {};

/** Today's date on the client, and an empty string while rendering on the server. */
export function useToday(): string {
  return useSyncExternalStore(subscribe, () => localDate(), () => "");
}
