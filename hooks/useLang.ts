"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";
import { uiMessages, type UiMessages } from "@/lib/i18n";
import { DEFAULT_LANG, isLang, langFromTag, type Lang } from "@/lib/lang";

/**
 * The language of the page. It comes from the address (`/fi/...`, `/en/...`), so
 * the server-built HTML and the first client render always agree, and a link
 * always opens in the language it was shared in.
 *
 * The learner's last choice is only a *preference* kept in `localStorage`. It
 * decides where the bare address `/` leads, and nothing else.
 */

export const LANG_KEY = "mathlab:lang:v1";

const LangContext = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return createElement(LangContext.Provider, { value: lang }, children);
}

export function useLang(): Lang {
  return useContext(LangContext);
}

/** The current language and its interface text. */
export function useI18n(): { lang: Lang; t: UiMessages } {
  const lang = useLang();
  return { lang, t: uiMessages(lang) };
}

/** The language the learner chose last, or the browser's language, or the default. */
export function preferredLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage is blocked: use the browser's language.
  }
  try {
    return langFromTag(window.navigator.language);
  } catch {
    return DEFAULT_LANG;
  }
}

/** Remembers the learner's choice for the next visit. Failing to remember is harmless. */
export function rememberLang(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch {
    // The choice just is not remembered.
  }
}
