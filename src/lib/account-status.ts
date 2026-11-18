export const SUSPENDED_LOGIN_MESSAGE =
  "Your account has been temporarily suspended. Please contact support.";

export const SUSPENSION_REASONS = [
  "Unauthorized Login",
  "Suspicious Activity",
  "Payment Issue",
  "Other",
] as const;

export type SuspensionReason = (typeof SUSPENSION_REASONS)[number];
