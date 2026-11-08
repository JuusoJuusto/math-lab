/**
 * The MathLab mark: four operation tiles in a round badge, in the same
 * module colours the topic cards use. Drawn as SVG, not an emoji.
 */
export function LogoMark({ size = 56 }: { size?: number }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="MathLab">
      <circle cx="32" cy="32" r="30" fill="#16222e" stroke="#fff" strokeWidth="3" />
      {/* plus */}
      <rect x="14" y="14" width="17" height="17" rx="4.5" fill="#2f6edb" />
      <path d="M22.5 18.5v8M18.5 22.5h8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      {/* minus */}
      <rect x="33" y="14" width="17" height="17" rx="4.5" fill="#d62f40" />
      <path d="M38 22.5h7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      {/* times */}
      <rect x="14" y="33" width="17" height="17" rx="4.5" fill="#7b4dd6" />
      <path d="M19 38l7 7M26 38l-7 7" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      {/* divide */}
      <rect x="33" y="33" width="17" height="17" rx="4.5" fill="#f39a14" />
      <path d="M38 41.5h7" stroke="#16222e" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="41.5" cy="37.6" r="1.6" fill="#16222e" />
      <circle cx="41.5" cy="45.4" r="1.6" fill="#16222e" />
    </svg>
  );
}

/** "MathLab" as a chunky outlined wordmark, like GeoMaster and MasterModus. */
export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={large ? "wordmark wordmark-large" : "wordmark"} aria-hidden="true">
      MathLab
    </span>
  );
}
