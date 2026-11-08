"use client";

import { useEffect, useRef } from "react";
import { useRoute } from "@/hooks/useRoute";
import { toHash, type Route } from "@/lib/routes";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LearnScreen } from "@/components/screens/LearnScreen";
import { LessonScreen } from "@/components/screens/LessonScreen";
import { PracticeHub } from "@/components/screens/PracticeHub";
import { ProgressScreen } from "@/components/screens/ProgressScreen";
import { SolverScreen } from "@/components/screens/SolverScreen";

const TITLES: Record<Route["name"], string> = {
  home: "MathLab",
  learn: "Learn | MathLab",
  lesson: "Lesson | MathLab",
  solver: "Equation solver | MathLab",
  practice: "Practice | MathLab",
  session: "Practice | MathLab",
  progress: "Progress | MathLab",
};

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
      return <PracticeSession key={toHash(route)} route={route} />;
    case "progress":
      return <ProgressScreen />;
  }
}

/** The whole application: header, the current screen, footer. */
export function App() {
  const route = useRoute();
  const main = useRef<HTMLElement>(null);
  const hash = toHash(route);
  const first = useRef(true);

  // A new screen starts at the top, with focus moved into it for keyboard and screen-reader users.
  useEffect(() => {
    document.title = TITLES[route.name];
    if (first.current) {
      first.current = false;
      return;
    }
    document.documentElement.scrollTop = 0;
    main.current?.focus({ preventScroll: true });
    // The screen is identified by its address.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  return (
    <div className="shell">
      <button type="button" className="skip-link" onClick={() => main.current?.focus()}>
        Skip to content
      </button>
      <Header route={route} />
      <main id="main" className="main" tabIndex={-1} ref={main}>
        <Screen route={route} />
      </main>
      <Footer />
    </div>
  );
}
