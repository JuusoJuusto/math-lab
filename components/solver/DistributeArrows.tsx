import { distributionOf } from "@/lib/equations";

const FACTOR = 60;
const PAREN = 20;
const TERM = 76;
const TOP = 46;
const BASE = 84;

/**
 * The arrows a textbook draws when a number multiplies a bracket: one from the
 * number to every term inside, so nothing is forgotten. It is a picture of the
 * expression named in the question above it, so it is hidden from screen
 * readers. Parts that are not "number times bracket" show nothing.
 */
export function DistributeArrows({ part }: { part: string }) {
  const found = distributionOf(part);
  if (!found) return null;

  const factorX = FACTOR / 2;
  const termX = (index: number) => FACTOR + PAREN + TERM * index + TERM / 2;
  const closeX = FACTOR + PAREN + TERM * found.terms.length + PAREN / 2;
  const width = FACTOR + PAREN + TERM * found.terms.length + PAREN;

  return (
    <svg className="distribute" viewBox={`0 0 ${width} 96`} aria-hidden="true" focusable="false" data-testid="distribute-arrows">
      <defs>
        <marker id="distribute-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M1 1 L9 5 L1 9 Z" className="distribute-head" />
        </marker>
      </defs>
      {found.terms.map((term, index) => (
        <path
          key={`${term}-${index}`}
          className="distribute-arc"
          d={`M ${factorX} ${TOP} Q ${(factorX + termX(index)) / 2} ${TOP - 26 * (index + 1)} ${termX(index)} ${TOP}`}
          markerEnd="url(#distribute-head)"
          data-arc=""
        />
      ))}
      <text className="distribute-text distribute-factor" x={factorX} y={BASE} textAnchor="middle">
        {found.factor}
      </text>
      <text className="distribute-text" x={FACTOR + PAREN / 2} y={BASE} textAnchor="middle">
        (
      </text>
      {found.terms.map((term, index) => (
        <text key={`t-${term}-${index}`} className="distribute-text" x={termX(index)} y={BASE} textAnchor="middle">
          {/* A term after the first one is written with its sign, as it is in the equation: x + 3, x − 2. */}
          {index > 0 && !term.startsWith("−") ? `+ ${term}` : index > 0 ? `− ${term.slice(1)}` : term}
        </text>
      ))}
      <text className="distribute-text" x={closeX} y={BASE} textAnchor="middle">
        )
      </text>
    </svg>
  );
}
