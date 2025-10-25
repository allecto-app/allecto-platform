import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

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
                Agendar demonstração
              </Button>
              <Button size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                Explorar recursos
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/5 to-accent/10">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1730822077021-49dc49c06547?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjB2b3RpbmclMjBzbWFydHBob25lfGVufDF8fHx8MTc2MTM4NjQzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="People using voting app on smartphones"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-secondary rounded-full blur-3xl opacity-20"></div>
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-accent rounded-full blur-3xl opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
