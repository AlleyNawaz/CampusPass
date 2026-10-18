import { spawn } from "node:child_process";
import { loadLocalEnvironment, repositoryRoot } from "./local-development.mjs";
import { databaseReady, startDatabase } from "./dev-db.mjs";

const localEnv = loadLocalEnvironment();
if (!databaseReady()) startDatabase();

const environment = { ...process.env, ...localEnv };
const children = ["@campuspass/api", "@campuspass/web"].map((workspace) => {
  const child = spawn("npm", ["run", "dev", "--workspace", workspace], {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    process.stderr.write(`${workspace} failed to start: ${error.message}\n`);
  });
  return child;
});

let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(signal));
}
for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!stopping) {
      stop("SIGTERM");
      process.exitCode = signal ? 1 : (code ?? 1);
    }
  });
}
