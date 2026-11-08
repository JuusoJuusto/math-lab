import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MathLab uses Lucide icons for every icon. Emojis, and text symbols used as
 * icons (check marks, arrows, bullets, stars), are never allowed.
 * Mathematical symbols such as × ÷ − ± are notation, not icons, and are fine.
 */

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const FOLDERS = ["app", "components", "content", "hooks", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

function sourceFiles(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const full = path.join(folder, name);
    if (name === "node_modules") return [];
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return EXTENSIONS.has(path.extname(name)) ? [full] : [];
  });
}

const files = FOLDERS.flatMap((folder) => sourceFiles(path.join(ROOT, folder)));
const isTest = (file: string) => file.includes("__tests__") || /\.test\.tsx?$/.test(file);

describe("icons", () => {
  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("never uses an emoji anywhere in the source", () => {
    const offenders = files.filter((file) => /\p{Extended_Pictographic}/u.test(readFileSync(file, "utf8")));
    expect(offenders.map((file) => path.relative(ROOT, file))).toEqual([]);
  });

  it("never uses a text symbol as an icon in the interface", () => {
    // Check marks, crosses, arrows, bullets, stars and warning signs, written as escapes so this file stays clean.
    const glyphs = /[\u2713\u2714\u2717\u2718\u2715\u2716\u2192\u2190\u2191\u2193\u2022\u2605\u2606\u2733\u2726\u26a0]/u;
    const offenders = files.filter((file) => !isTest(file) && glyphs.test(readFileSync(file, "utf8")));
    expect(offenders.map((file) => path.relative(ROOT, file))).toEqual([]);
  });
});
