import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    exclude: ["node_modules/**", ".next/**", "out/**"],
    projects: [
      {
        // Mathematical logic and content: plain Node, no browser needed.
        extends: true,
        test: {
          name: "engine",
          environment: "node",
          include: ["lib/**/*.test.ts", "content/**/*.test.ts"],
        },
      },
      {
        // Learning interactions: React components in a simulated browser.
        extends: true,
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["components/**/*.test.tsx", "hooks/**/*.test.tsx", "app/**/*.test.tsx", "src/**/*.test.ts"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
