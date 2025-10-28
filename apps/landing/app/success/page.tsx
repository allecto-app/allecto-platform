'use client';

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "../../src/components/ui/button";

export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Pagamento iniciado</h1>
        <p className="mt-3 text-sm text-gray-600">
          Em instantes você receberá um email da Stripe confirmando a assinatura. O acesso completo
          será liberado após a confirmação automática do pagamento.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/#precos">Voltar para a página inicial</Link>
        </Button>
      </div>
    </main>
  );
}
