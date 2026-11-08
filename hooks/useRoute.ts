"use client";

import { useSyncExternalStore } from "react";
import { HOME, parseHash, toHash, type Route } from "@/lib/routes";

/**
 * The current screen, read from the address bar's hash.
 *
 * Going to another screen adds a history entry, so the browser's Back button
 * (and the phone's back gesture) work as expected. The server render and the
 * first client render both show the home screen, so there is no mismatch.
 */

let cachedHash: string | null = null;
let cachedRoute: Route = HOME;

function getSnapshot(): Route {
  const hash = window.location.hash;
  if (hash !== cachedHash) {
    cachedHash = hash;
    cachedRoute = parseHash(hash);
  }
  return cachedRoute;
}

function subscribe(listener: () => void): () => void {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/** Goes to a screen, keeping the Back button useful. */
export function navigate(route: Route): void {
  const hash = toHash(route);
  if (window.location.hash !== hash) window.location.hash = hash;
}

/** Changes the address without adding a history entry, for example when a session restarts. */
export function replaceRoute(route: Route): void {
  window.history.replaceState(null, "", toHash(route));
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getSnapshot, () => HOME);
}
