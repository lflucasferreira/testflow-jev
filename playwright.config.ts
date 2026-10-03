import { defineConfig } from "@playwright/test";

const live = process.env.JEV_MODE === "live";

export default defineConfig({
  testDir: "tests",
  timeout: live ? 60_000 : 30_000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: [
    {
      command: "node demo/server.mjs",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      env: { ...process.env, PORT: "4173" },
    },
    ...(live
      ? []
      : [
          {
            command: "node mock/jev-server.mjs",
            url: "http://127.0.0.1:4174/health",
            reuseExistingServer: true,
            env: { ...process.env, PORT: "4174" },
          },
        ]),
  ],
});
