import { z } from "zod";

export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const uuidSchema = z.string().uuid();

export const freeRegistrationRequestSchema = z.object({
  ticketTypeId: uuidSchema,
  quantity: z.number().int().min(1).max(10),
  policyVersion: z.string().min(1).max(100),
});

export const freeRegistrationResponseSchema = z.object({
  orderId: uuidSchema,
  status: z.literal("CONFIRMED"),
  currency: currencySchema,
  totalMinor: z.literal(0),
  tickets: z.array(
    z.object({
      id: uuidSchema,
      credential: z.string().min(22),
      eventId: uuidSchema,
      status: z.literal("ACTIVE"),
    }),
  ),
});

export const redeemTicketRequestSchema = z.object({
  credential: z.string().min(22).max(256),
  eventId: uuidSchema,
  gateId: uuidSchema,
  scannerSessionId: uuidSchema,
  requestId: uuidSchema,
});

export const admissionOutcomeSchema = z.enum([
  "ADMITTED",
  "ALREADY_USED",
  "WRONG_EVENT",
  "WRONG_GATE",
  "REVOKED",
  "REFUNDED",
  "EXPIRED",
  "UNAUTHORIZED",
  "INVALID_CREDENTIAL",
]);

export const redeemTicketResponseSchema = z.object({
  outcome: admissionOutcomeSchema,
  admittedAt: z.string().datetime().optional(),
  displayName: z.string().max(80).optional(),
  message: z.string().min(1),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    correlationId: z.string(),
    details: z.unknown().optional(),
  }),
});

export type FreeRegistrationRequest = z.infer<
  typeof freeRegistrationRequestSchema
>;
export type FreeRegistrationResponse = z.infer<
  typeof freeRegistrationResponseSchema
>;
export type RedeemTicketRequest = z.infer<typeof redeemTicketRequestSchema>;
export type RedeemTicketResponse = z.infer<typeof redeemTicketResponseSchema>;
export type AdmissionOutcome = z.infer<typeof admissionOutcomeSchema>;
