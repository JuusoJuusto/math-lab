"use client";

import { useSyncExternalStore } from "react";
import { uiMessages, type UiMessages } from "@/lib/i18n";
import { DEFAULT_LANG, isLang, langFromTag, type Lang } from "@/lib/lang";

/**
 * The learner's language, kept in `localStorage` and exposed as an external store.
 *
 * Like the progress store, the server snapshot is the default language, so the
 * static HTML and the first client render agree. After hydration the stored
 * choice (or, if there is none, the browser's language) takes over.
 *
 * If storage is blocked the choice is kept in memory for the session.
 */

export const LANG_KEY = "mathlab:lang:v1";

const listeners = new Set<() => void>();
let memoryLang: Lang | undefined;

function detect(): Lang {
  try {
    return langFromTag(window.navigator.language);
  } catch {
    return DEFAULT_LANG;
  }
}

function getSnapshot(): Lang {
  if (memoryLang) return memoryLang;
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage is blocked: fall through to the browser's language.
  }
  return detect();
}

function getServerSnapshot(): Lang {
  return DEFAULT_LANG;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab changed the language.
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANG_KEY || event.key === null) {
      memoryLang = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Chooses the language for the whole app. */
export function setLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
    memoryLang = undefined;
  } catch {
    memoryLang = lang;
  }
  listeners.forEach((listener) => listener());
}

/** Forgets the choice, so the browser's language applies again. Used by tests. */
export function clearLang(): void {
  memoryLang = undefined;
  try {
    window.localStorage.removeItem(LANG_KEY);
  } catch {
    // Nothing to clear.
  }
  listeners.forEach((listener) => listener());
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The current language, its interface text and a way to change it. */
export function useI18n(): { lang: Lang; t: UiMessages; setLang: (lang: Lang) => void } {
  const lang = useLang();
  return { lang, t: uiMessages(lang), setLang };
}
