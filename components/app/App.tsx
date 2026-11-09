"use client";

import { useEffect, useRef } from "react";
import { LangProvider, useI18n } from "@/hooks/useLang";
import { replaceRoute, useAddress } from "@/hooks/useRoute";
import { DEFAULT_LANG, type Lang } from "@/lib/lang";
import { parseHash, parseLocation, toPath, type Route } from "@/lib/routes";
import { readProgress } from "@/hooks/useProgress";
import { reportSnapshotOnce } from "@/src/studyHubSnapshot";
import { initStudyHub } from "@/src/studyHubProgress";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LearnScreen } from "@/components/screens/LearnScreen";
import { LessonScreen } from "@/components/screens/LessonScreen";
import { PracticeHub } from "@/components/screens/PracticeHub";
import { ProgressScreen } from "@/components/screens/ProgressScreen";
import { SolverScreen } from "@/components/screens/SolverScreen";
import { TestScreen } from "@/components/screens/TestScreen";

// Runs when the page's script loads, before React reads the address: a student who came from Study Hub has a token
// after the # of the address, which is kept for this visit and removed from the address bar. Without one, nothing happens.
if (typeof window !== "undefined") initStudyHub();

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case "home":
      return <HomeScreen />;
    case "learn":
      return <LearnScreen />;
    case "lesson":
      return <LessonScreen topicId={route.topic} />;
    case "solver":
      return <SolverScreen levelId={route.level} />;
    case "practice":
      return <PracticeHub modeId={route.mode} />;
    case "session":
      return <PracticeSession key={toPath(route, DEFAULT_LANG)} route={route} />;
    case "test":
      return <TestScreen />;
    case "progress":
      return <ProgressScreen />;
  }
}

function Shell({ route }: { route: Route }) {
  const { lang, t } = useI18n();
  const main = useRef<HTMLElement>(null);
  const key = toPath(route, DEFAULT_LANG);
  const first = useRef(true);

  // A student who came from Study Hub may have earned progress here before: tell Study Hub about it, once per visit.
  useEffect(() => {
    reportSnapshotOnce(readProgress(), lang);
    // Only when the page opens; what is earned later is reported as it happens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Next.js puts the address it saw at load time back once the page has hydrated, which brings the Study Hub token
  // back into the address bar. If that happened, take it out again (the token is already kept for this visit).
  useEffect(() => {
    if (/(?:^#|&)hub_token=/.test(window.location.hash)) initStudyHub();
  }, []);

  // The page language and title follow the address, for screen readers and the tab.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.titles[route.name];
  }, [lang, t, route.name]);

  // A new screen starts at the top, with focus moved into it for keyboard and screen-reader users.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    document.documentElement.scrollTop = 0;
    main.current?.focus({ preventScroll: true });
    // The screen is identified by its address; the language alone does not move focus.
  }, [key]);

  return (
    <div className="shell">
      <button type="button" className="skip-link" onClick={() => main.current?.focus()}>
        {t.nav.skip}
      </button>
      <Header route={route} />
      <main id="main" className="main" tabIndex={-1} ref={main}>
        <Screen route={route} />
      </main>
      <Footer />
    </div>
  );
}

interface AppProps {
  /** The language of the page that was built. The address decides afterwards. */
  lang?: Lang;
  /** The path segments after the language that the page was built for, e.g. `["learn", "two-step"]`. */
  path?: readonly string[];
}

/**
 * The whole application: header, the current screen, footer.
 *
 * The page's address is the single source of truth for the screen and the
 * language. The server build and the first client render use the address the
 * page was built for; the learner's query (practice settings) is read right after.
 */
export function App({ lang: builtLang = DEFAULT_LANG, path = [] }: AppProps) {
  const built = `/${[builtLang, ...path].join("/")}/`;
  const address = useAddress(built);
  const { lang: urlLang, route } = parseLocation(address);
  const lang = urlLang ?? builtLang;

  // Links from before the languages had their own addresses (`#/learn/two-step`) are upgraded in place.
  useEffect(() => {
    if (window.location.hash.startsWith("#/")) replaceRoute(parseHash(window.location.hash), lang);
    // Only once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LangProvider lang={lang}>
      <Shell route={route} />
    </LangProvider>
  );
}
