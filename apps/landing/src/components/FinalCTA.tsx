import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-accent to-primary relative overflow-hidden" id="contato">
      <div className="absolute inset-0 bg-grid-white/10 bg-[size:20px_20px]"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-3xl md:text-5xl tracking-tight text-white mb-6">
          Transforme as assembleias do seu condomínio hoje.
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Junte-se a centenas de condomínios que já modernizaram suas assembleias com o Allecto App.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 px-8 group"
          >
            <a href="#precos">
              Começar agora
            </a>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
