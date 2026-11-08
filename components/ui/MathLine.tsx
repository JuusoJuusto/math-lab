"use client";

import type { CSSProperties } from "react";
import { useLang } from "@/hooks/useLang";
import { expressionTokens, formatEquation, parseEquation, toSpeech } from "@/lib/equations";
import { SideView } from "@/components/solver/EquationParts";

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
              <span className="eq-side">{side}</span>
            </span>
          ))
        )}
      </span>
    </span>
  );
}
