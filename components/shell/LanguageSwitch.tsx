"use client";

import { useI18n } from "@/hooks/useLang";
import { LANGS, LANG_NAMES } from "@/lib/lang";

/** FI | EN. A pair of toggle buttons; the choice is remembered in this browser. */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, t, setLang } = useI18n();
  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label={t.nav.language}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          className="lang-option"
          aria-pressed={lang === code}
          aria-label={`${LANG_NAMES[code]} (${code.toUpperCase()})`}
          title={LANG_NAMES[code]}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
