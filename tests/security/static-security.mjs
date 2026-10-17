import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
function files(path, predicate = () => true) {
  const output = [];
  for (const entry of readdirSync(path)) {
    const full = join(path, entry);
    if (entry === "node_modules" || entry === ".next" || entry === "dist")
      continue;
    if (statSync(full).isDirectory()) output.push(...files(full, predicate));
    else if (predicate(full)) output.push(full);
  }
  return output;
}
const sourceFiles = files(
  join(root, "apps"),
  (path) => /\.(ts|tsx|js|mjs)$/.test(path) && !/\.test\.[^.]+$/.test(path),
);
const source = sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n");

assert.doesNotMatch(source, /localStorage|sessionStorage/);
console.log("PASS authentication tokens are not stored in browser storage");

assert.doesNotMatch(source, /dangerouslySetInnerHTML/);
console.log("PASS no unsafe React HTML rendering");

assert.doesNotMatch(source, /\$queryRawUnsafe|\$executeRawUnsafe/);
console.log("PASS no unsafe Prisma raw-query APIs");

assert.doesNotMatch(source, /x-demo-user-id|x-demo-tenant-id|x-demo-role/);
console.log("PASS no caller-controlled development identity implementation");

const packageText = readFileSync(join(root, "package-lock.json"), "utf8");
assert.doesNotMatch(packageText, /"jsonwebtoken"|"jose"/);
console.log("PASS no JWT secret surface; opaque server sessions are used");

const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");
assert.match(compose, /127\.0\.0\.1:5432:5432/);
assert.doesNotMatch(compose, /campuspass_dev_only/);
console.log(
  "PASS development database is loopback-only without a default password",
);

const environmentExample = readFileSync(join(root, ".env.example"), "utf8");
assert.doesNotMatch(
  `${source}\n${environmentExample}`,
  /AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=|campuspass_dev_only/,
);
console.log("PASS no former development encryption key or password remains");

const apiMain = readFileSync(join(root, "apps/api/src/main.ts"), "utf8");
assert.match(apiMain, /NODE_ENV !== "production"/);
assert.match(apiMain, /fastifyHelmet/);
console.log(
  "PASS production Swagger restriction and API security headers configured",
);

for (const directory of [
  join(root, "apps/api/dist"),
  join(root, "apps/web/.next/static"),
]) {
  const maps = files(directory, (path) => path.endsWith(".map"));
  assert.equal(
    maps.length,
    0,
    `Unexpected public/build source maps: ${maps.join(", ")}`,
  );
}
console.log("PASS API and browser production source maps absent");

const controllers = files(join(root, "apps/api/src/modules"), (path) =>
  path.endsWith(".controller.ts"),
)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
assert.match(controllers, /SessionAuthGuard/);
assert.match(controllers, /RolesGuard/);
console.log(
  "PASS protected mutations retain backend authentication and RBAC guards",
);

const apiSource = files(join(root, "apps/api/src"), (path) =>
  path.endsWith(".ts"),
)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
assert.doesNotMatch(apiSource, /console\.(log|debug)\s*\(/);
console.log(
  "PASS API source has no direct console logging of request data or secrets",
);
