import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const requireFromApi = createRequire(
  new URL("../../apps/api/package.json", import.meta.url),
);
const { PrismaClient } = requireFromApi("@prisma/client");
const { hashPassword } = requireFromApi("./dist/auth/password.js");

const baseUrl = process.env.SECURITY_TEST_API_URL ?? "http://127.0.0.1:3101/v1";
const databaseUrl = process.env.SECURITY_TEST_ADMIN_DATABASE_URL;
const scannerPassword = process.env.SECURITY_TEST_SCANNER_PASSWORD;
if (!databaseUrl || !scannerPassword) {
  throw new Error(
    "SECURITY_TEST_ADMIN_DATABASE_URL and SECURITY_TEST_SCANNER_PASSWORD are required",
  );
}
const parsedDatabaseUrl = new URL(databaseUrl);
if (!["localhost", "127.0.0.1"].includes(parsedDatabaseUrl.hostname)) {
  throw new Error("Security integration tests refuse non-local databases");
}

const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
const results = [];
function passed(name) {
  results.push(name);
  console.log(`PASS ${name}`);
}
function cookieJar(response) {
  return response.headers
    .getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}
function cookie(jar, name) {
  return jar
    .split("; ")
    .find((value) => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
async function post(path, body, jar = "", extraHeaders = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
      ...(jar ? { Cookie: jar } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}
async function login(email, password) {
  const response = await post("/auth/login", { email, password });
  const payload = await response.json();
  return { response, payload, jar: cookieJar(response) };
}

async function fixtures() {
  await prisma.rateLimitBucket.deleteMany();
  const registeredEmail = `security-register-${randomUUID()}@example.invalid`;
  const tenantA = "10000000-0000-4000-8000-000000000001";
  const tenantB = "30000000-0000-4000-8000-000000000001";
  await prisma.university.upsert({
    where: { id: tenantB },
    update: { status: "ACTIVE" },
    create: {
      id: tenantB,
      slug: "security-other-university",
      name: "Security Other University",
      status: "ACTIVE",
    },
  });
  const accounts = [
    {
      id: "30000000-0000-4000-8000-000000000002",
      universityId: tenantB,
      email: "security-other@example.invalid",
      password: "Other-Tenant-Test-Password-2026!",
      role: "STUDENT",
    },
    {
      id: "30000000-0000-4000-8000-000000000003",
      universityId: tenantA,
      email: "security-admin@example.invalid",
      password: "Admin-Security-Test-Password-2026!",
      role: "UNIVERSITY_ADMIN",
    },
  ];
  for (const account of accounts) {
    await prisma.roleGrant.deleteMany({ where: { userId: account.id } });
    await prisma.user.deleteMany({ where: { id: account.id } });
    await prisma.user.create({
      data: {
        id: account.id,
        universityId: account.universityId,
        emailNormalized: account.email,
        displayName: "Security Test User",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
        passwordCredential: {
          create: { passwordHash: await hashPassword(account.password) },
        },
        roleGrants: {
          create: {
            universityId: account.universityId,
            role: account.role,
            scopeType: "UNIVERSITY",
          },
        },
      },
    });
  }
  const invitationToken = randomBytes(32).toString("base64url");
  await prisma.registrationInvitation.create({
    data: {
      tokenHash: createHash("sha256").update(invitationToken).digest("hex"),
      universityId: tenantA,
      emailNormalized: registeredEmail,
      role: "STUDENT",
      scopeType: "UNIVERSITY",
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });
  return { invitationToken, registeredEmail };
}

async function run() {
  const { invitationToken, registeredEmail } = await fixtures();

  let response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  passed("versioned API health");

  response = await fetch(
    `${baseUrl}/events?university=${encodeURIComponent("' OR 1=1 --")}`,
  );
  assert.equal(response.status, 400);
  passed("SQL injection-shaped query rejected");

  response = await fetch(
    `${baseUrl}/events?university=${encodeURIComponent("<script>alert(1)</script>")}`,
  );
  assert.equal(response.status, 400);
  assert.doesNotMatch(await response.text(), /<script>/i);
  passed("XSS-shaped query rejected and not reflected");

  response = await fetch(
    `${baseUrl}/events?university=${encodeURIComponent("http://127.0.0.1/admin")}`,
  );
  assert.equal(response.status, 400);
  passed("URL-shaped SSRF input rejected");

  response = await post("/auth/register", {
    invitationToken,
    displayName: "Security Registration",
    password: "Registration-Security-Password-2026!",
  });
  assert.equal(response.status, 201);
  response = await post("/auth/register", {
    invitationToken,
    displayName: "Invitation Replay",
    password: "Registration-Security-Password-2026!",
  });
  assert.equal(response.status, 401);
  passed("single-use server-scoped registration invitation");

  const student = await login(
    registeredEmail,
    "Registration-Security-Password-2026!",
  );
  assert.equal(student.response.status, 200);
  assert.equal(student.payload.status, "AUTHENTICATED");
  assert.match(
    student.response.headers.getSetCookie().join(" "),
    /campuspass_session=.*HttpOnly.*SameSite=Strict/i,
  );
  passed("real login and secure session-cookie attributes");

  response = await fetch(`${baseUrl}/auth/session`, {
    headers: { Cookie: "campuspass_session=forged" },
  });
  assert.equal(response.status, 401);
  passed("forged opaque session rejected");

  response = await post(
    "/orders/free",
    {
      ticketTypeId: "10000000-0000-4000-8000-000000000007",
      quantity: 1,
      policyVersion: "demo-v1",
    },
    student.jar,
    { "Idempotency-Key": `csrf-${randomUUID()}` },
  );
  assert.equal(response.status, 403);
  passed("missing CSRF token rejected");

  const other = await login(
    "security-other@example.invalid",
    "Other-Tenant-Test-Password-2026!",
  );
  const otherCsrf = cookie(other.jar, "campuspass_csrf");
  response = await post(
    "/orders/free",
    {
      ticketTypeId: "10000000-0000-4000-8000-000000000007",
      quantity: 1,
      policyVersion: "demo-v1",
    },
    other.jar,
    {
      "X-CSRF-Token": otherCsrf,
      "Idempotency-Key": `idor-${randomUUID()}`,
    },
  );
  assert.equal(response.status, 404);
  passed("cross-tenant IDOR/BOLA attempt hidden");

  const admin = await login(
    "security-admin@example.invalid",
    "Admin-Security-Test-Password-2026!",
  );
  assert.equal(admin.payload.status, "MFA_ENROLLMENT_REQUIRED");
  passed("privileged account MFA gate");

  response = await post("/auth/login", {
    email: registeredEmail,
    password: "Registration-Security-Password-2026!",
    role: "PLATFORM_ADMIN",
  });
  assert.equal(response.status, 400);
  passed("caller-supplied privilege field rejected");

  const studentCsrf = cookie(student.jar, "campuspass_csrf");
  response = await post(
    "/orders/free",
    {
      ticketTypeId: "10000000-0000-4000-8000-000000000007",
      quantity: 1,
      policyVersion: "demo-v1",
    },
    student.jar,
    {
      "X-CSRF-Token": studentCsrf,
      "Idempotency-Key": `concurrency-${randomUUID()}`,
    },
  );
  assert.equal(response.status, 201);
  const order = await response.json();
  const credential = order.tickets[0].credential;
  assert.doesNotMatch(credential, /security-register|@|student/i);
  const scanner = await login("scanner@example.invalid", scannerPassword);
  assert.equal(scanner.response.status, 200);
  const scannerCsrf = cookie(scanner.jar, "campuspass_csrf");
  const outcomes = await Promise.all(
    Array.from({ length: 10 }, async () => {
      const redemption = await post(
        "/scanner/redeem",
        {
          credential,
          eventId: "10000000-0000-4000-8000-000000000006",
          gateId: "10000000-0000-4000-8000-000000000005",
          scannerSessionId: "10000000-0000-4000-8000-000000000010",
          requestId: randomUUID(),
        },
        scanner.jar,
        { "X-CSRF-Token": scannerCsrf },
      );
      assert.equal(redemption.status, 201);
      return (await redemption.json()).outcome;
    }),
  );
  assert.equal(outcomes.filter((value) => value === "ADMITTED").length, 1);
  assert.equal(outcomes.filter((value) => value === "ALREADY_USED").length, 9);
  passed("opaque QR credential and atomic duplicate redemption");

  response = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "size@example.invalid",
      password: "x".repeat(70_000),
    }),
  });
  assert.equal(response.status, 413);
  passed("request body limit");

  response = await fetch(`${baseUrl}/events`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://evil.example",
      "Access-Control-Request-Method": "GET",
    },
  });
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  passed("hostile CORS origin denied");

  assert.equal((await fetch(`${baseUrl}/uploads`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/payments/webhook`)).status, 404);
  passed("upload and unverified payment surfaces remain unavailable");

  await prisma.rateLimitBucket.deleteMany();
  const statuses = [];
  for (let index = 0; index < 11; index += 1) {
    statuses.push(
      (
        await post("/auth/login", {
          email: "bruteforce@example.invalid",
          password: "Wrong-Password-2026!",
        })
      ).status,
    );
  }
  assert.equal(statuses.at(-1), 429);
  assert.ok(statuses.includes(401));
  passed("authentication brute-force rate limit");

  console.log(`RESULT ${results.length} real HTTP security assertions passed`);
}

try {
  await run();
} finally {
  await prisma.$disconnect();
}
