import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/** The Content-Security-Policy of each way the app is served. */
const policies = {
  "Cloudflare (public/_headers)": readFileSync(resolve(process.cwd(), "public/_headers"), "utf8").match(/Content-Security-Policy:\s*(.+)/)![1],
  "Coolify (deploy/security-headers.conf)": readFileSync(resolve(process.cwd(), "deploy/security-headers.conf"), "utf8").match(
    /add_header Content-Security-Policy "([^"]+)"/,
  )![1],
};

describe.each(Object.entries(policies))("the policy for %s", (_name, policy) => {
  const directive = (name: string) => policy.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name} `)) ?? "";

  it("lets the app send its progress report to Study Hub, and to nobody else", () => {
    expect(directive("connect-src")).toBe("connect-src 'self' https://insaneones.xyz");
  });

  it("is otherwise as strict as before: nothing from other sites is loaded or embedded", () => {
    expect(directive("default-src")).toBe("default-src 'self'");
    expect(directive("script-src")).toBe("script-src 'self' 'unsafe-inline'");
    expect(directive("img-src")).toBe("img-src 'self' data:");
    expect(directive("object-src")).toBe("object-src 'none'");
    expect(directive("frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(policy).not.toMatch(/\*/);
  });
});

it("both ways of serving the app say the same thing", () => {
  const [cloudflare, coolify] = Object.values(policies);
  expect(coolify).toBe(cloudflare);
});
