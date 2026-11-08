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

/**
 * The address the site is served from, for the social-sharing picture. It is only known at build time:
 * set NEXT_PUBLIC_SITE_URL (for example https://mathlab.example.com) when building for a host. Without it
 * the page has no social card, and everything else works the same.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const copy = COPY[lang];
  return {
    ...(SITE_URL
      ? {
          metadataBase: new URL(SITE_URL),
          openGraph: { title: copy.title, description: copy.description, siteName: "MathLab", type: "website", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "MathLab" }] },
          twitter: { card: "summary_large_image", title: copy.title, description: copy.description, images: ["/og-image.png"] },
        }
      : {}),
    // The icons are plain files in the root, so every host (Cloudflare, Coolify, a plain web server) serves them at the same addresses.
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "48x48" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.webmanifest",
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
