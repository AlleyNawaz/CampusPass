import { createOpaqueCredential, hashCredential } from "./credential.js";
import { DomainError } from "./errors.js";
import { Mutex } from "./mutex.js";

export type Ticket = {
  id: string;
  tenantId: string;
  eventId: string;
  ownerId: string;
  credentialHash: string;
  status: "ACTIVE" | "CHECKED_IN" | "REVOKED" | "REFUNDED";
};

type Inventory = {
  tenantId: string;
  eventId: string;
  ticketTypeId: string;
  capacity: number;
  issued: number;
  perUserLimit: number;
};

export class InMemoryFreeTicketEngine {
  private readonly lock = new Mutex();
  private readonly tickets = new Map<string, Ticket>();
  private readonly credentials = new Map<string, string>();
  private readonly issuedByUser = new Map<string, number>();
  private sequence = 0;

  constructor(
    private readonly inventory: Inventory,
    private readonly tokenFactory: () => string = createOpaqueCredential,
  ) {}

  async issue(input: { tenantId: string; userId: string; quantity: number }) {
    return this.lock.runExclusive(() => {
      if (input.tenantId !== this.inventory.tenantId) {
        throw new DomainError(
          "RESOURCE_NOT_FOUND",
          "Ticket type was not found",
        );
      }
      const key = `${input.tenantId}:${input.userId}`;
      const prior = this.issuedByUser.get(key) ?? 0;
      if (prior + input.quantity > this.inventory.perUserLimit) {
        throw new DomainError(
          "PURCHASE_LIMIT_EXCEEDED",
          "Ticket limit exceeded",
        );
      }
      if (this.inventory.issued + input.quantity > this.inventory.capacity) {
        throw new DomainError("SOLD_OUT", "No ticket inventory remains");
      }

      const issued: Array<{ ticket: Ticket; credential: string }> = [];
      for (let index = 0; index < input.quantity; index += 1) {
        const credential = this.tokenFactory();
        const credentialHash = hashCredential(credential);
        if (this.credentials.has(credentialHash))
          throw new Error("Credential collision");
        const ticket: Ticket = {
          id: `ticket-${++this.sequence}`,
          tenantId: input.tenantId,
          eventId: this.inventory.eventId,
          ownerId: input.userId,
          credentialHash,
          status: "ACTIVE",
        };
        this.tickets.set(ticket.id, ticket);
        this.credentials.set(credentialHash, ticket.id);
        issued.push({ ticket: { ...ticket }, credential });
      }
      this.inventory.issued += input.quantity;
      this.issuedByUser.set(key, prior + input.quantity);
      return issued;
    });
  }

  async redeem(input: {
    tenantId: string;
    eventId: string;
    credential: string;
  }) {
    return this.lock.runExclusive(() => {
      const ticketId = this.credentials.get(hashCredential(input.credential));
      const ticket = ticketId ? this.tickets.get(ticketId) : undefined;
      if (!ticket || ticket.tenantId !== input.tenantId) {
        throw new DomainError("INVALID_CREDENTIAL", "Credential is not valid");
      }
      if (ticket.eventId !== input.eventId) {
        throw new DomainError("WRONG_EVENT", "Ticket is for a different event");
      }
      if (ticket.status !== "ACTIVE") {
        throw new DomainError("TICKET_NOT_ACTIVE", "Ticket is not active");
      }
      ticket.status = "CHECKED_IN";
      return { ticketId: ticket.id, outcome: "ADMITTED" as const };
    });
  }

  snapshot() {
    return {
      capacity: this.inventory.capacity,
      issued: this.inventory.issued,
      tickets: [...this.tickets.values()].map((ticket) => ({ ...ticket })),
    };
  }
}
