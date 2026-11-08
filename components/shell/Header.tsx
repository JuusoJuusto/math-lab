"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { useProgress } from "@/hooks/useProgress";
import { levelOf } from "@/lib/progress";
import { sectionOf, toHash, type Route } from "@/lib/routes";
import { LanguageSwitch } from "./LanguageSwitch";
import { LogoMark, Wordmark } from "./Logo";

const LINKS = [
  { section: "home", route: { name: "home" } },
  { section: "learn", route: { name: "learn" } },
  { section: "practice", route: { name: "practice" } },
  { section: "progress", route: { name: "progress" } },
] as const;

/** The yellow level coin and XP total, as in MasterModus. */
export function XpBadge() {
  const { xp } = useProgress();
  const { t } = useI18n();
  return (
    <a className="xp-badge" href={toHash({ name: "progress" })} aria-label={t.xp.badge(levelOf(xp), xp)}>
      <span className="xp-coin" aria-hidden="true">
        {levelOf(xp)}
      </span>
      <span className="xp-total" aria-hidden="true">
        {t.xp.short(xp)}
      </span>
    </a>
  );
}

/**
 * Top bar: pill navigation on wide screens, a menu on phones.
 *
 * The menu is open only for the screen it was opened on, so going anywhere
 * closes it without any effect that sets state.
 */
export function Header({ route }: { route: Route }) {
  const here = toHash(route);
  const { t } = useI18n();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === here;
  const section = sectionOf(route);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="topbar">
      <a className={section === "home" ? "brand brand-hidden" : "brand"} href={toHash({ name: "home" })} aria-label={t.nav.homeLabel}>
        <LogoMark size={44} />
        <Wordmark />
      </a>

      <nav className="pills" aria-label={t.nav.main}>
        {LINKS.map((link) => (
          <a key={link.section} className="pill" href={toHash(link.route)} aria-current={section === link.section ? "page" : undefined}>
            {t.nav[link.section]}
          </a>
        ))}
      </nav>

      <LanguageSwitch className="lang-switch-bar" />
      <XpBadge />

      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        onClick={() => setOpenOn(open ? null : here)}
      >
        {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <button type="button" className="menu-backdrop" aria-label={t.nav.closeMenu} tabIndex={-1} onClick={() => setOpenOn(null)} />
          <nav className="menu-sheet" id="mobile-menu" aria-label={t.nav.menu}>
            {LINKS.map((link) => (
              <a key={link.section} className="menu-link" href={toHash(link.route)} aria-current={section === link.section ? "page" : undefined}>
                {t.nav[link.section]}
              </a>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
