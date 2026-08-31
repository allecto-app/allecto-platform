import type { Metadata } from "next";
import React, { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Footer } from "../../../../src/components/Footer";
import { Header } from "../../../../src/components/Header";
import { Button } from "../../../../src/components/ui/button";
import { BlogBreadcrumbs, JsonLd } from "../../../../src/blog/BlogUi";
import { BLOG_ORIGIN, DOCUMENT_POLICY_ARTICLE, DOCUMENT_POLICY_JSON_LD } from "../../../../src/blog/content";

const article = DOCUMENT_POLICY_ARTICLE;
const canonical = `${BLOG_ORIGIN}${article.canonicalPath}`;
const breadcrumbs = [{ label: "Início", href: `${BLOG_ORIGIN}/` }, { label: "Gestão de Documentos", href: `${BLOG_ORIGIN}/pt/gestao-de-documentos` }, { label: article.title }];

export const metadata: Metadata = {
  title: article.seoTitle,
  description: article.description,
  alternates: { canonical },
  openGraph: { title: article.seoTitle, description: article.description, url: canonical, siteName: "Blog Allecto", locale: "pt_BR", type: "article", publishedTime: article.publishedAt, modifiedTime: article.modifiedAt, authors: [article.author], images: [{ url: "/images/og/landing-1200x630.png", width: 1200, height: 630, alt: "Documentos, atas e relatórios organizados para a gestão condominial" }] },
  twitter: { card: "summary_large_image", title: article.seoTitle, description: article.description, images: ["/images/og/landing-1200x630.png"] },
};

const rows = [
  ["Constituição e convenção", "Instituição, CNPJ, convenção e alterações", "Síndico/administradora", "Alta", "Arquivo institucional controlado", "Preservação institucional permanente", "Não eliminar sem validação formal"],
  ["Regimento interno", "Versões aprovadas e comunicados", "Síndico", "Média", "Arquivo institucional", "Manter versão vigente e histórico aprovado", "Descarte documentado de duplicatas"],
  ["Assembleias", "Editais, atas, listas, anexos e relatórios", "Síndico/secretaria", "Alta", "Pasta da assembleia", "Preservação institucional; validar exigências", "Eliminar apenas cópias redundantes"],
  ["Contábil e fiscal", "Balancetes, notas, declarações e livros", "Contabilidade", "Alta", "Repositório contábil", "Validar com assessoria jurídica/contábil", "Eliminação segura autorizada"],
  ["Bancário", "Extratos, conciliações e comprovantes", "Financeiro", "Alta", "Repositório financeiro", "Validar com assessoria jurídica/contábil", "Trituração ou exclusão segura"],
  ["Trabalhista e previdenciário", "Folhas, encargos, exames e registros", "RH/contabilidade", "Muito alta", "Área restrita", "Validar com assessoria jurídica/contábil", "Eliminação certificada"],
  ["Contratos e fornecedores", "Contratos, propostas, aditivos e avaliações", "Gestor do contrato", "Média/alta", "Pasta do fornecedor", "Vigência mais responsabilidades posteriores; validar", "Descarte após liberação"],
  ["Obras e manutenção", "Projetos, laudos, ART/RRT, garantias e ordens", "Síndico/engenharia", "Alta", "Arquivo técnico", "Conforme utilidade técnica, garantia e normas; validar", "Preservar itens estruturais"],
  ["Seguros e sinistros", "Apólices, vistorias, avisos e indenizações", "Síndico/corretora", "Alta", "Pasta de seguros", "Vigência e pendências; validar", "Suspender se houver sinistro"],
  ["Moradores e unidades", "Cadastros, contatos e vínculos", "Administração", "Alta", "Cadastro com acesso restrito", "Enquanto necessário à finalidade e obrigações", "Anonimização ou exclusão segura"],
  ["Procurações e votação", "Mandatos, elegibilidade e registros de voto", "Secretaria da assembleia", "Alta", "Pasta da assembleia", "Conforme registro da decisão e disputas; validar", "Descarte controlado após liberação"],
  ["Controle de acesso", "Entradas, credenciais e ocorrências", "Portaria/segurança", "Muito alta", "Sistema restrito", "Prazo operacional proporcional; validar incidentes", "Exclusão segura"],
  ["Solicitações de titulares", "Pedidos, respostas e evidências", "Encarregado/responsável", "Muito alta", "Dossiê restrito", "Conforme atendimento e defesa de direitos; validar", "Eliminação registrada"],
  ["Incidentes de segurança", "Alertas, análise, contenção e comunicações", "Responsável por segurança", "Muito alta", "Dossiê restrito", "Enquanto investigação ou obrigação estiver pendente", "Legal hold e descarte autorizado"],
];

const checklist = {
  "Diagnóstico": ["Mapear arquivos físicos, sistemas, e-mails e drives", "Identificar duplicidades, lacunas e documentos sem responsável"],
  "Inventário": ["Registrar categoria, formato, localização, volume e proprietário", "Distinguir original, cópia de trabalho e duplicata"],
  "Classificação": ["Definir sensibilidade e finalidade", "Relacionar cada categoria a uma regra de retenção"],
  "Responsabilidades": ["Nomear proprietários e aprovadores", "Formalizar a entrega na troca de gestão"],
  "Acesso": ["Aplicar menor privilégio", "Remover acessos de ex-gestores e revisar compartilhamentos"],
  "Migração": ["Planejar lotes, conferência e tratamento de erros", "Preservar contexto, datas e versões relevantes"],
  "Retenção": ["Validar prazos profissionais", "Registrar legal holds e datas de revisão"],
  "Descarte": ["Aprovar, registrar e usar método compatível com a sensibilidade", "Confirmar cópias e integrações antes da eliminação"],
  "Treinamento": ["Orientar equipe e fornecedores", "Simular incidentes e transição administrativa"],
  "Revisão": ["Revisar a política periodicamente", "Atualizar tabela após mudanças legais, contratuais ou operacionais"],
};

export default function DocumentPolicyArticlePage() {
  return <div className="min-h-screen bg-white"><Header /><main><JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs.map((item, position) => ({ "@type": "ListItem", position: position + 1, name: item.label, item: item.href ?? canonical })) }} /><JsonLd data={DOCUMENT_POLICY_JSON_LD} />
    <article className="mx-auto max-w-4xl px-4 py-14 sm:px-6"><BlogBreadcrumbs items={breadcrumbs} /><header className="mt-8 border-b border-gray-200 pb-10"><p className="font-semibold text-primary">Gestão de Documentos</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl">{article.title}</h1><p className="mt-6 text-xl leading-8 text-gray-600">Registros condominiais são ativos operacionais, jurídicos e históricos. Atas demonstram decisões, contratos delimitam obrigações, comprovantes apoiam a prestação de contas e relatórios ajudam a reconstruir fatos. Acumular arquivos indefinidamente, porém, não é uma política de retenção; eliminar sem critérios também cria riscos. Este guia apresenta um caminho para organizar o ciclo documental e um modelo que pode ser copiado e adaptado.</p><div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-500"><span>Por {article.author}</span><time dateTime={article.publishedAt}>Publicado em 20 de abril de 2026</time><span>Atualizado em 30 de agosto de 2026</span><span>{article.readingMinutes} min de leitura</span></div><Image className="mt-8 h-auto w-full rounded-2xl border border-gray-200" src="/images/og/landing-1200x630.png" width={1200} height={630} priority alt="Documentos, atas e relatórios organizados para a gestão condominial" /></header>
    <div className="prose prose-lg max-w-none py-10 text-gray-700 [&_h2]:mt-14 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mt-9 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mt-5 [&_p]:leading-8 [&_li]:mt-2">
      <aside className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-5"><strong>Aviso:</strong> Este material tem caráter informativo e deve ser adaptado à realidade do condomínio, à convenção, aos contratos existentes e à orientação jurídica, contábil e trabalhista aplicável.</aside>
      <h2>O que é uma política de gestão e retenção de documentos?</h2>
      <p>É o conjunto de regras que acompanha o documento durante todo o seu ciclo de vida. A política começa quando uma informação é criada ou recebida, define como ela será classificada e armazenada, determina quem pode acessar ou compartilhar, orienta sua preservação e estabelece quando revisar, arquivar ou eliminar. Ela não é apenas uma lista de prazos: conecta pessoas, processos, sistemas, riscos e evidências.</p>
      <p>Uma política útil diferencia documentos oficiais de cópias de trabalho, explica onde fica a versão válida e registra quem responde por ela. Também trata documentos físicos e digitais de forma coordenada. Digitalizar uma pasta não resolve, por si só, problemas de nomenclatura, permissões, duplicidade ou descarte. O objetivo é permitir que a informação certa seja encontrada por uma pessoa autorizada, no momento necessário, mantendo contexto e confiabilidade.</p>
      <p>O ciclo contempla criação e recebimento, classificação, armazenamento, acesso, compartilhamento, preservação, período de retenção, revisão e descarte seguro. Cada etapa precisa de um responsável. Sem essa definição, arquivos podem permanecer em contas pessoais, fornecedores podem conservar cópias sem necessidade e uma nova gestão pode desconhecer onde estão atas, laudos ou contratos essenciais.</p>

      <h2>Por que o condomínio precisa dessa política?</h2>
      <p>A administração muda, mas as obrigações e a memória do condomínio continuam. Uma política reduz a dependência da caixa de e-mail ou do computador de uma única pessoa e facilita a transição entre síndicos, conselhos e administradoras. Na prestação de contas, ajuda a localizar os documentos que sustentam receitas, despesas e decisões. Em auditorias ou disputas, demonstra quais registros existem, onde estão e quais controles foram aplicados.</p>
      <p>Critérios de retenção também protegem a privacidade. Guardar dados pessoais “para sempre” aumenta o volume exposto a acessos indevidos sem necessariamente trazer benefício. Por outro lado, apagar documentos relevantes durante uma auditoria, reclamação, sinistro ou processo pode prejudicar a defesa do condomínio. A política equilibra necessidade, obrigação, utilidade e risco, sem transformar todo arquivo em permanente.</p>
      <p>Outros ganhos são a redução de duplicidades, pesquisa mais rápida, respostas consistentes aos moradores, responsabilidades claras e preservação da história institucional. O documento aprovado serve ainda como referência para contratos com contadores, escritórios, empresas de portaria, prestadores de tecnologia e administradoras.</p>

      <h2>Quais documentos entram na política?</h2>
      <p>O inventário deve abranger o que está em armários, servidores, aplicativos, sistemas terceirizados, e-mails e dispositivos. A tabela abaixo é um ponto de partida, não uma definição de prazos legais. Sempre relacione a regra às circunstâncias e marque “Validar com assessoria jurídica/contábil” quando houver legislação, contrato, prescrição ou obrigação profissional envolvida.</p>
      <div className="my-8 overflow-x-auto"><table className="min-w-[1100px] border-collapse text-sm"><thead><tr>{["Categoria", "Exemplos", "Responsável", "Sensibilidade", "Local de armazenamento", "Regra de retenção", "Método de descarte"].map((heading) => <th key={heading} className="border bg-gray-100 p-3 text-left">{heading}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="border p-3 align-top">{cell}</td>)}</tr>)}</tbody></table></div>
      <p>Há quatro lógicas diferentes. A preservação institucional permanente atende documentos que definem ou registram a identidade e decisões estruturantes do condomínio. A retenção legal ou contratual depende de normas, contratos e prazos de responsabilidade. A retenção operacional mantém registros enquanto sustentam uma atividade. Finalmente, qualquer descarte deve ser suspenso quando houver disputa, auditoria, investigação, sinistro ou solicitação pendente.</p>

      <h2>Como construir uma tabela de temporalidade</h2>
      <p>A tabela transforma a política em rotina. Para cada categoria, registre: (1) categoria documental; (2) fundamento legal, contratual ou operacional; (3) evento que inicia a contagem, como encerramento do contrato, aprovação das contas ou desligamento; (4) fase ativa, em que há uso frequente; (5) fase de arquivo; (6) destinação final; (7) responsável proprietário; (8) perfil de acesso; (9) condições que suspendem o descarte; e (10) data da próxima revisão.</p>
      <p>Evite prazos sem fonte. O campo de fundamento deve apontar para a avaliação profissional, cláusula, procedimento ou decisão que sustenta a regra. Quando o prazo depender de legislação ou prescrição, registre “Validar com assessoria jurídica/contábil” e mantenha evidência da validação. Mudanças normativas, novos serviços e incidentes podem exigir revisão.</p>
      <h3>Legal hold: quando o descarte deve parar</h3>
      <p>Legal hold é uma suspensão formal da eliminação. Documentos relacionados a litígios, investigações, auditorias, fiscalizações, sinistros de seguro ou solicitações pendentes não devem ser apagados, mesmo que o prazo ordinário tenha terminado. A suspensão deve identificar escopo, responsável, data, motivo, pessoas notificadas e condição de liberação. Ao final, alguém autorizado revisa a destinação; o sistema não deve retomar o descarte automaticamente sem essa decisão.</p>

      <h2>LGPD e documentos condominiais</h2>
      <p>A gestão documental deve observar finalidade, adequação e necessidade: por que o dado existe, se o uso é compatível e qual é o mínimo necessário. Isso influencia formulários, nomes de arquivo, anexos de assembleias e compartilhamentos. O acesso deve ser limitado às funções que precisam da informação, com revisão quando pessoas mudam de papel ou deixam a gestão.</p>
      <p>Consentimento não é a única base legal e não deve ser tratado como resposta automática. A base adequada depende da atividade, da relação envolvida e das obrigações aplicáveis, devendo ser avaliada caso a caso. O condomínio precisa também considerar segurança, prestação de contas, retenção proporcional, eliminação segura e atendimento a solicitações de titulares.</p>
      <p>Compartilhamentos com administradoras, advogados, contadores e fornecedores precisam de finalidade, escopo e responsabilidades claros. Contratos devem tratar devolução ou eliminação ao término, confidencialidade, incidentes e subcontratação quando pertinente. Uma solicitação de acesso ou eliminação não significa que todo documento será entregue ou apagado: direitos de terceiros, deveres de guarda e defesa de direitos precisam ser avaliados profissionalmente.</p>

      <h2>Modelo editável de política</h2>
      <p>Copie o texto abaixo para um documento de trabalho e substitua os campos entre colchetes. Antes da aprovação, faça a revisão jurídica, contábil, trabalhista e operacional adequada.</p>
      <div className="my-8 rounded-2xl border bg-gray-50 p-6 text-base leading-7"><h3>Política de gestão e retenção de documentos — [NOME DO CONDOMÍNIO]</h3>
        <p><strong>1. Objetivo.</strong> Estabelecer critérios para criação, recebimento, classificação, armazenamento, acesso, compartilhamento, preservação, retenção e descarte dos documentos de [NOME DO CONDOMÍNIO], CNPJ [CNPJ].</p>
        <p><strong>2. Escopo.</strong> Aplica-se a gestores, conselho, empregados, administradora e fornecedores que tratem documentos do condomínio, em meio físico ou digital.</p>
        <p><strong>3. Definições.</strong> Documento oficial é a versão reconhecida como evidência; cópia de trabalho apoia atividade temporária; arquivo guarda registros de consulta eventual; legal hold suspende o descarte por pendência.</p>
        <p><strong>4. Classificação.</strong> Os documentos serão classificados por categoria, finalidade e sensibilidade: público, interno, restrito ou altamente restrito.</p>
        <p><strong>5. Papéis.</strong> [RESPONSÁVEL] administra a política. Cada proprietário mantém sua categoria correta; usuários respeitam acessos; fornecedores cumprem contrato e devolvem ou eliminam cópias quando instruídos.</p>
        <p><strong>6. Armazenamento e nomes.</strong> A versão oficial ficará no repositório aprovado. Arquivos seguirão AAAA-MM-DD_Tipo_Assunto_Versao e não exibirão CPF, unidade ou outro dado pessoal desnecessário no nome.</p>
        <p><strong>7. Acesso.</strong> Permissões seguirão menor privilégio e serão revisadas na mudança de função, desligamento ou troca de gestão.</p>
        <p><strong>8. Compartilhamento.</strong> O envio externo dependerá de finalidade, destinatário autorizado, canal adequado e registro quando necessário.</p>
        <p><strong>9. Versões.</strong> Alterações relevantes serão identificadas. Minutas não substituirão silenciosamente versões aprovadas.</p>
        <p><strong>10. Backup e recuperação.</strong> Cópias de segurança seguirão procedimento definido, com responsabilidades e testes de recuperação. Backup não será usado como arquivo permanente sem controle.</p>
        <p><strong>11. Retenção.</strong> A tabela de temporalidade indicará evento inicial, fases e destino. Prazos sujeitos a norma ou prescrição serão validados profissionalmente.</p>
        <p><strong>12. Legal hold.</strong> Litígios, investigações, auditorias, sinistros e solicitações pendentes suspendem eliminações relacionadas até liberação formal.</p>
        <p><strong>13. Descarte seguro.</strong> [RESPONSÁVEL] aprovará a destinação, verificará suspensões e registrará categoria, período, método, data e executor.</p>
        <p><strong>14. Incidentes.</strong> Perda, acesso indevido ou envio incorreto será comunicado pelo [CANAL PARA SOLICITAÇÕES], preservando evidências e acionando o procedimento de resposta.</p>
        <p><strong>15. Revisão.</strong> Esta política será revisada a cada [PERIODICIDADE DA REVISÃO] e após mudanças relevantes.</p>
        <p><strong>16. Aprovação.</strong> Aprovada pela instância competente em [DATA DE APROVAÇÃO], com vigência a partir de [DATA].</p>
      </div>

      <h2>Modelo de nomenclatura e organização</h2>
      <p>Uma estrutura simples reduz decisões improvisadas: <code>/Ano/Categoria/Tipo de documento</code>. Dentro dela, adote <code>AAAA-MM-DD_Tipo_Assunto_Versao</code>. Por exemplo, <code>2026-04-20_Ata_AssembleiaOrdinaria_VFinal.pdf</code>. Use vocabulário estável, evite “novo”, “final-final” e abreviações compreendidas por uma só pessoa.</p>
      <p>O nome deve ajudar a localizar sem revelar dados. Não coloque CPF, telefone, apartamento ou condição financeira quando esses elementos não forem indispensáveis. Informações sensíveis devem permanecer no conteúdo protegido e nos metadados controlados, não expostas em nomes que aparecem em buscas, notificações ou links.</p>

      <h2>Checklist de implementação</h2>
      {Object.entries(checklist).map(([group, items]) => <section key={group}><h3>{group}</h3><ul className="list-none pl-0">{items.map((item) => <li key={item} className="flex gap-3"><span aria-hidden="true">☐</span><span>{item}</span></li>)}</ul></section>)}

      <h2>Erros mais comuns</h2>
      <ul className="list-disc pl-6"><li>Guardar tudo permanentemente, sem finalidade ou revisão.</li><li>Eliminar documentos sem critério aprovado ou evidência.</li><li>Usar drives e e-mails pessoais como arquivo oficial.</li><li>Compartilhar senhas em vez de conceder acessos individuais.</li><li>Enviar documentos sensíveis em grupos sem controle de destinatários.</li><li>Manter ex-gestores e antigos fornecedores com acesso.</li><li>Ter backups sem validar se a recuperação funciona.</li><li>Substituir arquivos sem controle de versão.</li><li>Descartar sem registrar autorização, escopo e método.</li><li>Tratar a tabela de temporalidade como imutável.</li><li>Ignorar legal holds durante processos, auditorias ou sinistros.</li></ul>
      <p>Outro erro é comprar tecnologia antes de decidir responsabilidades. Uma ferramenta pode facilitar o controle, mas não define sozinha o que é oficial, quem aprova um descarte ou qual prazo é aplicável. Processo e tecnologia precisam evoluir juntos.</p>

      <h2>Como a tecnologia pode apoiar a gestão documental</h2>
      <p>Soluções digitais podem centralizar arquivos, organizar categorias, facilitar pesquisa, aplicar permissões e reduzir compartilhamentos dispersos. Histórico de versões e registros de acesso, quando disponíveis e corretamente configurados, ajudam a investigar alterações. Fluxos controlados permitem que a pessoa receba apenas o documento necessário, em vez de acesso amplo a pastas.</p>
      <p>No contexto das assembleias, a associação entre pauta, documento, votação, relatório e ata preserva o encadeamento da decisão. A Allecto permite anexar documentos às assembleias, restringir a visualização por escopo e perfil e manter atas e relatórios relacionados ao condomínio. Esses recursos apoiam a organização; a definição de retenção, base legal e descarte continua sendo responsabilidade do condomínio com sua assessoria.</p>
      <aside className="my-10 rounded-2xl bg-primary p-8 text-white"><h2 className="!mt-0 !text-white">Organize os documentos e registros das suas assembleias com a Allecto</h2><p>Reúna pautas, anexos, votação, relatórios e atas em um fluxo pensado para condomínios e administradoras.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="bg-white text-primary hover:bg-white/90"><Link href="https://www.allecto.app/#recursos">Conhecer a Allecto</Link></Button><Button asChild variant="outline" className="border-white bg-transparent text-white hover:bg-white/10"><Link href="https://www.allecto.app/#precos">Ver planos</Link></Button></div></aside>

      <h2>Perguntas frequentes</h2>
      <Faq q="Por quanto tempo o condomínio deve guardar documentos?">Depende da categoria, do evento relacionado, de normas, contratos, prazos de responsabilidade e pendências. Construa uma tabela e valide os prazos com assessoria jurídica, contábil e trabalhista.</Faq>
      <Faq q="A ata da assembleia deve ser guardada permanentemente?">Atas compõem a memória das decisões e normalmente merecem preservação institucional. A forma, o original aplicável e exigências específicas devem ser validados profissionalmente.</Faq>
      <Faq q="O condomínio pode digitalizar e eliminar o papel?">Digitalizar não autoriza automaticamente eliminar o original. Autenticidade, forma legal, valor probatório, convenção e obrigações da categoria precisam ser avaliados antes do descarte.</Faq>
      <Faq q="Quem pode acessar os documentos do condomínio?">O acesso deve considerar função, finalidade, convenção, direitos dos condôminos, privacidade de terceiros e sensibilidade. Nem todo documento deve estar disponível integralmente a todos.</Faq>
      <Faq q="Como a LGPD afeta a gestão documental?">Ela reforça finalidade, necessidade, segurança, transparência, retenção proporcional e atendimento de direitos. A base legal deve ser analisada por atividade; consentimento não é sempre necessário nem sempre adequado.</Faq>
      <Faq q="O que é uma tabela de temporalidade?">É o instrumento que registra categorias, fundamento, evento inicial, fases, responsáveis, acessos, suspensão e destino final dos documentos.</Faq>
      <Faq q="Como eliminar documentos com segurança?">Confirme o prazo, verifique legal holds, obtenha autorização, use método compatível com o suporte e a sensibilidade e registre o descarte. Cópias físicas, digitais e terceirizadas devem entrar na verificação.</Faq>
      <Faq q="O síndico pode usar seu Google Drive pessoal?">Um drive pessoal aumenta dependência, dificulta transição e pode misturar dados. Prefira conta institucional, acessos individuais, regras de entrega e repositório aprovado pelo condomínio.</Faq>
      <Faq q="O que fazer quando muda o síndico ou a administradora?">Execute inventário de entrega, transfira contas institucionais, revogue acessos antigos, valide documentos e pendências e registre responsabilidades. Não dependa apenas de uma cópia de arquivos.</Faq>
      <Faq q="Qual é a diferença entre backup e arquivo?">Backup recupera dados após falha e costuma manter cópias técnicas rotativas. Arquivo preserva documentos selecionados com contexto, classificação, acesso e prazo. Um não substitui o outro.</Faq>
      <Faq q="Documentos relacionados a processos podem ser eliminados?">Não enquanto estiverem sujeitos a legal hold. Preserve o conjunto relacionado até liberação formal baseada na situação concreta e na orientação profissional.</Faq>
      <Faq q="A política precisa ser aprovada em assembleia?">A instância de aprovação depende da convenção, do conteúdo, das competências do síndico e do impacto das regras. Registre a decisão e valide a forma adequada com assessoria jurídica.</Faq>
      <p className="mt-12">Continue pela categoria <Link href={`${BLOG_ORIGIN}/pt/gestao-de-documentos`}>Gestão de Documentos</Link>, consulte conteúdos de <Link href={`${BLOG_ORIGIN}/pt/governanca-condominial`}>Governança Condominial</Link> e <Link href={`${BLOG_ORIGIN}/pt/seguranca-e-criptografia`}>Segurança e proteção de dados</Link>, ou leia a <Link href="https://www.allecto.app/politica-de-privacidade">Política de Privacidade da Allecto</Link>.</p>
    </div></article>
  </main><Footer /></div>;
}

function Faq({ q, children }: { q: string; children: ReactNode }) { return <section><h3>{q}</h3><p>{children}</p></section>; }
