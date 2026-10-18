import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  adminDatabaseUrl,
  capture,
  databaseLogin,
  databaseName,
  loadLocalEnvironment,
  localRoot,
  postgresBinary,
  postgresPort,
  postgresSocket,
  repositoryRoot,
  run,
} from "./local-development.mjs";
import { startDatabase } from "./dev-db.mjs";

const envPath = join(repositoryRoot, ".env");

function secret(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function ensureEnvironment() {
  if (!existsSync(envPath)) {
    const password = secret(24);
    const values = [
      "NODE_ENV=development",
      "WEB_PORT=3000",
      "API_PORT=3001",
      `POSTGRES_DB=${databaseName}`,
      `POSTGRES_USER=${databaseLogin}`,
      `POSTGRES_PASSWORD=${password}`,
      `DATABASE_URL=postgresql://${databaseLogin}:${encodeURIComponent(password)}@127.0.0.1:${postgresPort}/${databaseName}?schema=public`,
      "PUBLIC_WEB_ORIGIN=http://localhost:3000",
      "API_PUBLIC_URL=http://localhost:3001/v1",
      "NEXT_PUBLIC_API_URL=http://localhost:3001/v1",
      "PAID_TICKETS_ENABLED=false",
      "OFFLINE_SCANNING_ENABLED=false",
      "EMAIL_PROVIDER=console-disabled",
      "PAYMENT_PROVIDER=disabled",
      `TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64=${randomBytes(32).toString("base64")}`,
      `AUTH_PASSWORD_PEPPER=${secret(32)}`,
      `AUTH_MFA_ENCRYPTION_KEY_BASE64=${randomBytes(32).toString("base64")}`,
      `DATABASE_APP_ROLE=${databaseLogin}`,
      "TRUST_PROXY=false",
      "API_BODY_LIMIT_BYTES=65536",
      `SEED_STUDENT_PASSWORD=${secret(18)}`,
      `SEED_SCANNER_PASSWORD=${secret(18)}`,
      "",
    ];
    writeFileSync(envPath, values.join("\n"), { mode: 0o600, flag: "wx" });
    process.stdout.write(
      "Created untracked .env with development-only secrets\n",
    );
  }
  const env = loadLocalEnvironment();
  const required = [
    "DATABASE_URL",
    "POSTGRES_PASSWORD",
    "AUTH_PASSWORD_PEPPER",
    "AUTH_MFA_ENCRYPTION_KEY_BASE64",
    "TICKET_CREDENTIAL_ENCRYPTION_KEY_BASE64",
    "SEED_STUDENT_PASSWORD",
    "SEED_SCANNER_PASSWORD",
  ];
  const missing = required.filter((name) => !env[name]);
  if (missing.length)
    throw new Error(`Missing local settings: ${missing.join(", ")}`);
  return env;
}

mkdirSync(localRoot, { recursive: true, mode: 0o700 });
const localEnv = ensureEnvironment();
startDatabase();

const roleSql = `DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${databaseLogin}') THEN
    CREATE ROLE ${databaseLogin} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${localEnv.POSTGRES_PASSWORD}';
  ELSE
    ALTER ROLE ${databaseLogin} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '${localEnv.POSTGRES_PASSWORD}';
  END IF;
END $$;`;
run(
  postgresBinary("psql"),
  [
    "-h",
    postgresSocket,
    "-p",
    postgresPort,
    "-d",
    "postgres",
    "-v",
    "ON_ERROR_STOP=1",
  ],
  { input: roleSql, stdio: ["pipe", "inherit", "inherit"] },
);

const databaseExists =
  capture(postgresBinary("psql"), [
    "-h",
    postgresSocket,
    "-p",
    postgresPort,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`,
  ]).stdout === "1";
if (!databaseExists) {
  run(postgresBinary("createdb"), [
    "-h",
    postgresSocket,
    "-p",
    postgresPort,
    databaseName,
  ]);
}

const adminEnv = {
  ...process.env,
  ...localEnv,
  DATABASE_URL: adminDatabaseUrl(),
};
run("npm", ["run", "db:generate"], { env: adminEnv });
run("npm", ["run", "db:migrate"], { env: adminEnv });
run(postgresBinary("psql"), [
  "-h",
  postgresSocket,
  "-p",
  postgresPort,
  "-d",
  databaseName,
  "-v",
  "ON_ERROR_STOP=1",
  "-c",
  `GRANT campuspass_app TO ${databaseLogin}`,
]);
run("npm", ["run", "db:seed"], { env: adminEnv });

process.stdout.write(
  [
    "CampusPass local development setup is ready.",
    "Synthetic accounts: student@example.invalid and scanner@example.invalid.",
    "Passwords are stored only in the untracked .env file.",
    "Start the application with: npm run dev",
  ].join("\n") + "\n",
);
