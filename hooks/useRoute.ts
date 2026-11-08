"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LANG, type Lang } from "@/lib/lang";
import { parseLocation, toPath, type Route } from "@/lib/routes";

/**
 * The address bar as an external store.
 *
 * Going to another screen adds a history entry (`pushState`), so the browser's
 * Back button and the phone's back gesture work as expected. The server render
 * and the first client render both use the address the page was built for
 * (without the query), so there is never a hydration mismatch; the real query
 * is picked up right after.
 */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

function getSnapshot(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/** The current address (`/fi/learn/two-step/?x=1`). `initial` is what the server-built page was made for. */
export function useAddress(initial: string): string {
  return useSyncExternalStore(subscribe, getSnapshot, () => initial);
}

/** The language of the page the learner is on right now, read from the address. */
export function currentLang(): Lang {
  return parseLocation(window.location.pathname).lang ?? DEFAULT_LANG;
}

/** Goes to a screen, keeping the Back button useful. */
export function navigate(route: Route, lang: Lang = currentLang()): void {
  navigateToUrl(toPath(route, lang));
}

/** Goes to an address of this site. */
export function navigateToUrl(url: string): void {
  if (`${window.location.pathname}${window.location.search}` === url) return;
  window.history.pushState(null, "", url);
  notify();
}

/** Changes the address without adding a history entry, for example when a session restarts or an old link is upgraded. */
export function replaceRoute(route: Route, lang: Lang = currentLang()): void {
  window.history.replaceState(null, "", toPath(route, lang));
  notify();
}
