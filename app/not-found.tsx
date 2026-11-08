"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { useI18n } from "@/hooks/useLang";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="shell">
      <section className="panel empty">
        <SearchX size={56} aria-hidden="true" />
        <h1>{t.not_found.title}</h1>
        <p>{t.not_found.text}</p>
        <Link href="/" className="cta cta-inline">
          {t.not_found.home}
        </Link>
      </section>
    </main>
  );
}
