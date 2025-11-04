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
  title: "Allecto App — Assembleias e votação online seguras",
  description:
    "Simplifique assembleias do seu condomínio: convites, PDFs com acesso restrito e votação segura em tempo real. Agende uma demonstração do Allecto App.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Allecto App — Assembleias e votação online seguras",
    description:
      "Crie assembleias, envie convites e vote com segurança. Resultados em tempo real. Agende uma demo.",
    url: "https://www.allecto.app/",
    siteName: "Allecto App",
    images: [
      {
        url: "/images/og/landing-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Allecto App — assembleias e votação online",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Allecto App — Assembleias e votação online seguras",
    description:
      "Convites, PDFs com acesso restrito e votação segura em tempo real. Agende uma demonstração.",
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
