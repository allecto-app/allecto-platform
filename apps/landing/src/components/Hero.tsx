import { Button } from "./ui/button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl tracking-tight text-gray-900">
                Simplifique as assembleias do seu condomínio.
              </h1>
              <p className="text-xl text-gray-600 max-w-xl">
                Crie, convoque e vote digitalmente com segurança e praticidade.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-accent text-primary-foreground px-8">
                <a href="#precos">
                  Começar agora
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 hover:text-secondary">
                <a href="#recursos">
                  Explorar recursos
                </a>
              </Button>
            </div>
          </div>
          <Image src="/images/hero-1.png" alt="Allecto App" width={1200} height={1200} />
        </div>
      </div>
    </section>
  );
}
