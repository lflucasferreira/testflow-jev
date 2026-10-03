import { spawn } from "node:child_process";

const child = spawn("npx", ["playwright", "test"], {
  env: { ...process.env, JEV_MODE: "live" },
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
