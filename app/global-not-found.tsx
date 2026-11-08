import "@fontsource-variable/fredoka";
import "@fontsource-variable/open-sans";
import "./globals.css";
import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * Shown for any address that is not a page of the site. It speaks both
 * languages, because an unknown address has no language to go by.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="shell">
          <section className="panel empty">
            <SearchX size={56} aria-hidden="true" />
            <h1>Page not found · Sivua ei löytynyt</h1>
            <p>This page is not part of the learning path. Let&apos;s get you back to mathematics.</p>
            <p lang="fi">Tämä sivu ei kuulu oppimispolkuun. Palataan takaisin matematiikan pariin.</p>
            <p>
              <Link href="/en/" className="cta cta-inline">
                MathLab (English)
              </Link>{" "}
              <Link href="/fi/" className="cta cta-inline" lang="fi">
                MathLab (suomeksi)
              </Link>
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
