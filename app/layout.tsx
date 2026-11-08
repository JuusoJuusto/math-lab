import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/open-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MathLab – Matikka haltuun!", template: "%s · MathLab" },
  description: "Opiskele yhtälöitä ja verrannollisuutta interaktiivisilla tehtävillä.",
  applicationName: "MathLab"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#92e3f1"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}