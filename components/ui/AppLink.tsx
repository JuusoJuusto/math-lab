"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "@/hooks/useRoute";
import { useLang } from "@/hooks/useLang";
import { toPath, type Route } from "@/lib/routes";

type AppLinkProps = { route: Route } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/**
 * A link to a screen, in the current language.
 *
 * It is a real link to a real page, so it works with a new tab, a copied
 * address and without JavaScript. A plain click is handled in the app, which
 * is instant and keeps the page's state.
 */
export function AppLink({ route, onClick, target, children, ...rest }: AppLinkProps) {
  const lang = useLang();
  const href = toPath(route, lang);

  function handle(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    const plain = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    if (event.defaultPrevented || !plain || (target && target !== "_self")) return;
    event.preventDefault();
    navigate(route, lang);
  }

  return (
    <a href={href} target={target} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
