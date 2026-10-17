import { setTimeout as delay } from "node:timers/promises";
import { Prisma, PrismaClient } from "@prisma/client";

const MAX_SERIALIZABLE_ATTEMPTS = 8;

export async function runSerializableTransaction<T>(
  prisma: Pick<PrismaClient, "$transaction">,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (
        !isSerializationConflict(error) ||
        attempt === MAX_SERIALIZABLE_ATTEMPTS
      ) {
        throw error;
      }
      // Bounded jitter reduces immediate collision without materially delaying a scan.
      await delay(attempt * 5 + Math.floor(Math.random() * 10));
    }
  }
  throw new Error("Serializable transaction retry limit exhausted");
}

export function isSerializationConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}
