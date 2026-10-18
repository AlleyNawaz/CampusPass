import { existsSync, mkdirSync } from "node:fs";
import {
  capture,
  localRoot,
  postgresBinary,
  postgresData,
  postgresLog,
  postgresPort,
  postgresSocket,
  run,
} from "./local-development.mjs";

export function databaseReady() {
  return (
    capture(postgresBinary("pg_isready"), [
      "-h",
      postgresSocket,
      "-p",
      postgresPort,
    ]).status === 0
  );
}

export function startDatabase() {
  mkdirSync(localRoot, { recursive: true, mode: 0o700 });
  mkdirSync(postgresSocket, { recursive: true, mode: 0o700 });
  if (!existsSync(`${postgresData}/PG_VERSION`)) {
    run(postgresBinary("initdb"), [
      "-D",
      postgresData,
      "--auth-local=trust",
      "--auth-host=scram-sha-256",
      "--encoding=UTF8",
      "--no-locale",
    ]);
  }
  if (!databaseReady()) {
    run(postgresBinary("pg_ctl"), [
      "-D",
      postgresData,
      "-l",
      postgresLog,
      "-o",
      `-p ${postgresPort} -k ${postgresSocket} -h 127.0.0.1`,
      "start",
    ]);
  }
  if (!databaseReady()) throw new Error("PostgreSQL did not become ready");
  process.stdout.write(
    `CampusPass PostgreSQL is ready on 127.0.0.1:${postgresPort}\n`,
  );
}

export function stopDatabase() {
  if (!existsSync(`${postgresData}/PG_VERSION`) || !databaseReady()) {
    process.stdout.write("CampusPass PostgreSQL is already stopped\n");
    return;
  }
  run(postgresBinary("pg_ctl"), ["-D", postgresData, "stop", "-m", "fast"]);
}

const invokedDirectly = process.argv[1] === new URL(import.meta.url).pathname;
if (invokedDirectly) {
  const action = process.argv[2] ?? "status";
  if (action === "start") startDatabase();
  else if (action === "stop") stopDatabase();
  else if (action === "status") {
    process.stdout.write(databaseReady() ? "running\n" : "stopped\n");
    process.exitCode = databaseReady() ? 0 : 1;
  } else throw new Error(`Unknown database action: ${action}`);
}
