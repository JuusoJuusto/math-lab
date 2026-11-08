/**
 * The languages MathLab speaks.
 *
 * Language only ever changes words and symbols. It never changes numbers, so a
 * task generated from the same recipe has the same maths in Finnish and in
 * English (a test checks this for thousands of recipes).
 */

export type Lang = "en" | "fi";

export const LANGS: readonly Lang[] = ["en", "fi"];

export const DEFAULT_LANG: Lang = "en";

/** The name of each language, written in that language. */
export const LANG_NAMES: Record<Lang, string> = { en: "English", fi: "Suomi" };

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "fi";
}

/** Picks a language from a browser language tag such as "fi-FI" or "en-GB". */
export function langFromTag(tag: string | undefined | null): Lang {
  return typeof tag === "string" && tag.toLowerCase().startsWith("fi") ? "fi" : DEFAULT_LANG;
}

/** A value written once for every language. */
export type Localised<T> = Readonly<Record<Lang, T>>;
