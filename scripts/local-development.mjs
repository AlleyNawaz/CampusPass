import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { userInfo } from "node:os";
import { join } from "node:path";

export const repositoryRoot = new URL("..", import.meta.url).pathname.replace(
  /\/$/,
  "",
);
export const localRoot = join(repositoryRoot, ".campuspass-local");
export const postgresData = join(localRoot, "postgres-16");
export const postgresSocket = join(localRoot, "socket");
export const postgresLog = join(localRoot, "postgres.log");
export const postgresPort = "55432";
export const databaseName = "campuspass";
export const databaseLogin = "campuspass_dev";

export function postgresBinary(name) {
  const homebrew = `/opt/homebrew/opt/postgresql@16/bin/${name}`;
  return existsSync(homebrew) ? homebrew : name;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }
}

export function capture(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    ...options,
  });
  if (result.error) throw result.error;
  return { status: result.status ?? 1, stdout: result.stdout.trim() };
}

export function loadLocalEnvironment() {
  const path = join(repositoryRoot, ".env");
  if (!existsSync(path)) {
    throw new Error(".env is missing; run npm run dev:setup first");
  }
  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    values[trimmed.slice(0, separator)] = trimmed.slice(separator + 1);
  }
  return values;
}

export function adminDatabaseUrl(database = databaseName) {
  const user = encodeURIComponent(userInfo().username);
  const socket = encodeURIComponent(postgresSocket);
  return `postgresql://${user}@localhost:${postgresPort}/${database}?host=${socket}`;
}
