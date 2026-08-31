import { Billing } from "@allecto-app/contracts";

export const FAQ_CATEGORY_ORDER = [
  "sobre",
  "assembleias",
  "participantes",
  "documentos",
  "planos",
  "seguranca",
  "administradoras",
  "suporte",
] as const;

export type FaqCategoryId = (typeof FAQ_CATEGORY_ORDER)[number];

export interface FaqItem {
  id: string;
  category: FaqCategoryId;
  question: string;
  answer: string;
  link?: {
    label: string;
    href: string;
  };
}

export interface FaqCategory {
  id: FaqCategoryId;
  label: string;
}

export const FAQ_CATEGORIES: readonly FaqCategory[] = [
  { id: "sobre", label: "Sobre a Allecto" },
  { id: "assembleias", label: "Assembleias e votações" },
  { id: "participantes", label: "Participantes e acesso" },
  { id: "documentos", label: "Documentos e relatórios" },
  { id: "planos", label: "Planos e contratação" },
  { id: "seguranca", label: "Segurança e privacidade" },
  { id: "administradoras", label: "Administradoras" },
  { id: "suporte", label: "Suporte e operação" },
];

const offer = (key: Billing.CommercialOfferKey) => {
  const match = Billing.COMMERCIAL_OFFERS.find((item) => item.key === key);
  if (!match) throw new Error(`Oferta comercial não encontrada: ${key}`);
  return match;
};

const avulso = offer("avulso");
const essencial = offer("essencial");
const gestao = offer("gestao");
const administradora = offer("administradora");

const formatLimit = (value: number | null, label: string) => {
  if (value === null) throw new Error(`Limite não configurado: ${label}`);
  return value.toLocaleString("pt-BR");
};

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: "o-que-e-allecto",
    category: "sobre",
    question: "O que é a Allecto e para quem ela foi desenvolvida?",
    answer:
      "A Allecto é uma plataforma web para organizar assembleias condominiais. Ela atende síndicos moradores e profissionais, administradoras, conselheiros e moradores convidados. O fluxo reúne cadastro de condomínios, unidades e residentes, publicação da assembleia, comunicação por e-mail, votação por unidade, acompanhamento da participação, documentos e relatório final.",
  },
  {
    id: "alem-da-votacao",
    category: "sobre",
    question: "A Allecto serve apenas para votação online?",
    answer:
      "Não. Além de registrar votos, a plataforma ajuda a cadastrar unidades e moradores, publicar a assembleia, enviar convocações e lembretes, disponibilizar documentos, acompanhar participação e registrar o encerramento. Ao final, o sistema preserva os dados da votação e gera um relatório em PDF para apoiar os registros do condomínio.",
  },
  {
    id: "como-funciona-assembleia",
    category: "assembleias",
    question: "Como funciona uma assembleia pela Allecto?",
    answer:
      "A administração cadastra o condomínio, as unidades e os moradores, prepara a assembleia com título, resumo, período de votação e documento, e então a publica. Os participantes cadastrados recebem a comunicação, acessam o portal e votam enquanto ela estiver aberta. O sistema impede um segundo voto da mesma unidade e, no encerramento, consolida participação e resultado.",
  },
  {
    id: "voto-e-resultado",
    category: "assembleias",
    question: "Como são registrados os votos e os resultados?",
    answer:
      "A implementação atual registra um voto identificado de concordância ou discordância por unidade. A verificação acontece no servidor: a assembleia precisa estar aberta, participante e unidade devem pertencer ao condomínio, e somente um vínculo de proprietário pode votar. O resultado soma os votos por unidade; a convenção e a administração continuam responsáveis por interpretar o quórum legal aplicável.",
  },
  {
    id: "validade-juridica",
    category: "assembleias",
    question: "Uma assembleia online possui validade jurídica?",
    answer:
      "A Allecto oferece recursos para organizar participação, votação, comunicações, documentos e registros, mas não garante por si só a validade jurídica de uma assembleia. Ela também depende da convenção do condomínio, da convocação e pauta, dos direitos dos participantes, do quórum aplicável, da forma de condução, da legislação vigente e das circunstâncias de cada condomínio. Em caso de dúvida, busque orientação jurídica.",
    link: {
      label: "Leia o guia sobre assembleias online",
      href: "https://blog.allecto.app/pt/governanca-condominial/assembleia-condominial-online-e-valida",
    },
  },
  {
    id: "acesso-sem-aplicativo",
    category: "participantes",
    question: "O morador precisa instalar um aplicativo ou criar uma senha?",
    answer:
      "Não é necessário instalar um aplicativo. O participante usa o navegador do celular, tablet ou computador. Para entrar no portal, informa o e-mail associado ao seu cadastro, seleciona o condomínio quando houver mais de um vínculo e recebe por e-mail um código temporário de acesso. Por isso, a administração precisa manter o cadastro do morador e da unidade atualizados.",
  },
  {
    id: "convites-e-lembretes",
    category: "participantes",
    question: "Como os moradores recebem convites e lembretes?",
    answer:
      "Quando a assembleia é publicada, a plataforma agenda a convocação por e-mail para os moradores cadastrados. Também existem lembretes automáticos D-4 e D-2 durante o período aberto, direcionados às unidades que ainda não registraram voto. Os envios e eventuais falhas ficam disponíveis nos registros de notificações para acompanhamento da administração.",
  },
  {
    id: "documentos-e-acesso",
    category: "documentos",
    question: "É possível disponibilizar documentos aos participantes?",
    answer:
      "Sim. A administração pode associar um documento à assembleia e o armazenamento registra informações como tipo, tamanho e integridade do arquivo. O acesso é verificado por condomínio, assembleia, função e usuário conforme a visibilidade configurada. Visualizações, downloads e emissão de links de acesso também podem gerar eventos de histórico.",
  },
  {
    id: "relatorio-final",
    category: "documentos",
    question: "O que é gerado depois do encerramento?",
    answer:
      "No encerramento, a plataforma cria um retrato dos dados da assembleia e pode gerar um relatório final em PDF com informações de participação e votação. Esse material apoia a prestação de contas e a preparação dos registros do condomínio. Ele não substitui a revisão da administração nem transforma automaticamente o documento em uma ata juridicamente válida.",
  },
  {
    id: "assembleia-avulsa",
    category: "planos",
    question: "Posso realizar somente uma assembleia, sem assinatura?",
    answer: `Sim. O plano ${avulso.name} custa ${avulso.priceLabel}, sem assinatura, e cobre uma assembleia de até ${avulso.limits.assemblyDurationDays} dias para um condomínio com até ${avulso.limits.units} unidades. A contratação é um pagamento único. Para uma operação recorrente, os planos mensais oferecem mais assembleias anuais e limites maiores.`,
    link: { label: "Comparar os planos", href: "/#precos" },
  },
  {
    id: "diferenca-planos",
    category: "planos",
    question: "Qual é a diferença entre os planos da Allecto?",
    answer: `O ${essencial.name} (${essencial.priceLabel}) atende um condomínio com até ${essencial.limits.units} unidades e ${essencial.limits.assembliesPerYear} assembleias por ano. O ${gestao.name} (${gestao.priceLabel}) amplia esses limites para ${gestao.limits.units} unidades e ${gestao.limits.assembliesPerYear} assembleias. O ${administradora.name} (${administradora.priceLabel}) atende até ${administradora.limits.condominiums} condomínios, ${formatLimit(administradora.limits.units, "unidades do Administradora")} unidades e ${administradora.limits.assembliesPerYear} assembleias por ano. O Enterprise é definido com a equipe comercial.`,
    link: { label: "Ver preços e limites", href: "/#precos" },
  },
  {
    id: "seguranca-e-privacidade",
    category: "seguranca",
    question: "Como a Allecto protege o acesso e os dados?",
    answer:
      "A aplicação usa sessões com tokens protegidos, códigos temporários para o acesso de moradores, limites de tentativas e verificações de condomínio, unidade e função no servidor. Documentos possuem regras próprias de visibilidade e histórico de eventos. Como todo tratamento de dados condominiais, a configuração de acessos e a atualização dos cadastros também exigem cuidado da administração.",
    link: {
      label: "Conheça a Política de Privacidade",
      href: "/politica-de-privacidade",
    },
  },
  {
    id: "multiplos-condominios",
    category: "administradoras",
    question: "A Allecto atende administradoras e múltiplos condomínios?",
    answer: `Sim. Os dados são separados por condomínio e a área administrativa permite alternar entre os condomínios aos quais a equipe tem acesso. O plano ${administradora.name} prevê uma operação de até ${administradora.limits.condominiums} condomínios e ${formatLimit(administradora.limits.units, "unidades do Administradora")} unidades, com usuários e permissões por equipe. Necessidades acima desses limites devem ser avaliadas no Enterprise.`,
    link: { label: "Conhecer o plano Administradora", href: "/#precos" },
  },
  {
    id: "canais-de-suporte",
    category: "suporte",
    question: "Que tipo de suporte está incluído?",
    answer:
      "O Avulso inclui suporte por e-mail. O Essencial tem meta de resposta de até um dia útil, enquanto Gestão e Administradora incluem suporte prioritário. Para operações que precisam de SLA dedicado, gerente de conta ou acompanhamento durante assembleias, a opção Enterprise é definida com a equipe comercial conforme o projeto.",
    link: { label: "Falar com a equipe", href: "/#contato" },
  },
];

const HOME_FAQ_IDS = [
  "o-que-e-allecto",
  "assembleia-avulsa",
  "acesso-sem-aplicativo",
] as const;

export const HOME_FAQ_ITEMS: readonly FaqItem[] = HOME_FAQ_IDS.map((id) => {
  const item = FAQ_ITEMS.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`FAQ da página inicial não encontrada: ${id}`);
  return item;
});

export function buildFaqJsonLd(items: readonly FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
