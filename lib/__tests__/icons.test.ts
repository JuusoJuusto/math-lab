import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const publicFile = (name: string) => new URL(`../../public/${name}`, import.meta.url).pathname;

/** The width and height written in a PNG's header. */
function pngSize(name: string): { width: number; height: number } {
  const bytes = readFileSync(publicFile(name));
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("the logo and icons every host serves from the root", () => {
  it("has the favicon in the formats browsers ask for", () => {
    expect(existsSync(publicFile("favicon.svg"))).toBe(true);
    expect(readFileSync(publicFile("favicon.svg"), "utf8")).toContain("<svg");
    // An .ico file starts with the bytes 00 00 01 00.
    expect([...readFileSync(publicFile("favicon.ico")).subarray(0, 4)]).toEqual([0, 0, 1, 0]);
    expect(pngSize("apple-touch-icon.png")).toEqual({ width: 180, height: 180 });
  });

  it("lists in the manifest only icons that exist, at the size it says", () => {
    const manifest = JSON.parse(readFileSync(publicFile("manifest.webmanifest"), "utf8"));
    expect(manifest.name).toBe("MathLab");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);
    for (const icon of manifest.icons as { src: string; sizes: string; type: string }[]) {
      expect(existsSync(publicFile(icon.src.replace(/^\//, ""))), icon.src).toBe(true);
      if (icon.type === "image/png") {
        const [width, height] = icon.sizes.split("x").map(Number);
        expect(pngSize(icon.src.replace(/^\//, "")), icon.src).toEqual({ width, height });
      }
    }
  });

  it("has the social card at the size sites expect", () => {
    expect(pngSize("og-image.png")).toEqual({ width: 1200, height: 630 });
  });

  it("links the icons from the page layout and from the bare-address page, so the tab shows the logo on every screen", () => {
    const layout = readFileSync(new URL("../../app/[lang]/layout.tsx", import.meta.url), "utf8");
    for (const href of ["/favicon.svg", "/favicon.ico", "/apple-touch-icon.png", "/manifest.webmanifest"]) expect(layout).toContain(href);
    const root = readFileSync(publicFile("index.html"), "utf8");
    for (const href of ["/favicon.svg", "/favicon.ico", "/apple-touch-icon.png"]) expect(root).toContain(href);
  });

  it("is served by the container's nginx with the right type and hides the headers file", () => {
    const nginx = readFileSync(new URL("../../deploy/nginx.conf", import.meta.url), "utf8");
    expect(nginx).toContain("application/manifest+json");
    expect(nginx).toMatch(/location = \/_headers[\s\S]*return 404/);
    expect(nginx).toContain("/healthz");
    const docker = readFileSync(new URL("../../Dockerfile", import.meta.url), "utf8");
    expect(docker).toContain("npm run verify");
    expect(docker).toContain("COPY --from=build /app/out");
  });
});
