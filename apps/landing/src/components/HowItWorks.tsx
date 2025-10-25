import { FileText, Send, Vote } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Crie a assembleia",
    description: "Configure a pauta, documentos e opções de votação em minutos."
  },
  {
    icon: Send,
    title: "Envie convites e documentos",
    description: "Notifique moradores por e-mail com todos os materiais necessários."
  },
  {
    icon: Vote,
    title: "Os moradores votam com segurança",
    description: "Acompanhe votação em tempo real com garantia de privacidade."
  }
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Como funciona
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Três passos simples para modernizar suas assembleias
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl text-gray-900">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/20 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
