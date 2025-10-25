import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

const faqs = [
  {
    question: "O Allecto App é legalmente válido para assembleias condominiais?",
    answer: "Sim! O Allecto App segue todas as diretrizes da Lei 13.777/2018 e Lei 13.825/2019, que regulamentam assembleias digitais no Brasil. Nosso sistema garante identificação segura, sigilo de voto e registro completo de todas as ações."
  },
  {
    question: "Como funciona a segurança e privacidade dos votos?",
    answer: "Utilizamos criptografia de ponta a ponta e autenticação de múltiplos fatores. Cada voto é anônimo e vinculado à unidade do morador. O sistema gera trilhas de auditoria completas sem comprometer a privacidade individual."
  },
  {
    question: "Que tipo de suporte vocês oferecem?",
    answer: "Oferecemos suporte por e-mail para todos os planos, com tempo de resposta de até 24 horas. Planos Médio e Grande incluem suporte prioritário e, no caso do plano Grande, um gerente de conta dedicado com treinamento personalizado."
  },
  {
    question: "Posso testar o sistema antes de assinar?",
    answer: "Absolutamente! Oferecemos uma demonstração gratuita de 14 dias com todos os recursos incluídos. Nossa equipe também pode agendar uma apresentação ao vivo para mostrar como o Allecto funciona para o seu condomínio."
  }
];

export function FAQ() {
  return (
    <section className="py-24 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl tracking-tight text-gray-900 mb-4">
            Perguntas frequentes
          </h2>
          <p className="text-xl text-gray-600">
            Tire suas dúvidas sobre o Allecto App
          </p>
        </div>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6 hover:border-primary/30 transition-colors"
            >
              <AccordionTrigger className="text-left text-gray-900 hover:text-primary">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
