import { afterEach, describe, expect, it } from "vitest";
import { readDevActor } from "./dev-actor";

const originalNodeEnv = process.env.NODE_ENV;
const originalDevAuth = process.env.DEV_AUTH_MODE;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  process.env.DEV_AUTH_MODE = originalDevAuth;
});

describe("development actor boundary", () => {
  it("accepts complete synthetic headers only in explicit development mode", () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_MODE = "true";
    expect(
      readDevActor({
        "x-demo-user-id": "10000000-0000-4000-8000-000000000008",
        "x-demo-tenant-id": "10000000-0000-4000-8000-000000000001",
        "x-demo-role": "STUDENT",
      }),
    ).toEqual({
      userId: "10000000-0000-4000-8000-000000000008",
      tenantId: "10000000-0000-4000-8000-000000000001",
      role: "STUDENT",
    });
  });

  it("refuses synthetic authentication in production", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_AUTH_MODE = "true";
    expect(() =>
      readDevActor({
        "x-demo-user-id": "user",
        "x-demo-tenant-id": "tenant",
        "x-demo-role": "STUDENT",
      }),
    ).toThrow("Production authentication is not implemented");
  });

  it("refuses incomplete headers", () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_AUTH_MODE = "true";
    expect(() => readDevActor({ "x-demo-user-id": "user" })).toThrow(
      "Synthetic development actor headers are required",
    );
  });
});
