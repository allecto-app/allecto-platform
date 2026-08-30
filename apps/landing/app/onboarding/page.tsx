import { Suspense } from "react";
import { SignupFlow } from "../../src/components/onboarding/SignupFlow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allecto App — Finalize sua assinatura com segurança",
  description:
    "Conclua sua assinatura do Allecto App com segurança. Pagamento protegido, resumo do plano e suporte para ativar sua primeira assembleia.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Allecto App — Finalize sua assinatura com segurança",
    description:
      "Pagamento seguro, resumo do plano e suporte para ativar sua primeira assembleia.",
    url: "https://www.allecto.app/onboarding",
    siteName: "Allecto App",
    images: [
      {
        url: "/images/og/landing-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Checkout — Allecto App",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Allecto App — Finalize sua assinatura com segurança",
    description:
      "Pagamento protegido e suporte para ativar sua primeira assembleia.",
    images: ["/images/og/landing-1200x630.png"],
  },
};

function OnboardingContent() {
  return <SignupFlow />;
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-gray-600">Carregando...</div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
