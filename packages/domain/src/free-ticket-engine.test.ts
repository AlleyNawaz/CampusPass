import { describe, expect, it } from "vitest";
import { InMemoryFreeTicketEngine } from "./free-ticket-engine.js";

const tenantA = "00000000-0000-4000-8000-000000000001";
const tenantB = "00000000-0000-4000-8000-000000000002";
const eventId = "00000000-0000-4000-8000-000000000003";

describe("free ticket concurrency", () => {
  it("issues exactly 10 tickets when 100 buyers compete for the last 10", async () => {
    let token = 0;
    const engine = new InMemoryFreeTicketEngine(
      {
        tenantId: tenantA,
        eventId,
        ticketTypeId: "tier",
        capacity: 10,
        issued: 0,
        perUserLimit: 1,
      },
      () => `credential-${String(++token).padStart(32, "0")}`,
    );

    const results = await Promise.allSettled(
      Array.from({ length: 100 }, (_, index) =>
        engine.issue({
          tenantId: tenantA,
          userId: `user-${index}`,
          quantity: 1,
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(10);
    expect(engine.snapshot().issued).toBe(10);
    expect(engine.snapshot().tickets).toHaveLength(10);
  });

  it("allows exactly one of 100 simultaneous redemptions", async () => {
    const credential = "opaque-credential-with-at-least-32-characters";
    const engine = new InMemoryFreeTicketEngine(
      {
        tenantId: tenantA,
        eventId,
        ticketTypeId: "tier",
        capacity: 1,
        issued: 0,
        perUserLimit: 1,
      },
      () => credential,
    );
    await engine.issue({ tenantId: tenantA, userId: "user-1", quantity: 1 });

    const results = await Promise.allSettled(
      Array.from({ length: 100 }, () =>
        engine.redeem({ tenantId: tenantA, eventId, credential }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(engine.snapshot().tickets[0]?.status).toBe("CHECKED_IN");
  });
});

describe("tenant isolation", () => {
  it("does not reveal a ticket type across tenants", async () => {
    const engine = new InMemoryFreeTicketEngine({
      tenantId: tenantA,
      eventId,
      ticketTypeId: "tier",
      capacity: 1,
      issued: 0,
      perUserLimit: 1,
    });
    await expect(
      engine.issue({ tenantId: tenantB, userId: "attacker", quantity: 1 }),
    ).rejects.toMatchObject({
      code: "RESOURCE_NOT_FOUND",
    });
    expect(engine.snapshot().issued).toBe(0);
  });

  it("does not redeem an existing credential through another tenant", async () => {
    const engine = new InMemoryFreeTicketEngine({
      tenantId: tenantA,
      eventId,
      ticketTypeId: "tier",
      capacity: 1,
      issued: 0,
      perUserLimit: 1,
    });
    const issued = await engine.issue({
      tenantId: tenantA,
      userId: "user-1",
      quantity: 1,
    });
    const credential = issued[0]?.credential;
    expect(credential).toBeDefined();
    await expect(
      engine.redeem({ tenantId: tenantB, eventId, credential: credential! }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIAL",
    });
  });
});
