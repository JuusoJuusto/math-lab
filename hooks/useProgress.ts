"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, STORAGE_KEY, levelOf, parseProgress, serialiseProgress, type Progress } from "@/lib/progress";
import { reportProgress } from "@/src/studyHubProgress";

/**
 * Progress lives in `localStorage`, exposed to React as an external store.
 *
 * `useSyncExternalStore` renders the empty server snapshot first and then the
 * stored value on the client, so the static HTML and the first client render
 * always agree, with no effect that sets state after mount.
 *
 * If storage is unavailable (private browsing, blocked cookies, full quota)
 * the latest value is kept in memory so the app keeps working for the session.
 */

const listeners = new Set<() => void>();

/** Latest value that could not be written to storage. `undefined` means storage is in charge. */
let memoryRaw: string | undefined;

let cachedRaw: string | null = null;
let cachedValue: Progress = EMPTY_PROGRESS;
let hasCached = false;

function readRaw(): string | null {
  if (memoryRaw !== undefined) return memoryRaw;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Returns the same object until the stored text changes, as React requires. */
function getSnapshot(): Progress {
  const raw = readRaw();
  if (!hasCached || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parseProgress(raw);
    hasCached = true;
  }
  return cachedValue;
}

function getServerSnapshot(): Progress {
  return EMPTY_PROGRESS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab changed the progress.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      memoryRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Applies a change to the stored progress and notifies every component using it. */
export function updateProgress(change: (progress: Progress) => Progress): void {
  const before = getSnapshot();
  const changed = change(before);
  // Reaching a new XP level is worth telling Study Hub about; going back (resetting progress) is not.
  const reached = levelOf(changed.xp);
  if (reached > levelOf(before.xp)) reportProgress("level", { label: `Level ${reached}`, ref: "xp-level", value: reached });
  const next = serialiseProgress(changed);
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
    memoryRaw = undefined;
  } catch {
    memoryRaw = next;
  }
  listeners.forEach((listener) => listener());
}

export function resetProgress(): void {
  updateProgress(() => EMPTY_PROGRESS);
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
