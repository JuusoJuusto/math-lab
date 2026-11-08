"use client";

import { useI18n } from "@/hooks/useLang";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <strong>{t.footer.title}</strong>
      <span>{t.footer.note}</span>
    </footer>
  );
}
