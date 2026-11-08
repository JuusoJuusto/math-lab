import type { Token } from "@/lib/equations";

const OPERATOR_TEXTS = new Set(["+", "−", "×", "÷"]);

/** Groups neighbouring tokens so the learner's operation reads as one highlighted unit. */
function groupByApplied(tokens: readonly Token[]): { applied: boolean; tokens: Token[] }[] {
  const groups: { applied: boolean; tokens: Token[] }[] = [];
  for (const token of tokens) {
    const applied = Boolean(token.applied);
    const last = groups[groups.length - 1];
    if (last && last.applied === applied) last.tokens.push(token);
    else groups.push({ applied, tokens: [token] });
  }
  return groups;
}

function TokenView({ token }: { token: Token }) {
  if (token.denominator) {
    return (
      <span className="eq-term">
        {token.prefix}
        <span className="eq-frac">
          <span className="eq-frac-top">{token.text}</span>
          <span className="eq-frac-bottom">{token.denominator}</span>
        </span>
      </span>
    );
  }
  if (token.text === "(") return <span className="eq-paren eq-paren-open">(</span>;
  if (token.text === ")") return <span className="eq-paren eq-paren-close">)</span>;
  if (OPERATOR_TEXTS.has(token.text) && !token.prefix) return <span className="eq-op">{token.text}</span>;
  return (
    <span className="eq-term">
      {token.prefix}
      {token.text}
    </span>
  );
}

export function SideView({ tokens, side }: { tokens: readonly Token[]; side: "left" | "right" }) {
  return (
    <span className={`eq-side eq-side-${side}`}>
      {groupByApplied(tokens).map((group, index) =>
        group.applied ? (
          <span className="eq-applied" key={index}>
            {group.tokens.map((token, i) => (
              <TokenView token={token} key={i} />
            ))}
          </span>
        ) : (
          group.tokens.map((token, i) => <TokenView token={token} key={`${index}-${i}`} />)
        ),
      )}
    </span>
  );
}

