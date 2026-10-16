import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4199",
    viewport: { width: 1360, height: 1000 },
  },
  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4199 --strictPort",
    url: "http://127.0.0.1:4199",
    reuseExistingServer: false,
  },
  reporter: "list",
});
