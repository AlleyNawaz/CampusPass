export type DomainErrorCode =
  | "RESOURCE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "SOLD_OUT"
  | "PURCHASE_LIMIT_EXCEEDED"
  | "TICKET_NOT_ACTIVE"
  | "INVALID_CREDENTIAL"
  | "WRONG_EVENT"
  | "INVALID_STATE"
  | "IDEMPOTENCY_KEY_REUSED";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
