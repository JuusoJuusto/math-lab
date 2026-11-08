"use client";

import { Globe } from "lucide-react";
import { navigate } from "@/hooks/useRoute";
import { rememberLang, useI18n } from "@/hooks/useLang";
import { LANGS, LANG_NAMES } from "@/lib/lang";
import { toPath, type Route } from "@/lib/routes";

/**
 * FI | EN, on the right of the top bar.
 *
 * Each choice is a real link to the same screen in the other language
 * (`/fi/learn/two-step/` and `/en/learn/two-step/`), so it works in a new tab
 * and without JavaScript. A plain click switches in place, instantly.
 */
export function LanguageSwitch({ route }: { route: Route }) {
  const { lang, t } = useI18n();

  return (
    <nav className="lang-switch" aria-label={t.nav.language}>
      <Globe className="lang-globe" size={18} aria-hidden="true" />
      {LANGS.map((code) => (
        <a
          key={code}
          href={toPath(route, code)}
          hrefLang={code}
          lang={code}
          className="lang-option"
          aria-current={code === lang ? "true" : undefined}
          aria-label={`${LANG_NAMES[code]} (${code.toUpperCase()})`}
          title={LANG_NAMES[code]}
          onClick={(event) => {
            rememberLang(code);
            const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
            if (!plain) return;
            event.preventDefault();
            navigate(route, code);
          }}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
