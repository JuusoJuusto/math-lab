"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLang } from "@/hooks/useLang";
import { expressionTokens, formatEquation, parseEquation, toSpeech } from "@/lib/equations";
import { SideView } from "@/components/solver/EquationParts";

const FRACTION = /\(([^()]*)\)\/(\d+)|([\dx]+)\/(\d+)/g;

/** Written fractions (x/2, 3x/4, (x + 1)/2) drawn as stacked fractions, everything else as it is written. */
function rich(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(FRACTION)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span className="eq-frac" key={match.index}>
        <span className="eq-frac-top">{match[1] ?? match[3]}</span>
        <span className="eq-frac-bottom">{match[2] ?? match[4]}</span>
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * An equation shown in large maths type. Equations in standard form get
 * stacked fractions; equations with brackets are shown as written.
 * A hidden spoken version is included for screen readers.
 */
export function MathLine({ text }: { text: string }) {
  const lang = useLang();
  const parsed = parseEquation(text);
  const standard = parsed.ok && formatEquation(parsed.value) === text;
  const sides = text.split(" = ");

  return (
    <span className="mathline" style={{ "--eq-chars": text.length } as CSSProperties}>
      <span className="sr-only">{toSpeech(text, lang)}</span>
      <span className="mathline-row" aria-hidden="true">
        {parsed.ok && standard ? (
          <>
            <SideView tokens={expressionTokens(parsed.value.left)} side="left" />
            <span className="eq-sign">=</span>
            <SideView tokens={expressionTokens(parsed.value.right)} side="right" />
          </>
        ) : (
          sides.map((side, index) => (
            <span className="mathline-part" key={index}>
              {index > 0 && <span className="eq-sign">=</span>}
              <span className="eq-side">{rich(side)}</span>
            </span>
          ))
        )}
      </span>
    </span>
  );
}
