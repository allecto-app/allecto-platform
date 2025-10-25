import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Condomínio Pequeno",
    description: "Até 50 unidades",
    price: "R$ 149",
    period: "/mês",
    features: [
      "Assembleias ilimitadas",
      "Votações seguras",
      "Envio de documentos",
      "Notificações por e-mail",
      "Suporte por e-mail"
    ],
    popular: false
  },
  {
    name: "Condomínio Médio",
    description: "Até 200 unidades",
    price: "R$ 299",
    period: "/mês",
    features: [
      "Todos os recursos do plano Pequeno",
      "Notificações push",
      "Painel analítico avançado",
      "Assinatura digital",
      "Suporte prioritário",
      "Integração com administradoras"
    ],
    popular: true
  },
  {
    name: "Condomínio Grande",
    description: "Plano personalizado",
    price: "Sob consulta",
    period: "",
    features: [
      "Todos os recursos do plano Médio",
      "Múltiplos condomínios",
      "API personalizada",
      "Treinamento dedicado",
      "Gerente de conta",
      "SLA garantido"
    ],
    popular: false
  }
];

export function Pricing() {
  return (
    <section className="py-24 bg-gray-50" id="precos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Planos transparentes
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho do seu condomínio
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative border-2 ${
                plan.popular 
                  ? 'border-primary shadow-2xl scale-105' 
                  : 'border-gray-200 hover:border-primary/30'
              } transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-secondary text-secondary-foreground px-4 py-1">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <h3 className="text-2xl text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="space-y-1">
                  <div className="text-4xl text-gray-900">
                    {plan.price}
                  </div>
                  {plan.period && (
                    <div className="text-gray-500">{plan.period}</div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-primary hover:bg-accent text-primary-foreground' 
                      : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300'
                  }`}
                  size="lg"
                >
                  Começar agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
