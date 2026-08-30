import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "../../src/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assinatura confirmada — Allecto App",
  description:
    "Obrigado! Seu pagamento do Allecto App foi confirmado. Enviamos um e-mail com os próximos passos para criar sua primeira assembleia.",
  alternates: { canonical: "/success" },
  openGraph: {
    title: "Assinatura confirmada — Allecto App",
    description:
      "Pagamento confirmado com sucesso. Veja os próximos passos e acesso ao painel.",
    url: "https://www.allecto.app/success",
    siteName: "Allecto App",
    images: [
      {
        url: "/images/og/landing-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Assinatura confirmada — Allecto App",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Assinatura confirmada — Allecto App",
    description:
      "Obrigado pela confiança! Enviamos um e-mail com os próximos passos.",
    images: ["/images/og/landing-1200x630.png"],
  },
};

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Pagamento iniciado
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Em instantes você receberá um email da Stripe confirmando a
          contratação. O acesso completo será liberado após a confirmação
          automática do pagamento.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/#precos">Voltar para a página inicial</Link>
        </Button>
      </div>
    </main>
  );
}
