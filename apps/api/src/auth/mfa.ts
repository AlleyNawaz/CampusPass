import { generateSecret, generateURI, verify } from "otplib";

export function createMfaEnrollment(label: string) {
  const secret = generateSecret({ length: 20 });
  return {
    secret,
    otpauthUri: createMfaEnrollmentUri(label, secret),
  };
}

export function createMfaEnrollmentUri(label: string, secret: string): string {
  return generateURI({ issuer: "CampusPass", label, secret });
}

export async function verifyMfaCode(
  secret: string,
  code: string,
  afterTimeStep?: number,
): Promise<number | null> {
  const result = await verify({
    secret,
    token: code,
    epochTolerance: [30, 0],
    ...(afterTimeStep === undefined ? {} : { afterTimeStep }),
  });
  return result.valid && "timeStep" in result ? result.timeStep : null;
}
