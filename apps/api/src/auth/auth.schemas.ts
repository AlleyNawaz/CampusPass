import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(12).max(128),
  })
  .strict();

export const registrationSchema = z
  .object({
    invitationToken: z.string().min(32).max(256),
    displayName: z.string().trim().min(2).max(120),
    password: z.string().min(12).max(128),
  })
  .strict();

export const totpCodeSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();
