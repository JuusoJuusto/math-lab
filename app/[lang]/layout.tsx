import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/open-sans";
import "../globals.css";
import "../solver.css";
import { LANGS, isLang } from "@/lib/lang";

/**
 * The root layout of every page. The language is part of the address
 * (`/fi/...`, `/en/...`), so each page is built with the right `<html lang>`.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

const COPY = {
  en: {
    title: "MathLab: learn mathematics by doing",
    description: "A visual, interactive mathematics learning space for equations, algebra and proportional relationships.",
    keywords: ["mathematics", "algebra", "equations", "proportionality", "interactive learning", "math practice"],
  },
  fi: {
    title: "MathLab: opi matematiikkaa tekemällä",
    description: "Visuaalinen ja interaktiivinen matematiikan oppimisympäristö yhtälöihin, algebraan ja verrannollisuuteen.",
    keywords: ["matematiikka", "algebra", "yhtälöt", "verrannollisuus", "interaktiivinen oppiminen", "matematiikan harjoittelu"],
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = COPY[lang];
  return {
    title: { default: copy.title, template: "%s | MathLab" },
    description: copy.description,
    applicationName: "MathLab",
    keywords: [...copy.keywords],
    appleWebApp: { capable: true, title: "MathLab", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9be6f3",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
