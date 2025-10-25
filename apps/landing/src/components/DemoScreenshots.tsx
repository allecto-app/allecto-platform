import { ImageWithFallback } from "./figma/ImageWithFallback";

export function DemoScreenshots() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Veja o Allecto App em ação
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interface moderna e intuitiva para síndicos e moradores
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <div className="inline-block px-4 py-2 rounded-full bg-primary text-primary-foreground mb-2">
              Painel do Síndico
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1758411898049-4de9588be514?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzYxMjg3MTgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Admin Dashboard Interface"
                className="w-full h-auto"
              />
            </div>
            <p className="text-gray-600 px-2">
              Gerencie assembleias, envie convocações e acompanhe resultados em um só lugar.
            </p>
          </div>
          <div className="space-y-4 lg:mt-12">
            <div className="inline-block px-4 py-2 rounded-full bg-secondary text-secondary-foreground mb-2">
              Aplicativo dos Moradores
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white max-w-sm mx-auto">
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1629697776809-f37ceac39e77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2JpbGUlMjBhcHAlMjBtb2NrdXB8ZW58MXx8fHwxNzYxMzYxODQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Mobile App Mockup"
                className="w-full h-auto"
              />
            </div>
            <p className="text-gray-600 px-2 text-center">
              Vote de qualquer lugar, consulte documentos e receba notificações instantâneas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
