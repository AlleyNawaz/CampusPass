import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  isSerializationConflict,
  runSerializableTransaction,
} from "./serializable-transaction";

function serializationConflict() {
  return new Prisma.PrismaClientKnownRequestError("write conflict", {
    code: "P2034",
    clientVersion: "6.12.0",
  });
}

describe("serializable transaction retry", () => {
  it("retries a PostgreSQL serialization conflict and returns the committed result", async () => {
    const conflict = serializationConflict();
    const transaction = vi
      .fn()
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce("committed");

    await expect(
      runSerializableTransaction(
        { $transaction: transaction } as never,
        vi.fn(),
      ),
    ).resolves.toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(isSerializationConflict(conflict)).toBe(true);
  });

  it("does not retry non-serialization failures", async () => {
    const failure = new Error("application failure");
    const transaction = vi.fn().mockRejectedValue(failure);

    await expect(
      runSerializableTransaction(
        { $transaction: transaction } as never,
        vi.fn(),
      ),
    ).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledOnce();
  });
});
