import type { Lang } from "../lang";
import { en } from "./text-en";
import { fi } from "./text-fi";
import type { EngineText } from "./text-types";

export type { EngineText } from "./text-types";

const TEXTS: Record<Lang, EngineText> = { en, fi };

/** The wording the engine uses in a language. */
export function engineText(lang: Lang = "en"): EngineText {
  return TEXTS[lang];
}
