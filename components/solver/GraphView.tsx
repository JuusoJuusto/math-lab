"use client";

import { useState } from "react";
import { ChartLine } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { formatExpression, formatFraction, graphOf, type Equation } from "@/lib/equations";

const W = 360;
const H = 240;
const PAD = 26;

/** A tick spacing that gives a handful of grid lines. */
function step(range: number): number {
  return range <= 12 ? 1 : range <= 30 ? 5 : range <= 80 ? 10 : 20;
}

/**
 * Check it on a graph: each side of the equation is drawn as a line, and the
 * solution is where the two lines cross. Parallel lines mean no solution; the
 * same line twice means every x is a solution.
 */
export function GraphView({ equation }: { equation: Equation }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const words = t.solver.graph;
  const graph = graphOf(equation);

  const px = (x: number) => PAD + ((x - graph.xMin) / (graph.xMax - graph.xMin)) * (W - 2 * PAD);
  const py = (y: number) => H - PAD - ((y - graph.yMin) / (graph.yMax - graph.yMin)) * (H - 2 * PAD);
  const xs: number[] = [];
  for (let x = Math.ceil(graph.xMin); x <= graph.xMax; x += step(graph.xMax - graph.xMin)) xs.push(x);
  const ys: number[] = [];
  const dy = step(graph.yMax - graph.yMin);
  for (let y = Math.ceil(graph.yMin / dy) * dy; y <= graph.yMax; y += dy) ys.push(y);

  const line = (side: typeof graph.left) => ({ x1: px(side.from.x), y1: py(side.from.y), x2: px(side.to.x), y2: py(side.to.y) });
  const verdict = graph.kind === "one" && graph.meet ? words.meet(formatFraction(graph.meet.value)) : graph.kind === "none" ? words.none : words.infinite;

  return (
    <section className="graph" aria-label={words.title}>
      <button type="button" className="chip-button" aria-expanded={open} onClick={() => setOpen(!open)}>
        <ChartLine size={16} aria-hidden="true" /> {open ? words.hide : words.show}
      </button>
      {open && (
        <div className="graph-body">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={words.alt(graph.kind)} className="graph-svg">
            {xs.map((x) => (
              <line key={`gx${x}`} x1={px(x)} x2={px(x)} y1={PAD / 2} y2={H - PAD / 2} className="graph-grid" />
            ))}
            {ys.map((y) => (
              <line key={`gy${y}`} y1={py(y)} y2={py(y)} x1={PAD / 2} x2={W - PAD / 2} className="graph-grid" />
            ))}
            {graph.yMin < 0 && graph.yMax > 0 && <line x1={PAD / 2} x2={W - PAD / 2} y1={py(0)} y2={py(0)} className="graph-axis" />}
            {graph.xMin < 0 && graph.xMax > 0 && <line y1={PAD / 2} y2={H - PAD / 2} x1={px(0)} x2={px(0)} className="graph-axis" />}
            {xs.map((x) => (
              <text key={`tx${x}`} x={px(x)} y={H - 6} className="graph-tick" textAnchor="middle">
                {x}
              </text>
            ))}
            <line {...line(graph.left)} className="graph-line graph-left" />
            <line {...line(graph.right)} className="graph-line graph-right" />
            {graph.meet && (
              <>
                <circle cx={px(graph.meet.x)} cy={py(graph.meet.y)} r={6} className="graph-meet" />
                <text x={px(graph.meet.x)} y={py(graph.meet.y) - 12} className="graph-meet-label" textAnchor="middle">
                  x = {formatFraction(graph.meet.value)}
                </text>
              </>
            )}
          </svg>
          <ul className="graph-legend">
            <li>
              <span className="swatch graph-left" aria-hidden="true" /> {words.left(formatExpression(graph.left.expression))}
            </li>
            <li>
              <span className="swatch graph-right" aria-hidden="true" /> {words.right(formatExpression(graph.right.expression))}
            </li>
          </ul>
          <p className="intro-demo-note">{verdict}</p>
        </div>
      )}
    </section>
  );
}
