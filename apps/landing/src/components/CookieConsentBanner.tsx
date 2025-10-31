"use client";

import { useCallback, useEffect, useState } from "react";

import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_MAX_AGE_DAYS,
  type CookieConsent,
  parseCookieConsent,
  serializeCookieConsent,
} from "../lib/cookieConsent";

const LEGACY_COOKIE_NAME = "allecto_cookie_consent";

function getCookie(name: string) {
  if (typeof document === "undefined") {
    return undefined;
  }

  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split("=");
    if (cookieName === name) {
      return rest.join("=");
    }
  }

  return undefined;
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);
  const expiresString = expires.toUTCString();

  const isSecureContext =
    typeof window !== "undefined" && window.location.protocol === "https:";

  const secureDirective = isSecureContext ? "; Secure" : "";

  document.cookie = `${name}=${value}; Expires=${expiresString}; Path=/; SameSite=Lax${secureDirective}`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/;`;
}

function migrateLegacyConsent(): CookieConsent | null {
  const legacyValue = getCookie(LEGACY_COOKIE_NAME);

  if (legacyValue === "accepted") {
    return { necessary: true, analytics: true };
  }

  if (legacyValue === "rejected") {
    return { necessary: true, analytics: false };
  }

  return null;
}

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<CookieConsent | null | undefined>(
    undefined
  );

  useEffect(() => {
    const storedConsent = parseCookieConsent(
      getCookie(COOKIE_CONSENT_COOKIE_NAME)
    );

    if (storedConsent) {
      setConsent(storedConsent);
      return;
    }

    const legacyConsent = migrateLegacyConsent();

    if (legacyConsent) {
      setCookie(
        COOKIE_CONSENT_COOKIE_NAME,
        serializeCookieConsent(legacyConsent),
        COOKIE_CONSENT_MAX_AGE_DAYS
      );
      deleteCookie(LEGACY_COOKIE_NAME);
      setConsent(legacyConsent);
      return;
    }

    setConsent(null);
  }, []);

  const persistConsent = useCallback((nextConsent: CookieConsent) => {
    setCookie(
      COOKIE_CONSENT_COOKIE_NAME,
      serializeCookieConsent(nextConsent),
      COOKIE_CONSENT_MAX_AGE_DAYS
    );
    deleteCookie(LEGACY_COOKIE_NAME);
    setConsent(nextConsent);

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent({ necessary: true, analytics: true });
  }, [persistConsent]);

  const rejectAnalytics = useCallback(() => {
    persistConsent({ necessary: true, analytics: false });
  }, [persistConsent]);

  if (consent === undefined || consent !== null) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700 sm:text-xs">
            Utilizamos cookies para personalizar nosso site e analisar o tráfego
            da web para melhorar a experiência do usuário. Você pode recusar
            esses cookies, embora certas áreas do site possam não funcionar
            corretamente sem eles. Consulte nossa política de privacidade para
            obter mais informações.
          </p>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-none sm:justify-end">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 sm:px-5 sm:text-base"
              onClick={rejectAnalytics}
            >
              Rejeitar
            </button>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:px-5 sm:text-base"
              onClick={acceptAll}
            >
              Aceitar tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
