import { Button } from "./ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-24 md:pt-12 md:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight text-gray-900">
                Assembleia condominial online, do convite à ata
              </h1>
              <p className="text-xl text-gray-600 max-w-xl">
                Organize pautas, envie convocações, acompanhe o quórum, realize
                votações e gere atas e relatórios em uma plataforma segura para
                condomínios e administradoras.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-accent text-primary-foreground px-8"
                asChild
              >
                <Link href="/onboarding?plan=avulso">
                  Realizar uma assembleia por R$249
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5 hover:text-secondary"
                asChild
              >
                <Link href="#precos">Conhecer os planos</Link>
              </Button>
            </div>
          </div>
          <img src="/images/hero-1.png" alt="Allecto App" />
        </div>
      </div>
    </section>
  );
}
