import { Metadata } from "next";
import { Footer } from "../../src/components/Footer";
import { Header } from "../../src/components/Header";

export const metadata: Metadata = {
  title: "Política de Privacidade — Allecto App",
  description:
    "Entenda como o Allecto App coleta, usa e protege seus dados. Transparência, segurança e conformidade com a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
  openGraph: {
    title: "Política de Privacidade — Allecto App",
    description:
      "Transparência sobre coleta, uso e proteção de dados. Conformidade com a LGPD.",
    url: "https://www.allecto.app/politica-de-privacidade",
    siteName: "Allecto App",
    images: [
      {
        url: "/images/og/landing-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Política de Privacidade — Allecto App",
      },
    ],
    locale: "pt_BR",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Política de Privacidade — Allecto App",
    description:
      "Como coletamos, usamos e protegemos seus dados no Allecto App (LGPD).",
    images: ["/images/og/landing-1200x630.png"],
  },
};

const PoliticaDePrivacidade = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-primary via-accent to-primary font-inter py-10">
        <div className="bg-white mt-10 max-w-4xl mx-auto rounded-xl p-12">
          <h1 className="font-bold text-4xl mb-8">
            Política de Privacidade — Allecto
          </h1>
          <p className="mb-4">
            Esta Política de Privacidade descreve como o{" "}
            <strong>Allecto App</strong>
            ("Allecto", "nós") coleta, usa, compartilha e protege dados pessoais
            quando você visita nossos sites e utiliza o{" "}
            <strong>Allecto App</strong>
            (web/app)
          </p>

          <p className="mb-4">
            <strong>Controlador:</strong> Allecto App
            <br />
            <strong>E‑mail para privacidade:</strong>{" "}
            <a href="mailto:supporte@allecto.app">supporte@allecto.app</a>
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">1. Escopo</h2>

          <p className="mb-4">
            Aplica‑se aos sites sob o domínio <strong>allecto.app</strong>{" "}
            (landing pages e materiais) e aos nossos canais de
            atendimento/suporte.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            2. Dados Pessoais Tratados
          </h2>

          <p className="mb-4">
            <strong>- Conta/Organização:</strong> nome, e‑mail, telefone,
            cargo/função, dados do condomínio/empresa, identificadores de
            autenticação, plano/assinatura e métricas de uso. <br />
            <strong>- Cobrança e Pagamentos:</strong> nome do pagador, e‑mail,
            CNPJ/CPF, endereço; dados parciais do cartão e transações
            processados por terceiros (não armazenamos o número completo do
            cartão). <br />
            <strong>- Uso do Produto:</strong> eventos de uso,
            páginas/funcionalidades acessadas, dispositivo/navegador, sistema
            operacional, local aproximado (com base em IP), logs e erros. <br />
            <strong>- Suporte:</strong> mensagens, anexos/arquivos e histórico
            de interação. <br />
            <strong>- Cookies/SDKs:</strong> conforme Aviso de Cookies abaixo.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            3. Origem dos Dados
          </h2>

          <p className="mb-4">
            Coletamos dados diretamente do usuário, do administrador da sua
            organização/condomínio, de forma automática via cookies/SDKs e,
            quando permitido, de terceiros (ex.: provedores de pagamento,
            analytics e hospedagem) para operar o serviço.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            4. Finalidades e Bases Legais (LGPD)
          </h2>

          <p className="mb-4">
            Prestação do serviço e suporte (execução de contrato).
            <br />
            Cobrança, faturamento, prevenção a fraudes e cumprimento de
            obrigações legais (obrigação legal e/ou interesse legítimo).
            <br />
            Segurança, auditoria e integridade do serviço (interesse legítimo
            proporcional).
            <br />
            Medição/Analytics e melhoria contínua (consentimento quando exigido;
            caso contrário, interesse legítimo).
            <br />
            Comunicações de marketing (consentimento; revogável a qualquer
            momento).
            <br />
            Atendimento a requisições legais/autoridades (cumprimento de
            obrigação legal).
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            5. Compartilhamento e Operadores
          </h2>

          <p className="mb-4">
            Podemos compartilhar dados com <strong>operadores</strong>{" "}
            (fornecedores de nuvem, autenticação, pagamentos,
            e‑mail/transacional, analytics, monitoramento, suporte). Exigimos
            contratos e medidas de segurança adequadas.{" "}
            <strong>Não vendemos dados pessoais.</strong>
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            6. Transferências Internacionais
          </h2>

          <p className="mb-4">
            Quando houver transferência internacional, adotamos mecanismos
            adequados (p. ex., <strong>Cláusulas Contratuais Padrão</strong> e
            salvaguardas complementares) de acordo com a LGPD e orientações da
            ANPD.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            7. Retenção e Eliminação
          </h2>

          <p className="mb-4">
            Mantemos dados enquanto a conta estiver ativa e conforme necessário
            para as finalidades declaradas. Após o término da relação,
            eliminamos ou anonimizamos dentro de prazos razoáveis, salvo quando
            a guarda por período adicional for exigida por lei (ex.:
            fiscal/tributária) ou para exercício/defesa de direitos.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            8. Direitos do Titular
          </h2>

          <p className="mb-4">
            Nos termos da LGPD, você pode solicitar: <br />
            - confirmação de tratamento e acesso
            <br /> - correção
            <br /> - anonimização/eliminação
            <br />
            - portabilidade
            <br /> - informações sobre compartilhamento
            <br />- oposição ao tratamento quando cabível
            <br />
            - revisão de decisões automatizadas
            <br />- revogação do consentimento. <br />
            <br />
            Para exercer, contate{" "}
            <a href="mailto:supporte@allecto.app">supporte@allecto.app</a> Você
            também pode reclamar à <strong>ANPD</strong>.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            9. Crianças e Adolescentes
          </h2>

          <p className="mb-4">
            Nossos serviços não se destinam a menores. Se identificarmos
            tratamento indevido de dados de menores, adotaremos medidas para
            cessar o tratamento e eliminar os dados, conforme aplicável.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            10. Segurança da Informação
          </h2>

          <p className="mb-4">
            Adotamos medidas técnicas e organizacionais adequadas, como
            criptografia em trânsito, controles de acesso, registro e
            monitoramento, segregação de ambientes, gestão de vulnerabilidades e
            due diligence de fornecedores. Nenhum sistema é 100% seguro;
            recomendamos senhas fortes e autenticação multifator quando
            disponível.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            11. Decisões Automatizadas
          </h2>

          <p className="mb-4">
            Podemos utilizar recursos automatizados (ex.: detecção de
            fraude/abuso ou scoring técnico de risco). Você pode solicitar
            informações sobre critérios utilizados e revisão humana, quando
            aplicável.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">12. Comunicações</h2>

          <p className="mb-4">
            Mensagens transacionais relacionadas ao serviço são enviadas com
            base contratual. Conteúdos de marketing dependem de consentimento e
            incluem opção de descadastro.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">
            13. Atualizações desta Política
          </h2>

          <p className="mb-4">
            Podemos atualizar esta Política periodicamente. Alterações
            relevantes serão comunicadas (ex.: aviso no site/app ou e‑mail). O
            uso contínuo após a vigência indica ciência da versão atualizada.
          </p>

          <h2 className="font-semibold text-xl mb-2 mt-6">14. Contato</h2>

          <p className="mb-4">
            Dúvidas, solicitações ou reclamações:{" "}
            <a href="mailto:supporte@allecto.app">supporte@allecto.app</a>
          </p>

          <h2>Aviso de Cookies e Consentimento</h2>

          <h2>O que são cookies/SDKs?</h2>

          <p>
            Cookies são arquivos gravados no dispositivo; SDKs têm função
            similar em apps. Usamos:
          </p>

          <p>
            <strong>- Estritamente necessários:</strong> autenticação, sessão,
            segurança, balanceamento de carga.
            <br />
            <strong>- Funcionais:</strong> preferências (ex.: idioma, condomínio
            selecionado).
            <br />
            <strong>- Analytics:</strong> mensuração de tráfego/uso e melhoria
            do produto (ex.: Google Analytics 4). Somente após consentimento
            quando exigido.
            <br />
            <strong>- Marketing:</strong> campanhas/remarketing; desativados por
            padrão até consentimento.
          </p>

          <h2>Google Analytics 4 e Consent Mode</h2>

          <p>
            Podemos utilizar GA4 no site e no Admin. Quando necessário,
            executamos GA4 somente após o consentimento e com{" "}
            <strong>Consent Mode</strong> para respeitar as escolhas. O GA4 não
            armazena endereços IP e oferece controles regionais de privacidade.
          </p>

          <h2>Gerenciamento de Preferências</h2>

          <p>
            Você pode <strong>aceitar</strong>, <strong>rejeitar</strong> ou{" "}
            <strong>personalizar</strong> categorias no Gerenciador de Cookies
            (link no rodapé/menu). As escolhas são salvas por
            navegador/dispositivo. Também é possível controlar cookies nas
            configurações do navegador.
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PoliticaDePrivacidade;
