"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useProgress } from "@/hooks/useProgress";
import { levelOf } from "@/lib/progress";
import { sectionOf, toHash, type Route } from "@/lib/routes";
import { LogoMark, Wordmark } from "./Logo";

const LINKS = [
  { section: "home", label: "Home", route: { name: "home" } },
  { section: "learn", label: "Learn", route: { name: "learn" } },
  { section: "practice", label: "Practice", route: { name: "practice" } },
  { section: "progress", label: "Progress", route: { name: "progress" } },
] as const;

/** The yellow level coin and XP total, as in MasterModus. */
export function XpBadge() {
  const { xp } = useProgress();
  return (
    <a className="xp-badge" href={toHash({ name: "progress" })} aria-label={`Level ${levelOf(xp)}, ${xp} XP. Open progress.`}>
      <span className="xp-coin" aria-hidden="true">
        {levelOf(xp)}
      </span>
      <span className="xp-total" aria-hidden="true">
        {xp} XP
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
      <a className={section === "home" ? "brand brand-hidden" : "brand"} href={toHash({ name: "home" })} aria-label="MathLab home">
        <LogoMark size={44} />
        <Wordmark />
      </a>

      <nav className="pills" aria-label="Main navigation">
        {LINKS.map((link) => (
          <a key={link.section} className="pill" href={toHash(link.route)} aria-current={section === link.section ? "page" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>

      <XpBadge />

      <button
        type="button"
        className="menu-button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenOn(open ? null : here)}
      >
        {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {open && (
        <>
          <button type="button" className="menu-backdrop" aria-label="Close menu" tabIndex={-1} onClick={() => setOpenOn(null)} />
          <nav className="menu-sheet" id="mobile-menu" aria-label="Menu">
            {LINKS.map((link) => (
              <a key={link.section} className="menu-link" href={toHash(link.route)} aria-current={section === link.section ? "page" : undefined}>
                {link.label}
              </a>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
