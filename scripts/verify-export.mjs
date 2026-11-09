// Checks the exported site in out/ before it is deployed.
//
//   node scripts/verify-export.mjs
//
// It fails (exit code 1) when a page is missing in one language, a page has the
// wrong language, the files Cloudflare needs are not there, or a page loads
// something from another site. It reads files only; it needs no network.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;
const problems = [];
const fail = (message) => problems.push(message);

if (!existsSync(OUT)) {
  console.error("out/ does not exist. Run `npm run build` first.");
  process.exit(1);
}

function pagesUnder(dir) {
  const found = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...pagesUnder(path));
    else if (name === "index.html") found.push(relative(dir.startsWith(OUT) ? OUT : dir, path));
  }
  return found;
}

function routesOf(lang) {
  const root = join(OUT, lang);
  if (!existsSync(root)) {
    fail(`out/${lang}/ is missing`);
    return [];
  }
  return pagesUnder(root).map((file) => file.replace(`${lang}/`, "").replace(/index\.html$/, ""));
}

const en = routesOf("en").sort();
const fi = routesOf("fi").sort();

if (en.length < 30) fail(`only ${en.length} English pages were exported`);
for (const route of en) if (!fi.includes(route)) fail(`/fi/${route} is missing (it exists in English)`);
for (const route of fi) if (!en.includes(route)) fail(`/en/${route} is missing (it exists in Finnish)`);

const EXTERNAL = /(?:src|href)="(https?:)?\/\/(?!www\.w3\.org)[^"]+"/g;
for (const [lang, routes] of [["en", en], ["fi", fi]]) {
  for (const route of routes) {
    const file = join(OUT, lang, route, "index.html");
    const html = readFileSync(file, "utf8");
    if (!html.includes(`<html lang="${lang}"`)) fail(`${lang}/${route}index.html is not marked lang="${lang}"`);
    if (!/<title>[^<]+<\/title>/.test(html)) fail(`${lang}/${route}index.html has no title`);
    const external = html.match(EXTERNAL);
    if (external) fail(`${lang}/${route}index.html loads from another site: ${external[0]}`);
  }
}

const needed = ["index.html", "404.html", "robots.txt", "_headers"];
for (const name of needed) if (!existsSync(join(OUT, name))) fail(`out/${name} is missing`);

if (existsSync(join(OUT, "index.html"))) {
  const root = readFileSync(join(OUT, "index.html"), "utf8");
  if (!root.includes("/fi/") || !root.includes("/en/")) fail("out/index.html does not lead to both /fi/ and /en/");
}
if (existsSync(join(OUT, "404.html")) && !/404|not found|ei löydy/i.test(readFileSync(join(OUT, "404.html"), "utf8"))) {
  fail("out/404.html does not look like a not-found page");
}

const wrangler = new URL("../wrangler.jsonc", import.meta.url).pathname;
if (existsSync(wrangler)) {
  const text = readFileSync(wrangler, "utf8");
  if (!/"directory"\s*:\s*"\.\/out"/.test(text)) fail("wrangler.jsonc does not point the assets at ./out");
  if (!/"not_found_handling"\s*:\s*"404-page"/.test(text)) fail('wrangler.jsonc needs "not_found_handling": "404-page"');
  if (!/"html_handling"\s*:\s*"auto-trailing-slash"/.test(text)) fail('wrangler.jsonc needs "html_handling": "auto-trailing-slash"');
}

if (problems.length) {
  console.error(`The export has ${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Export OK: ${en.length} pages in English, ${fi.length} in Finnish, both with the same addresses.`);
