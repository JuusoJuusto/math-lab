import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/open-sans";
import "./globals.css";
import "./solver.css";

export const metadata: Metadata = {
  title: {
    default: "MathLab — Learn mathematics by doing",
    template: "%s | MathLab"
  },
  description:
    "A visual, interactive mathematics learning space for equations, algebra and proportional relationships.",
  applicationName: "MathLab",
  keywords: [
    "mathematics",
    "algebra",
    "equations",
    "proportionality",
    "interactive learning",
    "math practice"
  ],
  appleWebApp: {
    capable: true,
    title: "MathLab",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#92e3f1"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}