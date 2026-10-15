import { describe, expect, it } from "vitest";
import { isAllowedCampusDomain, normalizeEmail } from "./index.js";

describe("email policy", () => {
  it("normalizes without changing the stored source value implicitly", () => {
    expect(normalizeEmail(" Student@Example.EDU ")).toBe("student@example.edu");
  });

  it("requires an exact domain boundary", () => {
    expect(isAllowedCampusDomain("a@example.edu", ["example.edu"])).toBe(true);
    expect(isAllowedCampusDomain("a@evil-example.edu", ["example.edu"])).toBe(
      false,
    );
  });
});
