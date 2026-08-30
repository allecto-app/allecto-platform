import Link from "next/link";
import type { Metadata } from "next";
import { XCircle } from "lucide-react";
import { Button } from "../../src/components/ui/button";

export const metadata: Metadata = {
  title: "Checkout cancelado | Allecto",
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <XCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Checkout cancelado</h1>
        <p className="mt-3 text-sm text-gray-600">
          Nenhuma cobrança foi efetuada. Você pode revisar os planos novamente e reiniciar o
          checkout quando estiver pronto.
        </p>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/#precos">Escolher um plano</Link>
        </Button>
      </div>
    </main>
  );
}
