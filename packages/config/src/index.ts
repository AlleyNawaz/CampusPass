export const requiredProductionFlags = {
  PAID_TICKETS_ENABLED: "false-until-approved",
  OFFLINE_SCANNING_ENABLED: "false-until-approved",
} as const;

export const removedRuntimeFlags = ["DEV_AUTH_MODE"] as const;
