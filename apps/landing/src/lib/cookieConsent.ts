export const COOKIE_CONSENT_COOKIE_NAME = "cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_DAYS = 180;

export interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
}

export function parseCookieConsent(
  rawValue: string | undefined,
): CookieConsent | null {
  if (!rawValue) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(rawValue);
    const parsed = JSON.parse(decoded) as Partial<CookieConsent> | null;

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.analytics === "boolean"
    ) {
      return {
        necessary:
          typeof parsed.necessary === "boolean" ? parsed.necessary : true,
        analytics: parsed.analytics,
      };
    }
  } catch {
    // ignore malformed cookie values
  }

  return null;
}

export function serializeCookieConsent(consent: CookieConsent): string {
  return encodeURIComponent(JSON.stringify(consent));
}
