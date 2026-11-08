/**
 * The interface text, in each language.
 *
 * `uiMessages("fi")` and `uiMessages("en")` have exactly the same shape; the
 * compiler enforces it, so a string can never exist in one language only.
 * Components get the current language's messages from `useT()`.
 */

import type { Lang } from "../lang";
import { en, type UiMessages } from "./ui-en";
import { fi } from "./ui-fi";

export type { UiMessages, ModeText } from "./ui-en";

const MESSAGES: Record<Lang, UiMessages> = { en, fi };

export function uiMessages(lang: Lang = "en"): UiMessages {
  return MESSAGES[lang];
}
