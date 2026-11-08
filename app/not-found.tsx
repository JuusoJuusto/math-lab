import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="shell">
      <section className="panel empty">
        <SearchX size={56} aria-hidden="true" />
        <h1>Page not found</h1>
        <p>This page is not part of the learning path. Let&apos;s get you back to mathematics.</p>
        <Link href="/" className="cta cta-inline">
          Back to MathLab
        </Link>
      </section>
    </main>
  );
}
