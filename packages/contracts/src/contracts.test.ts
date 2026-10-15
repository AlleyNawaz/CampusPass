import { describe, expect, it } from "vitest";
import {
  freeRegistrationRequestSchema,
  redeemTicketRequestSchema,
} from "./index.js";

describe("API contracts", () => {
  it("rejects invalid free ticket quantities", () => {
    const result = freeRegistrationRequestSchema.safeParse({
      ticketTypeId: "00000000-0000-4000-8000-000000000001",
      quantity: 0,
      policyVersion: "v1",
    });
    expect(result.success).toBe(false);
  });

  it("never accepts a ticket identifier in place of an opaque credential", () => {
    const result = redeemTicketRequestSchema.safeParse({
      credential: "123",
      eventId: "00000000-0000-4000-8000-000000000001",
      gateId: "00000000-0000-4000-8000-000000000002",
      scannerSessionId: "00000000-0000-4000-8000-000000000003",
      requestId: "00000000-0000-4000-8000-000000000004",
    });
    expect(result.success).toBe(false);
  });
});
