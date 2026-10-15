import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DomainError } from "@campuspass/domain";

export function toHttpError(error: unknown): never {
  if (error instanceof DomainError) {
    if (
      error.code === "RESOURCE_NOT_FOUND" ||
      error.code === "INVALID_CREDENTIAL"
    ) {
      throw new NotFoundException({ code: error.code, message: error.message });
    }
    if (
      error.code === "SOLD_OUT" ||
      error.code === "TICKET_NOT_ACTIVE" ||
      error.code === "INVALID_STATE" ||
      error.code === "IDEMPOTENCY_KEY_REUSED"
    ) {
      throw new ConflictException({ code: error.code, message: error.message });
    }
    throw new UnprocessableEntityException({
      code: error.code,
      message: error.message,
    });
  }
  throw error;
}
