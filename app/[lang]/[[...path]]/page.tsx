import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { App } from "@/components/app/App";
import { LANGS, isLang } from "@/lib/lang";
import { uiMessages } from "@/lib/i18n";
import { parseAddress, staticSegments } from "@/lib/routes";

/**
 * One page for every screen. The set of pages is fixed (`staticSegments`), so
 * every screen of the app is a real HTML file in both languages:
 * `/fi/`, `/fi/learn/two-step/`, `/en/solve/word/`, ...
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.flatMap((lang) => staticSegments().map((path) => ({ lang, path })));
}

/** Each screen has its own title in the HTML, so tabs, history and search results tell the pages apart. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; path?: string[] }> }): Promise<Metadata> {
  const { lang, path = [] } = await params;
  if (!isLang(lang)) return {};
  const route = parseAddress(path.join("/"));
  return { title: { absolute: uiMessages(lang).titles[route.name] } };
}

export default async function Page({ params }: { params: Promise<{ lang: string; path?: string[] }> }) {
  const { lang, path = [] } = await params;
  if (!isLang(lang)) notFound();
  return <App lang={lang} path={path} />;
}
