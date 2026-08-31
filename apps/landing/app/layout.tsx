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
  metadataBase: new URL("https://www.allecto.app"),
  title: "Assembleia Condominial Online e Votação Segura | Allecto",
  description:
    "Realize assembleias condominiais online com convocações, quórum, votação, fração ideal, atas e relatórios. Avulso por R$249 ou planos a partir de R$149/mês.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Assembleia Condominial Online e Votação Segura | Allecto",
    description:
      "Realize assembleias condominiais online com convocações, quórum, votação, fração ideal, atas e relatórios. Avulso por R$249 ou planos a partir de R$149/mês.",
    url: "https://www.allecto.app/",
    siteName: "Allecto App",
    images: [
      {
        url: "/images/og/landing-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Allecto — assembleia condominial online e votação segura",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assembleia Condominial Online e Votação Segura | Allecto",
    description:
      "Convocações, quórum, votação, atas e relatórios para assembleias condominiais online.",
    images: ["/images/og/landing-1200x630.png"],
  },
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
        {allowAnalytics ? (
          <Script id="consent-mode-update" strategy="beforeInteractive">
            {`
              gtag('consent', 'update', {
                analytics_storage: 'granted'
              });
            `}
          </Script>
        ) : null}
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
