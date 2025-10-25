import { Card, CardContent } from "./ui/card";
import { Shield, FileCheck, Bell, BarChart3, Lock, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Votação online segura",
    description: "Sistema criptografado e em conformidade com regulamentações, garantindo privacidade total."
  },
  {
    icon: FileCheck,
    title: "Atas e documentos em PDF",
    description: "Envio automático com controle de acesso restrito e assinatura digital."
  },
  {
    icon: Bell,
    title: "Notificações inteligentes",
    description: "Avisos por e-mail e push para garantir alta participação nas votações."
  },
  {
    icon: BarChart3,
    title: "Resultados em tempo real",
    description: "Acompanhe a participação e os votos ao vivo com transparência total."
  },
  {
    icon: Lock,
    title: "Compliance e auditoria",
    description: "Registros completos e trilhas de auditoria para garantir conformidade legal."
  },
  {
    icon: Users,
    title: "Painel administrativo intuitivo",
    description: "Interface simples e poderosa para síndicos e administradoras gerenciarem tudo."
  }
];

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Recursos principais
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tudo que você precisa para assembleias eficientes e transparentes
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
