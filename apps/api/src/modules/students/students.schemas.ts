import { z } from "zod";

export const updateStudentProfileSchema = z
  .object({
    displayName: z.string().trim().min(2).max(120),
    locale: z
      .string()
      .trim()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
      .max(20),
    timezone: z.string().trim().min(1).max(100),
  })
  .strict();
