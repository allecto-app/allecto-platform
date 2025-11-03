import "../src/styles/globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import Script from "next/script";

import {
  COOKIE_CONSENT_COOKIE_NAME,
  parseCookieConsent,
} from "../src/lib/cookieConsent";

export const metadata: Metadata = {
  title: "Allecto App",
  description:
    "Simplifique as assembleias do seu condomínio com convocações, votações e atas digitais.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const consent = parseCookieConsent(
    cookieStore.get(COOKIE_CONSENT_COOKIE_NAME)?.value
  );
  const allowAnalytics = consent?.analytics === true;

  return (
    <html lang="pt-BR">
      <head>
        <Script id="consent-mode-defaults" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              analytics_storage: 'denied'
            });
          `}
        </Script>
      </head>
      <body>
        {allowAnalytics ? <GoogleTagManager gtmId="GTM-PRXXLQHV" /> : null}
        {children}
        <script
          type="text/javascript"
          id="hs-script-loader"
          async
          defer
          src="//js-na1.hs-scripts.com/50664691.js"
        ></script>
      </body>
    </html>
  );
}
