export const CONDO_RATE_LIMIT = 20;
export const EMAIL_RATE_LIMIT = 5;
export const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_TTL_HOURS = 168;
export const INVITE_ERROR_MESSAGE = "Unable to send invite";

export function inviteError(): Error {
  return new Error(INVITE_ERROR_MESSAGE);
}
