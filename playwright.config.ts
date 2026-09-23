import { defineConfig } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  testDir: "./tests",
  workers: 1,
  timeout: 60_000,
  use: { actionTimeout: 10_000, baseURL: "http://localhost:3107", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --webpack --port 3107",
    url: "http://localhost:3107",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      OPENAI_API_KEY: "",
      NEXT_BUILD_DIR: ".next-e2e",
      AI_SANA_DATA_DIR: mkdtempSync(join(tmpdir(), "ai-sana-e2e-")),
    },
  },
});
