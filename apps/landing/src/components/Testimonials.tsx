import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "O Allecto simplificou completamente nossas assembleias. Passamos de 30% para 85% de participação nas votações!",
    name: "Carlos Mendes",
    role: "Síndico, São Paulo",
    image: "https://images.unsplash.com/photo-1622626426572-c268eb006092?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBidXNpbmVzcyUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTI5MTQ4OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    initials: "CM"
  },
  {
    quote: "Ferramenta indispensável para administradoras modernas. Nossos clientes adoram a praticidade e segurança.",
    name: "Ana Paula Silva",
    role: "Administradora XYZ, Rio de Janeiro",
    image: "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MTMwMzIxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    initials: "AS"
  },
  {
    quote: "Economia de tempo e custos com uma plataforma 100% em conformidade. Recomendo para todos os condomínios.",
    name: "Roberto Costa",
    role: "Conselho Administrativo, Belo Horizonte",
    image: "https://images.unsplash.com/photo-1425421669292-0c3da3b8f529?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbnxlbnwxfHx8fDE3NjEzMzQ0MTd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    initials: "RC"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            O que nossos clientes dizem
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Centenas de condomínios já confiam no Allecto App
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-gray-200 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 space-y-6">
                <Quote className="w-10 h-10 text-primary opacity-50" />
                <p className="text-gray-700 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
