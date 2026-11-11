import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    // Data Grid mount and repaint in jsdom exceeds the 5s default on GHA.
    testTimeout: 15_000,
  },
});
