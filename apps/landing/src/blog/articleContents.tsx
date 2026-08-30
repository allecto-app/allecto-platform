import React from "react";
import Link from "next/link";
import type { ArticleContent } from "./ArticlePage";

const CIVIL_CODE = "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm";
const LAW_14309 = "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14309.htm";
const LGPD = "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm";
const ANPD_AGENTS = "https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado";
const ANPD_SECURITY = "https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-publica-guia-de-seguranca-para-agentes-de-tratamento-de-pequeno-porte";
const ANPD_INCIDENTS = "https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-aprova-o-regulamento-de-comunicacao-de-incidente-de-seguranca";

function Checklist({ items }: { items: string[] }) { return <ul className="my-6 list-none space-y-2 pl-0">{items.map((item) => <li key={item} className="rounded-lg border bg-gray-50 px-4 py-3">☐ {item}</li>)}</ul>; }
function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) { return <div className="my-8 overflow-x-auto"><table className="min-w-[720px] border-collapse text-sm"><thead><tr>{headers.map((heading) => <th key={heading} className="border bg-gray-100 p-3 text-left">{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="border p-3 align-top">{cell}</td>)}</tr>)}</tbody></table></div>; }

const legalSources = [
  { label: "Código Civil — Lei nº 10.406/2002, texto compilado", href: CIVIL_CODE },
  { label: "Lei nº 14.309/2022 — assembleias eletrônicas e sessão permanente", href: LAW_14309 },
];

export const onlineAssemblyContent: ArticleContent = {
  directAnswer: "Sim, uma assembleia condominial pode ser realizada eletronicamente, mas o formato não torna qualquer reunião automaticamente válida. É preciso observar a lei, a convenção, a convocação de todos os condôminos, os quóruns da matéria e preservar acesso, voz, debate e voto.",
  sections: [
    ["legislacao", "O que a legislação permite"], ["artigo-1354-a", "Requisitos do artigo 1.354-A"], ["convencao", "O papel da convenção"], ["edital", "O que deve constar no edital"], ["identificacao", "Identificação dos participantes"], ["voz-voto", "Direito de voz, debate e voto"], ["quorum", "Quórum e peso dos votos"], ["ata", "Ata e registros eletrônicos"], ["erros", "Erros que geram questionamentos"], ["checklist", "Checklist"], ["faq", "Perguntas frequentes"],
  ].map(([id, label]) => ({ id, label })),
  sources: legalSources,
  related: ["/pt/governanca-condominial/assembleia-hibrida-condominio", "/pt/governanca-condominial/quorum-assembleia-condominio", "/pt/governanca-condominial/votacao-por-fracao-ideal-condominio"],
  ctaLabel: "Realizar uma assembleia por R$ 249",
  body: <>
    <p>Assembleia online válida não é sinônimo de simplesmente abrir uma chamada de vídeo. A validade é sustentada por um processo: convocação regular, informação antecipada sobre como participar, identificação compatível com o risco, exercício efetivo dos direitos políticos do condômino, apuração conforme a regra aplicável e registros capazes de explicar o que ocorreu. Se uma dessas partes falha, a deliberação pode ser questionada mesmo quando a tecnologia funcionou.</p>
    <p>Antes de escolher a ferramenta, leia a convenção e o regimento, classifique cada item da pauta e defina quem poderá votar e com qual peso. Essa preparação conecta este guia aos conteúdos sobre <Link href="/pt/governanca-condominial/quorum-assembleia-condominio">quórum</Link> e <Link href="/pt/governanca-condominial/votacao-por-fracao-ideal-condominio">fração ideal</Link>.</p>

    <h2 id="legislacao">O que a legislação permite</h2>
    <p>A Lei nº 14.309/2022 inseriu no Código Civil regras expressas para convocação, realização e deliberação eletrônicas em condomínios edilícios. O artigo 1.354-A admite o meio eletrônico desde que a convenção não o proíba e sejam preservados os direitos de voz, debate e voto. A norma não dispensa as demais exigências: todos os condôminos devem ser convocados, a pauta precisa ser respeitada e cada deliberação continua sujeita ao quórum legal ou convencional correspondente.</p>
    <p>A lei também permite que normas complementares sobre assembleias eletrônicas sejam previstas no regimento interno, mediante o procedimento indicado no próprio artigo. Isso ajuda a disciplinar credenciamento, pedidos de fala, suporte, contingência e guarda de registros. O regulamento interno, porém, não deve reduzir direitos assegurados por lei ou pela convenção.</p>
    <p>Portanto, o formato digital é um meio de realização. Ele não corrige edital defeituoso, não transforma participante inelegível em eleitor e não altera o quórum da obra, da convenção ou da destituição do síndico. Uma análise jurídica é recomendável quando a pauta é sensível, a convenção é antiga ou existe histórico de disputa.</p>

    <h2 id="artigo-1354-a">Requisitos do artigo 1.354-A do Código Civil</h2>
    <p>O primeiro requisito é negativo: a convenção não pode vedar a modalidade. Silêncio e proibição expressa não são a mesma coisa; ainda assim, o texto completo deve ser interpretado no contexto do condomínio. O segundo requisito é material: voz, debate e voto precisam ser preservados. Não basta permitir o login se a pessoa não consegue acompanhar a pauta, pedir esclarecimento ou votar no momento previsto.</p>
    <p>O instrumento de convocação deve informar que a assembleia ocorrerá eletronicamente e trazer instruções de acesso, manifestação e coleta de votos. A assembleia deve ser considerada encerrada apenas depois de anunciada a conclusão e lavrada a ata, ressalvada a hipótese de sessão permanente organizada conforme a lei. Documentos da ordem do dia podem ser disponibilizados física ou eletronicamente.</p>
    <DataTable headers={["Elemento", "Pergunta de controle", "Evidência útil"]} rows={[
      ["Convenção", "Existe proibição ou regra específica?", "Versão vigente e parecer quando necessário"],
      ["Convocação", "Todos receberam prazo, pauta e instruções?", "Lista de destinatários e comprovantes de envio"],
      ["Participação", "Há canal funcional para acesso e suporte?", "Instruções e registro de ocorrências"],
      ["Direitos", "É possível ouvir, falar, debater e votar?", "Roteiro da presidência e registros da reunião"],
      ["Apuração", "Base, elegibilidade e peso estão definidos?", "Cadastro, memória de cálculo e relatório"],
    ]} />

    <h2 id="convencao">O papel da convenção do condomínio</h2>
    <p>A convenção organiza direitos, deveres, forma de convocação e regras de votação. Ela pode definir peso diverso do padrão legal, exigir formalidades para procurações e estabelecer canais de comunicação. Por isso, usar um modelo genérico de edital sem confrontá-lo com a convenção é uma das principais fontes de risco.</p>
    <p>Faça uma leitura orientada: localize as cláusulas sobre convocação, primeira e segunda chamadas, representação, inadimplência, presidência, secretaria, voto secreto, quóruns especiais e alteração do próprio documento. Registre a regra escolhida para cada pauta. Se houver contradição aparente com lei posterior, não improvise durante a reunião; obtenha orientação profissional antes.</p>
    <p>O regimento pode detalhar a operação digital, como antecedência para cadastro, teste técnico, fila de fala, tempo de manifestação e plano de contingência. Essas regras devem ser comunicadas com clareza e aplicadas de modo uniforme.</p>

    <h2 id="edital">O que deve constar no edital</h2>
    <p>Além dos elementos exigidos pela convenção, o edital eletrônico deve dizer data, horários das convocações, pauta objetiva, plataforma ou canal, requisitos de acesso, forma de identificação, como enviar procuração, como pedir a palavra, como votar e onde buscar suporte. Informe também o tratamento de interrupções e, quando aplicável, a possibilidade de continuidade em sessão permanente.</p>
    <p>A pauta merece precisão. Expressões amplas como “assuntos gerais” normalmente não são um bom fundamento para deliberações com efeitos financeiros ou jurídicos relevantes. Anexe orçamentos, propostas, laudos e versões de textos com antecedência razoável, preservando dados pessoais desnecessários.</p>
    <p>Exemplo operacional: “A votação do item 3 será aberta após os debates e permanecerá disponível por dez minutos; cada representante visualizará apenas as unidades para as quais estiver credenciado; dúvidas de acesso serão recebidas no canal indicado”. O edital não precisa antecipar todas as falas, mas deve tornar o procedimento previsível.</p>

    <h2 id="identificacao">Identificação dos participantes</h2>
    <p>A identificação deve equilibrar confiabilidade e minimização de dados. Cadastre unidade, titularidade ou vínculo, contato e eventual representação antes da reunião. Evite usar informações públicas ou facilmente compartilháveis como único fator de identificação. Para procurações, confira forma, poderes, data, outorgante, outorgado e exigências convencionais.</p>
    <p>Crie estados distintos: convidado, presente, presente sem direito a voto, representante e equipe de apoio. A lista de presença deve mostrar o momento relevante de entrada e saída, especialmente quando o quórum varia por item. Moradores, locatários, coproprietários e procuradores não devem ser tratados como categorias equivalentes sem analisar título e poderes.</p>
    <h3>Privacidade na identificação</h3>
    <p>Não exponha CPF, telefone, e-mail ou documentos de identidade na tela compartilhada. A equipe responsável pode realizar a conferência em ambiente restrito e exibir aos participantes apenas o necessário para transparência da representação. Defina retenção e acesso aos comprovantes.</p>

    <h2 id="voz-voto">Direito de voz, debate e voto</h2>
    <p>Preservar voz significa oferecer um caminho efetivo para manifestação, não necessariamente manter todos os microfones abertos. Fila de fala, chat moderado e perguntas lidas pela mesa podem funcionar quando as regras são conhecidas, acessíveis e não discriminatórias. A presidência deve distinguir moderação de supressão de debate.</p>
    <p>Cada item deve seguir uma sequência inteligível: apresentação, perguntas, debate, formulação final da proposta, confirmação de quem está apto, abertura, encerramento e anúncio do resultado. Alterações substanciais na proposta durante a discussão precisam ser repetidas antes do voto.</p>
    <p>Disponibilize alternativa razoável para falha individual de áudio ou dificuldade de acessibilidade, dentro das regras anunciadas. Se uma interrupção geral impedir participação significativa, a mesa deve avaliar suspensão, retomada ou adiamento, registrando a decisão.</p>

    <h2 id="quorum">Quórum e peso dos votos</h2>
    <p>Existem perguntas diferentes: há pessoas suficientes para instalar ou deliberar? Quem está apto? Qual é a base — presentes, total de condôminos, unidades ou frações? Qual é o peso de cada voto? A resposta muda conforme a matéria, a chamada, a lei e a convenção. Por isso, não use um percentual único para toda a pauta.</p>
    <p>O Código Civil prevê, como regra geral para primeira convocação quando não há quórum especial, maioria dos votos dos presentes que representem ao menos metade das frações ideais. Em segunda convocação, a regra geral é maioria dos presentes, ressalvados quóruns especiais. Os votos são proporcionais às frações ideais, salvo disposição diversa da convenção. Essas regras devem ser aplicadas ao caso concreto.</p>
    <p>Prepare uma ficha por item com base, exigência, aptos, peso e fórmula. Registre entradas e saídas antes de abrir a votação. Para um tratamento completo, consulte o <Link href="/pt/governanca-condominial/quorum-assembleia-condominio">guia de quórum</Link>.</p>

    <h2 id="ata">Ata e registros eletrônicos</h2>
    <p>A ata deve reconstruir o essencial: convocação, data, modalidade, chamadas, mesa, presença, ocorrências técnicas relevantes, propostas, resultados e encerramento. Para cada votação, informe a formulação submetida, base de cálculo, votos favoráveis, contrários, abstenções e conclusão. Se houver fração ideal, registre os totais ponderados.</p>
    <p>Registros eletrônicos de envio, presença e votação apoiam a consistência, mas sua guarda deve ter finalidade, acesso e prazo definidos. Gravar áudio ou vídeo não é obrigação automática nem substitui a ata; a decisão exige avaliação de necessidade, transparência, privacidade e convenção.</p>
    <p>Faça a conferência final antes de publicar. Uma correção posterior deve preservar a versão anterior e explicar o ajuste. A Allecto oferece fluxos de assembleia, documentos, votação, quórum, atas e relatórios; a validação jurídica do procedimento continua sendo responsabilidade do condomínio.</p>
    <h3>Exemplo de fluxo completo</h3>
    <p>Considere uma assembleia para aprovar orçamento e eleger o conselho. Dez dias antes, a administração fecha o cadastro, identifica contatos devolvidos e recebe procurações por canal definido. O edital apresenta duas chamadas, documentos financeiros, regras de credenciamento e forma de votação. No dia, a mesa anuncia presença e peso representado, explica a ordem e abre perguntas sobre o primeiro item.</p>
    <p>Depois do debate, a presidência lê a proposta final, atualiza a base após duas saídas e abre a votação. O relatório separa favoráveis, contrários e abstenções. Antes da eleição, novas candidaturas são confirmadas dentro das regras da convocação; a aptidão é recalculada e um novo voto é aberto. A ata não reutiliza os números do orçamento para a eleição.</p>
    <p>Se um grupo remoto relata que deixou de ouvir por cinco minutos, a mesa pausa, confirma o alcance da falha e repete a apresentação relevante. O registro informa horário, medida corretiva e confirmação de retomada. Essa resposta é mais defensável do que ignorar o problema ou anular toda a reunião sem avaliar seu impacto.</p>
    <p>Após o encerramento, outra pessoa confere presença, procurações, bases e totais antes da publicação. Os documentos são associados ao dossiê da assembleia com perfis de acesso. O condomínio aplica sua política de retenção em vez de deixar tudo indefinidamente na conta pessoal do síndico.</p>

    <h2 id="erros">Erros que podem gerar questionamentos</h2>
    <ul><li>Não convocar todos os condôminos ou usar cadastro desatualizado.</li><li>Omitir instruções de acesso, manifestação e votação.</li><li>Tratar login como prova suficiente de titularidade ou representação.</li><li>Impedir debate por configuração ou moderação inadequada.</li><li>Aplicar o mesmo quórum a matérias diferentes.</li><li>Ignorar fração ideal ou regra diversa da convenção.</li><li>Contar duas vezes titular e procurador.</li><li>Alterar a proposta sem reapresentá-la antes do voto.</li><li>Não registrar falhas técnicas relevantes e decisões da mesa.</li><li>Prometer que a plataforma, sozinha, garante validade.</li></ul>

    <h2 id="checklist">Checklist para uma assembleia online</h2>
    <Checklist items={["Ler convenção, regimento e legislação aplicável", "Classificar a matéria e validar o quórum de cada item", "Atualizar cadastro de unidades, titulares e contatos", "Definir prazo e conferência de procurações", "Redigir edital com acesso, manifestação e coleta de votos", "Disponibilizar documentos da pauta", "Testar plataforma, áudio, suporte e contingência", "Definir lista de presença e registro de entradas e saídas", "Preparar roteiro de debate e formulação das propostas", "Conferir peso dos votos e evitar duplicidades", "Registrar resultados e ocorrências na ata", "Revisar acesso e retenção dos registros"]} />

    <h2 id="faq">Perguntas frequentes</h2>
    <h3>A convenção precisa autorizar expressamente?</h3><p>O artigo 1.354-A condiciona o formato à inexistência de vedação na convenção. A redação concreta do documento deve ser analisada, especialmente se houver regras incompatíveis ou anteriores à lei.</p>
    <h3>Uma chamada de vídeo é suficiente?</h3><p>Não por si só. É preciso integrar convocação, identificação, debate, votação, quórum e registros. A ferramenta é apenas uma parte do processo.</p>
    <h3>Quem não consegue usar internet pode questionar?</h3><p>Dificuldades não anulam automaticamente a assembleia, mas instruções insuficientes ou barreiras que impeçam direitos podem aumentar riscos. Planeje suporte e alternativas proporcionais.</p>
    <h3>O voto pode ficar aberto por vários dias?</h3><p>O procedimento precisa respeitar a convocação e as regras aplicáveis. Sessão permanente possui requisitos próprios; não trate qualquer votação prolongada como equivalente sem análise.</p>
    <h3>A reunião precisa ser gravada?</h3><p>Não existe resposta universal. Avalie necessidade, transparência, privacidade, acesso, retenção e regras internas. A ata continua essencial.</p>
    <h3>Condômino inadimplente pode participar?</h3><p>Participação, voz e voto devem ser distinguidos. O Código Civil relaciona o direito de votar e participar à quitação, mas situações concretas e interpretação profissional merecem cuidado.</p>
    <h3>Procuração eletrônica é aceita?</h3><p>Confira convenção, forma do mandato, poderes e legislação. Não presuma que uma imagem enviada no chat atende a todas as formalidades.</p>
    <h3>A plataforma garante validade jurídica?</h3><p>Não. Recursos tecnológicos ajudam a organizar evidências e cálculos, mas validade depende do procedimento completo, da matéria, da convenção e da legislação.</p>
  </>,
};

export const quorumContent: ArticleContent = {
  directAnswer: "Quórum é a medida de participação ou aprovação exigida para que uma assembleia possa deliberar validamente. Seu cálculo depende da matéria, da convocação, da base prevista em lei e na convenção, da aptidão dos votantes e, em muitos casos, das frações ideais — não existe uma tabela única válida para todas as decisões.",
  sections: [
    ["conceito", "O que é quórum"], ["instalacao-deliberacao", "Instalação e deliberação"], ["unidade-fracao", "Unidade ou fração ideal"], ["base-calculo", "Base de cálculo"], ["aptos", "Participantes aptos"], ["procuracoes", "Procurações"], ["inadimplentes", "Unidades inadimplentes"], ["materias", "Diferentes matérias"], ["movimentacao", "Entradas e saídas"], ["por-item", "Quórum por pauta"], ["exemplos", "Exemplos"], ["erros-quorum", "Erros comuns"], ["checklist", "Checklist"], ["faq", "Perguntas frequentes"],
  ].map(([id, label]) => ({ id, label })),
  sources: legalSources,
  related: ["/pt/governanca-condominial/votacao-por-fracao-ideal-condominio", "/pt/governanca-condominial/assembleia-condominial-online-e-valida", "/pt/governanca-condominial/assembleia-hibrida-condominio"],
  ctaLabel: "Conhecer o controle de quórum da Allecto",
  body: <>
    <p>Controlar quórum começa antes da assembleia. A equipe precisa saber qual pergunta está respondendo: quantos ou qual percentual deve estar representado para instalar a reunião? Qual apoio é necessário para aprovar cada matéria? A contagem considera o total do condomínio, os presentes, unidades ou frações ideais? Quem pode votar? Sem separar essas dimensões, um número aparentemente correto pode usar a base errada.</p>
    <p>Este guia apresenta um método operacional. Ele não substitui a leitura da convenção, do Código Civil e de legislação específica. Obras, alteração da convenção, mudança de destinação, sanções, eleição ou destituição podem seguir critérios diferentes. Confirme a redação vigente e a formulação exata da pauta.</p>

    <h2 id="conceito">O que é quórum</h2>
    <p>Quórum é uma exigência mínima de presença, representação ou votos. Em condomínio, a palavra costuma ser usada para três números: presença na reunião, condição para deliberar e quantidade favorável necessária à aprovação. A ata e o painel de votação devem nomear cada um para não confundir “60% dos presentes” com “60% de todas as frações do condomínio”.</p>
    <p>Imagine cem unidades iguais. Compare: maioria de 30 presentes exige mais de 15 votos favoráveis; maioria do total exige mais de 50; dois terços do total exige ao menos o patamar correspondente a 66,666...%, cuja operacionalização deve evitar arredondamento que reduza a exigência. Se as frações não forem iguais, contar pessoas ou unidades pode produzir outro resultado.</p>
    <p>O quórum também muda no tempo. Um participante pode entrar depois da instalação, sair antes de uma votação ou representar mais de uma unidade. Por isso, a fotografia inicial não deve ser reutilizada automaticamente para todos os itens.</p>

    <h2 id="instalacao-deliberacao">Quórum de instalação e de deliberação</h2>
    <p>Quórum de instalação responde se a assembleia pode começar na convocação indicada. Quórum de deliberação mede se uma proposta recebeu o apoio necessário. O Código Civil traz uma regra geral para primeira convocação quando não há quórum especial: maioria dos votos dos presentes que representem pelo menos metade das frações ideais. Para a segunda convocação, prevê maioria dos presentes, ressalvadas matérias com quórum especial.</p>
    <p>Essas regras gerais não devem ser copiadas para todo caso. A convenção pode disciplinar horários, chamadas e forma de contagem dentro dos limites legais. A lei exige quóruns próprios para determinados assuntos. Primeiro classifique a pauta; depois selecione a regra.</p>
    <DataTable headers={["Pergunta", "Momento", "Registro recomendado"]} rows={[
      ["A reunião pode ser instalada?", "Em cada convocação", "Total representado, base e horário"],
      ["O item pode ser deliberado?", "Antes da abertura do voto", "Aptos presentes e exigência da matéria"],
      ["A proposta foi aprovada?", "Após o encerramento", "Favoráveis, contrários, abstenções e fórmula"],
      ["O quórum foi mantido?", "Após entradas ou saídas", "Atualização da presença por item"],
    ]} />

    <h2 id="unidade-fracao">Unidade ou fração ideal</h2>
    <p>“Uma unidade, um voto” não é uma regra universal. O parágrafo único do artigo 1.352 estabelece proporcionalidade às frações ideais no solo e nas partes comuns, salvo disposição diversa da convenção. Assim, a primeira fonte do peso é a matrícula/convenção e a segunda é a regra convencional aplicável.</p>
    <p>Unidade é o imóvel autônomo; fração ideal é sua participação percentual ou decimal no terreno e nas partes comuns. Duas unidades podem ter pesos iguais ou diferentes. Vagas autônomas, lojas, unidades agrupadas e alterações de áreas exigem cuidado cadastral. Leia o guia específico de <Link href="/pt/governanca-condominial/votacao-por-fracao-ideal-condominio">votação por fração ideal</Link> para os cálculos.</p>

    <h2 id="base-calculo">Como determinar a base de cálculo</h2>
    <p>Escreva a regra como uma frase antes de criar a fórmula: “aprovação por maioria dos votos dos condôminos presentes, ponderados pela fração ideal” é diferente de “aprovação por dois terços dos votos de todos os condôminos”. Identifique numerador, denominador e critério de peso.</p>
    <p>O denominador pode ser o total de condôminos, o total das frações, os aptos ou apenas os presentes, conforme a regra. O numerador pode contar votos ou somar pesos favoráveis. Abstenções podem permanecer na base ou não, dependendo da formulação. A memória de cálculo deve tornar essas decisões visíveis.</p>
    <p>Crie uma ficha de pauta com: texto da proposta, fundamento, primeira/segunda convocação, base, peso, tratamento de abstenção, patamar, arredondamento e responsável pela conferência. Essa ficha reduz mudanças improvisadas.</p>
    <h3>Quatro totais que não devem ser misturados</h3>
    <p>Mantenha lado a lado o total cadastrado do condomínio, o total apto para aquela matéria, o total representado no momento e o total que efetivamente votou. Eles podem divergir sem erro: uma unidade pode estar ausente, outra presente mas impedida, e uma terceira apta pode se abster.</p>
    <p>Ao anunciar percentuais, sempre associe denominador. “Setenta por cento aprovou” é incompleto; “favoráveis representam 70% do peso presente e 42% do total do condomínio” permite avaliar a regra. Essa transparência também facilita descobrir quando o painel usa a base errada.</p>

    <h2 id="aptos">Participantes aptos a votar</h2>
    <p>Presença não equivale automaticamente a voto. A lista pode incluir titulares, coproprietários, procuradores, locatários, membros da equipe e convidados. Para cada unidade, determine quem exerce o voto e por qual fundamento. Evite permitir votos simultâneos de coproprietários sem uma regra para manifestação unitária da unidade.</p>
    <p>Feche o credenciamento antes de cada votação, mas registre correções justificadas. Use estados claros: apto, pendente de documento, presente sem voto e substituído por representante. A mesa deve poder explicar recusas sem expor dados pessoais desnecessários.</p>

    <h2 id="procuracoes">Procurações</h2>
    <p>A procuração desloca o exercício do voto, não cria uma unidade adicional. Confira identidade, poderes, vigência, assinatura/formalidade exigida e eventuais limites convencionais. Um procurador pode representar várias unidades quando isso for permitido, mas cada unidade conserva seu peso e condição.</p>
    <p>Monte um registro com outorgante, unidade, outorgado, itens abrangidos, data de conferência e responsável. Se a procuração for substituída ou revogada, preserve o histórico da decisão cadastral. Nunca conte o titular e o procurador ao mesmo tempo.</p>
    <p>Documentos devem ser recebidos em canal controlado, não em grupos abertos. O tratamento envolve dados pessoais e precisa de finalidade, acesso restrito e retenção definida.</p>

    <h2 id="inadimplentes">Unidades inadimplentes</h2>
    <p>O artigo 1.335, III, relaciona o direito de votar e participar das deliberações à quitação. A aplicação prática exige cadastro financeiro atualizado e cuidado com acordos, pagamentos recentes, cobranças discutidas, copropriedade e convenção. Evite anunciar detalhes da dívida aos demais participantes.</p>
    <p>Defina uma data e fonte de corte, um canal reservado para contestação e quem decide casos pendentes. Atualizações de última hora precisam ser documentadas. Questões controversas devem ser encaminhadas à assessoria do condomínio em vez de decididas pela ferramenta.</p>

    <h2 id="materias">Quórum para diferentes matérias</h2>
    <p>Não existe uma tabela simples capaz de cobrir todas as hipóteses e reformas legislativas. O Código Civil contém regras para convenção, destinação, obras, reconstrução, multas, síndico e outras matérias; normas especiais e a convenção podem acrescentar detalhes. Uma descrição imprecisa da pauta também pode mudar a classificação.</p>
    <DataTable headers={["Tipo de pauta", "Questão antes de calcular", "Cuidado"]} rows={[
      ["Ordinária", "Existe quórum especial?", "Aplicar regra geral somente após excluir exceções"],
      ["Obra", "É necessária, útil ou voluptuária?", "Classificação fática e jurídica altera o quórum"],
      ["Convenção/destinação", "Qual texto e efeito exatos?", "Verificar versão vigente da lei"],
      ["Sanção", "Qual conduta e procedimento?", "Garantir pauta, defesa e quórum aplicável"],
      ["Eleição/destituição", "O edital é específico?", "Conferir lei e convenção"],
    ]} />
    <p>A tabela é um roteiro de investigação, não uma tabela de percentuais. Registre a fonte usada e a data da validação. Se a proposta muda durante o debate, confirme se continua dentro da pauta e se mantém a mesma regra.</p>

    <h2 id="movimentacao">Entradas e saídas durante a reunião</h2>
    <p>Uma pessoa que entrou depois da instalação pode estar presente para a votação seguinte. Outra que saiu não deveria compor automaticamente a base de presentes daquele item. Em reunião online ou <Link href="/pt/governanca-condominial/assembleia-hibrida-condominio">híbrida</Link>, quedas breves de conexão exigem regra proporcional e transparente.</p>
    <p>Registre entrada, saída, retorno e troca de representante. Antes de abrir cada votação, anuncie o total apto e a base ponderada. Se a mudança altera a possibilidade de deliberar, a presidência deve reconhecer isso antes de coletar votos.</p>
    <p>A lista operacional detalhada pode ser restrita; a ata deve conter informação suficiente para justificar o cálculo sem divulgar dados além do necessário.</p>

    <h2 id="por-item">Quórum por item da pauta</h2>
    <p>O controle correto é matricial: linhas representam unidades ou representantes; colunas representam itens. Para cada cruzamento, registre presença, aptidão, peso e voto. Essa estrutura impede que uma procuração limitada ao item 1 seja usada no item 3 ou que a presença inicial permaneça após a saída.</p>
    <p>Feche uma votação antes de abrir a seguinte. Guarde a formulação final, o horário e a base. Se houver empate, abstenção ou voto inválido, aplique a regra previamente definida e registre o tratamento.</p>
    <h3>Rotina de abertura e fechamento</h3>
    <p>Na abertura, a secretaria lê a identificação do item, a regra configurada e o total representado. A presidência pergunta se existe impedimento ou correção de credenciamento pendente. Só então o voto é liberado. Esse pequeno ritual permite detectar uma procuração ainda não processada ou uma unidade atribuída à pessoa errada.</p>
    <p>No fechamento, o sistema ou planilha deixa de aceitar escolhas; a equipe confere se o total votante não ultrapassa o total apto e se todos os pesos pertencem à versão congelada. O anúncio deve apresentar números, base e conclusão, evitando apenas “aprovado pela maioria”. Impugnações imediatas entram na ata com a resposta da mesa.</p>

    <h2 id="exemplos">Exemplos de cálculo</h2>
    <h3>Exemplo 1: unidades com pesos iguais</h3>
    <p>Há 80 unidades, 44 aptas presentes e uma matéria regida por maioria dos presentes. Se todos os pesos são iguais e existem 24 votos favoráveis, 18 contrários e 2 abstenções, não basta divulgar “54,5%” sem indicar a base. Se a maioria incide sobre os 44 presentes, os 24 favoráveis superam metade. Se a regra considerar apenas votos válidos, o percentual muda. A convenção e o fundamento devem definir o tratamento.</p>
    <h3>Exemplo 2: frações diferentes</h3>
    <p>Quatro unidades presentes têm pesos de 0,8%, 1,0%, 1,2% e 2,0%. As duas primeiras votam “sim” e as duas últimas “não”. Por cabeça há empate de 2 a 2; por fração, “sim” soma 1,8% e “não” soma 3,2%. O resultado depende da regra de peso, não da interface que mostra quatro votos.</p>
    <h3>Exemplo 3: quórum sobre o total</h3>
    <p>Se a regra exige uma proporção do condomínio inteiro, ausentes afetam o alcance do patamar mesmo sem votar “não”. O denominador deve continuar sendo o total aplicável, e não apenas os presentes. Não converta uma exigência sobre o total em maioria simples dos participantes.</p>
    <h3>Exemplo 4: procuração limitada</h3>
    <p>A unidade 34 é representada por procuração válida apenas para aprovação das contas. Ela integra presença e voto nesse item, mas não deve ser incluída automaticamente na eleição seguinte. A matriz por pauta altera o status da unidade e recalcula a base. Uma lista geral sem escopo provavelmente contaria essa representação além dos poderes recebidos.</p>
    <h3>Exemplo 5: entrada durante a votação</h3>
    <p>A unidade 72 acessa a sala depois que a votação foi aberta. A regra operacional deve definir se ainda pode ser credenciada enquanto o voto está em curso, desde que haja tempo e igualdade, ou se participará do próximo item. O importante é não alterar silenciosamente o denominador depois de divulgar um resultado. Registre decisão, horário e impacto.</p>
    <h3>Exemplo 6: mudança na proposta</h3>
    <p>A pauta previa contratar obra até determinado valor. Após o debate, a proposta é reduzida e inclui condição de pagamento. A presidência precisa ler o texto final, confirmar que permanece dentro da convocação e verificar se a natureza/quórum não mudou. O relatório deve vincular votos à versão efetivamente submetida.</p>
    <h3>Como documentar a memória de cálculo</h3>
    <p>Uma memória útil contém identificação da assembleia e item, fonte do cadastro, versão da convenção, fundamento, total do condomínio, total apto, total presente, método de ponderação, tratamento de abstenções, fórmula e responsável pela conferência. Não precisa expor dados financeiros ou documentos pessoais.</p>
    <p>Se houver correção, preserve o cálculo anterior, o motivo, quem autorizou e a nova conclusão. Evite substituir arquivos com o mesmo nome. A ata pode resumir, enquanto o dossiê restrito conserva detalhes necessários à verificação.</p>
    <h3>Contingência para o controle</h3>
    <p>Se o painel ficar indisponível, não reconstrua o quórum de memória. Mantenha exportação prévia do cadastro e uma folha controlada para registrar eventos ocorridos durante a falha. Ao retomar, reconcilie cada entrada, saída e voto antes de anunciar o resultado.</p>
    <p>A contingência deve preservar a mesma regra e impedir duplicidades. Receber votos por vários canais sem identificador comum torna a conferência frágil. Se não for possível garantir base e unicidade, suspenda a votação, explique o motivo e registre a decisão da mesa.</p>
    <h3>Sessão permanente não reduz quórum</h3>
    <p>Quando uma matéria exige quórum especial não alcançado, o artigo 1.353 traz condições para conversão em sessão permanente. Esse mecanismo não transforma o requisito especial em maioria simples: ele organiza continuidade e coleta dentro dos limites legais. Convocação, prazos e ata precisam seguir a regra vigente.</p>

    <h2 id="erros-quorum">Erros comuns</h2>
    <ul><li>Usar tabela de internet sem conferir a lei vigente e a convenção.</li><li>Confundir quórum de instalação com aprovação.</li><li>Contar unidades quando a regra exige frações.</li><li>Calcular sobre presentes quando o requisito usa o total.</li><li>Não atualizar a base após entradas e saídas.</li><li>Duplicar votos de titular e procurador.</li><li>Excluir ou incluir inadimplente sem critério documentado.</li><li>Arredondar para baixo um patamar legal.</li><li>Omitir abstenções e memória de cálculo da ata.</li><li>Reutilizar um quórum em toda a pauta.</li></ul>

    <h2 id="checklist">Checklist de controle</h2>
    <Checklist items={["Obter convenção e regimento vigentes", "Descrever cada proposta com precisão", "Identificar fundamento e quórum de cada item", "Definir denominador, numerador, peso e abstenções", "Atualizar cadastro e frações ideais", "Validar aptidão e procurações", "Definir corte e tratamento de pendências financeiras", "Registrar primeira e segunda convocações", "Controlar entrada, saída e troca de representante", "Congelar a base antes de cada votação", "Conferir cálculo por segunda pessoa", "Registrar fórmula, totais e conclusão na ata"]} />

    <h2 id="faq">Perguntas frequentes</h2>
    <h3>Maioria simples é metade mais um?</h3><p>A expressão precisa de uma base: presentes, votos válidos, unidades ou frações. Em conjuntos ponderados, “mais um voto” pode não fazer sentido. Descreva a fórmula aplicável.</p>
    <h3>Abstenção conta?</h3><p>Depende de como a regra define a base e os votos exigidos. Registre separadamente e valide o tratamento antes da votação.</p>
    <h3>Segunda convocação elimina todo quórum especial?</h3><p>Não. O artigo 1.353 ressalva matérias com quórum especial. Segunda convocação não reduz automaticamente exigências específicas.</p>
    <h3>O síndico tem voto de desempate?</h3><p>Não presuma. Verifique convenção, condição do síndico como condômino e regra da matéria. Busque orientação em caso de conflito.</p>
    <h3>Uma pessoa com três unidades tem três votos?</h3><p>Cada unidade e seu peso devem ser tratados conforme convenção e cadastro. A pessoa pode representar múltiplas unidades sem que seus pesos sejam fundidos indevidamente.</p>
    <h3>Procuração entra no quórum?</h3><p>Quando válida e abrangente para o item, a unidade representada pode integrar presença e cálculo conforme a regra. Controle limitações e revogações.</p>
    <h3>Posso divulgar a lista de inadimplentes?</h3><p>O acesso à situação financeira deve ser restrito ao necessário. A mesa pode tratar aptidão sem expor dívida individual em tela ou grupo.</p>
    <h3>Software decide qual quórum usar?</h3><p>Ele pode executar uma configuração e registrar resultados. A classificação jurídica e a regra correta devem ser definidas pelo condomínio com apoio profissional quando necessário.</p>
  </>,
};

export const fractionContent: ArticleContent = {
  directAnswer: "Na votação por fração ideal, o voto de cada unidade recebe o peso percentual ou decimal atribuído a ela no condomínio. A regra geral do Código Civil usa esse peso, salvo disposição diversa da convenção; por isso, cadastro, base de cálculo e arredondamento devem ser definidos antes da votação.",
  sections: [
    ["conceito", "O que é fração ideal"], ["ponderado", "Voto por unidade e ponderado"], ["codigo-civil", "O que diz o Código Civil"], ["convencao", "Regras da convenção"], ["cadastro", "Cadastro das unidades"], ["exemplo", "Exemplo completo"], ["varias-unidades", "Proprietários de várias unidades"], ["procuracoes", "Procurações"], ["elegibilidade", "Elegibilidade"], ["arredondamento", "Arredondamento"], ["quorum-resultado", "Quórum e resultado"], ["auditoria", "Conferência"], ["erros-fracao", "Erros comuns"], ["checklist", "Checklist"], ["faq", "Perguntas frequentes"],
  ].map(([id, label]) => ({ id, label })),
  sources: legalSources,
  related: ["/pt/governanca-condominial/quorum-assembleia-condominio", "/pt/governanca-condominial/assembleia-condominial-online-e-valida"],
  ctaLabel: "Ver como funciona a votação pela Allecto",
  body: <>
    <p>Fração ideal é uma participação jurídica e matemática, não uma estimativa do tamanho do apartamento. Quando ela define o peso do voto, o resultado é obtido pela soma das frações associadas a cada opção. A contagem pode divergir de uma votação “por cabeça”, e ambas podem estar matematicamente corretas — apenas uma, porém, corresponde à regra aplicável.</p>
    <p>Antes de votar, confirme a fonte cadastral, a convenção, a matéria e a unidade de medida. Um sistema pode somar os valores configurados, mas não deve inventar frações, decidir a elegibilidade ou escolher qual regra jurídica prevalece.</p>

    <h2 id="conceito">O que é fração ideal</h2>
    <p>A fração ideal representa a parcela inseparável de cada unidade autônoma no terreno e nas coisas comuns. Ela costuma aparecer na instituição, especificação e convenção do condomínio, em formato decimal, percentual ou fracionário. A soma esperada das unidades deve representar o todo, embora documentos históricos possam usar escalas diferentes.</p>
    <p>Uma unidade maior não necessariamente terá peso maior em qualquer votação: isso depende dos registros e da convenção. Também não se deve confundir fração ideal com rateio mensal, área privativa, número de moradores ou quantidade de vagas. Alterações registrárias e unificações podem exigir atualização.</p>
    <p>Para fins operacionais, escolha uma representação interna consistente, de preferência com precisão suficiente para conservar o valor original. Guarde a fonte e a data da conferência.</p>

    <h2 id="ponderado">Voto por unidade e voto ponderado</h2>
    <p>No voto por unidade, cada unidade apta contribui com uma mesma quantidade, geralmente um voto. No voto ponderado, cada unidade contribui com sua fração. Se cinco unidades votam “sim”, o total favorável pode ser cinco votos por unidade, mas 4,37% por fração. O relatório deve nomear qual medida apresenta.</p>
    <DataTable headers={["Unidade", "Fração", "Voto", "Peso somado"]} rows={[
      ["101", "0,80%", "Sim", "0,80% para Sim"], ["102", "1,20%", "Não", "1,20% para Não"], ["201", "1,50%", "Sim", "1,50% para Sim"], ["Loja A", "2,50%", "Abstenção", "2,50% em abstenção"],
    ]} />
    <p>O número de pessoas conectadas não determina o peso. Um procurador que representa três unidades pode emitir uma escolha para cada uma, conforme os poderes recebidos. Coproprietários de uma unidade não multiplicam a fração dela.</p>

    <h2 id="codigo-civil">O que diz o Código Civil</h2>
    <p>O parágrafo único do artigo 1.352 estabelece que os votos serão proporcionais às frações ideais no solo e nas partes comuns pertencentes a cada condômino, salvo disposição diversa da convenção de constituição. O caput também relaciona, na regra geral da primeira convocação, presentes e representação de pelo menos metade das frações ideais.</p>
    <p>Essa disposição convive com quóruns especiais e outras normas do condomínio. Ela não significa que qualquer percentual favorável aprova qualquer pauta. Primeiro se identifica a exigência da matéria; depois se calcula a presença e o resultado com o peso aplicável.</p>
    <p>Use sempre o texto compilado vigente e registre a conclusão da análise. Leis podem mudar e uma palavra da pauta pode alterar a classificação.</p>

    <h2 id="convencao">Regras estabelecidas pela convenção</h2>
    <p>A ressalva legal permite que a convenção estabeleça regra diversa. Procure cláusulas sobre “direito de voto”, “peso”, “fração”, “unidade”, “voto por cabeça” e quóruns. Não leia trechos isolados: definições, anexos e tabelas podem completar a regra.</p>
    <p>Se a convenção determina votos iguais por unidade para determinadas deliberações, configure isso de modo explícito. Se permanece silenciosa, a regra geral de proporcionalidade merece atenção. Quando a redação é ambígua ou entra em tensão com legislação, obtenha análise jurídica antes da assembleia.</p>
    <p>Não altere o critério durante o debate para “desempatar”. Mudança de convenção possui procedimento próprio; a mesa deve aplicar a regra definida previamente e registrar eventual impugnação.</p>

    <h2 id="cadastro">Como preparar o cadastro das unidades</h2>
    <p>Construa uma tabela-mestra com código único da unidade, bloco, tipo, fração original, fração normalizada, titularidade, fonte documental, data de atualização e status. Separe dados permanentes — unidade e fração — de dados mutáveis, como contato, ocupação e aptidão financeira.</p>
    <p>Valide a soma. Se as frações estão em percentual, o total deve se aproximar de 100%; se usam outra escala, registre-a. Diferenças pequenas podem decorrer de casas decimais publicadas, mas não devem ser “corrigidas” distribuindo resíduos sem fundamento. Volte ao documento de origem.</p>
    <p>Faça dupla conferência antes de uma pauta sensível. Uma unidade omitida, duplicada ou com vírgula deslocada pode alterar presença e resultado. Controle versões para saber qual cadastro foi usado na votação.</p>
    <Checklist items={["Importar todas as unidades e identificadores", "Registrar a fração exatamente como consta na fonte", "Normalizar escala sem perder o original", "Conferir soma e duplicidades", "Tratar lojas, vagas autônomas e unidades agrupadas", "Registrar titularidade e representação separadamente", "Congelar uma versão para a assembleia"]} />

    <h2 id="exemplo">Exemplo prático completo</h2>
    <p>Considere um condomínio simplificado com seis unidades. A: 10%; B: 10%; C: 15%; D: 15%; E: 20%; F: 30%. Todas estão aptas, mas A, B, C, E e F participam. A proposta é submetida a uma regra hipotética de maioria do peso presente.</p>
    <p>A e B votam “sim”; C e E votam “não”; F se abstém. O peso presente é 85%. O “sim” soma 20%, o “não” soma 35% e a abstenção soma 30%. Se a maioria for calculada sobre todo o peso presente, 20% não supera 42,5%. Se a regra considerar apenas votos válidos, “sim” é 20 de 55 e ainda perde. O relatório deve mostrar valores absolutos e percentuais, sem ocultar a abstenção.</p>
    <p>Agora suponha que F votasse “sim”. O resultado por unidade seria três votos “sim” contra dois “não”; por fração, “sim” somaria 50% e “não”, 35%. Ambos indicariam aprovação nessa hipótese, mas por margens diferentes. Se D entrasse antes da votação e votasse “não”, a base e o total contrário mudariam. Isso mostra por que presença precisa ser congelada por item.</p>
    <h3>Exemplo de convenção com voto igual</h3>
    <p>Se a convenção validamente estabelece um voto por unidade para a matéria, a mesma tabela cadastral pode continuar guardando frações, mas o motor de cálculo atribui peso 1 a cada unidade apta. O relatório identifica a regra convencional e não apresenta a soma por fração como fundamento da conclusão.</p>
    <p>Essa configuração não deve ser herdada por todas as pautas sem leitura. A cláusula pode ter escopo limitado, e matérias com quórum legal especial continuam merecendo análise. Versione a regra junto com a assembleia.</p>

    <h2 id="varias-unidades">Proprietários de várias unidades</h2>
    <p>Uma pessoa pode ser titular de diversas unidades. O cadastro deve manter cada unidade separada, com sua fração e aptidão. A interface pode facilitar uma escolha conjunta, mas o registro precisa permitir resultados distintos quando houver procurações, copropriedade ou restrição em apenas uma unidade.</p>
    <p>Para presença, some as unidades efetivamente representadas. Para resultado, associe cada escolha ao peso da unidade. Não crie uma “fração pessoal” permanente, pois a composição representada pode mudar entre assembleias.</p>

    <h2 id="procuracoes">Procurações</h2>
    <p>O procurador exerce o voto das unidades abrangidas pelo mandato. Confira poderes, limitações por pauta e formalidades. A procuração não transfere a fração para o nome do procurador; apenas relaciona representação e unidade durante o escopo autorizado.</p>
    <p>Se dois procuradores apresentam documentos para a mesma unidade, a mesa precisa resolver a representação antes de contar votos. Registre substituição ou rejeição com justificativa e preserve os documentos em acesso restrito.</p>

    <h2 id="elegibilidade">Elegibilidade</h2>
    <p>O fato de uma fração existir não significa que ela integra automaticamente todos os cálculos. Titularidade, quitação, representação e matéria podem afetar aptidão. O artigo 1.335 relaciona voto e participação à quitação; a aplicação em situações concretas merece análise cuidadosa.</p>
    <p>Configure a decisão humana e documental antes da votação. A tecnologia pode registrar um status, mas não deve ser anunciada como validação jurídica automática. Ofereça canal reservado para correções e preserve o momento em que o status foi alterado.</p>

    <h2 id="arredondamento">Arredondamento</h2>
    <p>Arredondar apenas na apresentação é diferente de arredondar durante cada soma. Prefira guardar precisão completa e arredondar o número exibido ao final. Se as fontes têm quatro ou seis casas, não reduza previamente para duas sem testar o impacto.</p>
    <p>Documente a regra: escala, precisão interna, casas exibidas e tratamento de igualdade no limiar. Um resultado de 66,665% não deve ser mostrado como cumprimento de 66,67% apenas por formatação. Em quórum especial, obtenha conferência profissional.</p>

    <h2 id="quorum-resultado">Diferença entre quórum e resultado</h2>
    <p>Quórum mede se o conjunto exigido está presente ou apoiou a matéria; resultado distribui os votos coletados. Uma proposta pode vencer entre presentes e ainda não alcançar um patamar sobre o total. Pode também haver presença suficiente, mas empate na deliberação.</p>
    <p>Relatórios devem separar: fração total do condomínio, fração apta, fração presente, fração que votou, favorável, contrária e abstenção. Consulte o <Link href="/pt/governanca-condominial/quorum-assembleia-condominio">guia de quórum</Link> para selecionar denominadores.</p>

    <h2 id="auditoria">Conferência e auditoria</h2>
    <p>Uma conferência reproduz o resultado a partir das mesmas entradas. Exporte ou preserve cadastro usado, presenças, procurações, escolhas, precisão e fórmula. Restrinja detalhes individuais quando houver voto secreto e exponha apenas o necessário para verificar totais.</p>
    <p>Adote dupla revisão para pautas relevantes: uma pessoa configura; outra confere fonte, soma e amostra de unidades. Depois do encerramento, compare relatório e ata. Correções devem ser versionadas, justificadas e comunicadas conforme o caso.</p>
    <h3>Teste de consistência antes da reunião</h3>
    <p>Crie casos conhecidos: todas as unidades votam sim; apenas a maior fração vota não; há empate por unidade mas não por peso; uma unidade se abstém; uma procuração representa três unidades. Calcule manualmente e compare. O teste encontra escala errada, arredondamento prematuro e duplicidade antes que afetem uma decisão real.</p>
    <p>Também confira invariantes: nenhuma fração pode ser negativa; a soma por opções não pode superar o peso apto; uma unidade aparece no máximo uma vez por item; o total das opções mais ausências previstas reconcilia com a base. Alertas não decidem juridicamente, mas revelam dados inconsistentes.</p>
    <h3>Como apresentar o resultado</h3>
    <p>Apresente pelo menos o peso favorável, contrário e de abstenção, a base usada e o patamar. Quando útil, mostre também quantidade de unidades, deixando claro que é informação complementar. Exemplo: “Favoráveis: 38,4250% do total de 62,7500% presente; exigência: maioria do peso presente”.</p>

    <h2 id="erros-fracao">Erros comuns</h2>
    <ul><li>Usar área privativa como fração sem confirmar documentos.</li><li>Truncar casas decimais antes de somar.</li><li>Contar pessoa, unidade e fração como se fossem equivalentes.</li><li>Fundir permanentemente unidades de um mesmo proprietário.</li><li>Duplicar titular e procurador.</li><li>Ignorar regra diversa da convenção.</li><li>Confundir maioria dos presentes com percentual do total.</li><li>Ocultar abstenções.</li><li>Alterar o cadastro depois da votação sem versionamento.</li></ul>

    <h2 id="checklist">Checklist</h2>
    <Checklist items={["Ler convenção e fundamento da pauta", "Confirmar a fonte oficial das frações", "Normalizar sem apagar valores originais", "Validar soma, escala e precisão", "Separar unidade, pessoa e representação", "Conferir aptidão por item", "Definir denominador e tratamento de abstenções", "Registrar entradas e saídas", "Somar com precisão e arredondar apenas na exibição", "Reproduzir o cálculo antes de publicar a ata"]} />

    <h2 id="faq">Perguntas frequentes</h2>
    <h3>Fração ideal é igual à área?</h3><p>Não necessariamente. Use o valor documental do condomínio; área pode ser um componente de cálculo histórico, mas não deve substituí-lo.</p>
    <h3>Toda votação usa fração ideal?</h3><p>A regra geral do artigo 1.352 admite disposição diversa da convenção. A matéria e outras normas também importam. Verifique o caso.</p>
    <h3>Uma unidade pode ter mais de um voto?</h3><p>Coproprietários não multiplicam o peso da unidade. A manifestação deve ser organizada conforme titularidade, representação e convenção.</p>
    <h3>Quem possui três apartamentos vota uma ou três vezes?</h3><p>As três unidades permanecem separadas e contribuem conforme seus pesos e aptidão, ainda que uma pessoa as represente.</p>
    <h3>Como tratar abstenção?</h3><p>Mostre-a separadamente e aplique a base definida pela regra. Não a converta silenciosamente em voto contrário ou ausência.</p>
    <h3>Quantas casas decimais usar?</h3><p>Preserve a precisão da fonte e use precisão interna suficiente. Defina apenas a apresentação sem modificar o resultado.</p>
    <h3>O sistema pode calcular automaticamente?</h3><p>Pode somar dados configurados, mas a equipe deve conferir frações, aptidão, base e regra jurídica. Automação não corrige entrada errada.</p>
    <h3>O que guardar depois?</h3><p>Cadastro versionado, fontes, presença, representação, regra, resultados e ata, com acesso e retenção proporcionais.</p>
  </>,
};

export const hybridContent: ArticleContent = {
  directAnswer: "Uma assembleia híbrida reúne participantes presenciais e remotos na mesma reunião e sob as mesmas deliberações. Para funcionar, precisa de convocação clara, lista de presença única, canais equivalentes de voz e debate, quórum sincronizado e uma votação que impeça duplicidade.",
  sections: [
    ["conceito", "O que é assembleia híbrida"], ["previsao-legal", "Previsão legal"], ["quando-usar", "Quando utilizar"], ["edital", "Regras do edital"], ["infraestrutura", "Infraestrutura"], ["identificacao", "Identificação"], ["presenca", "Lista de presença unificada"], ["voz", "Direito de voz e debate"], ["votacao", "Votação sem duplicidade"], ["quorum", "Sincronização do quórum"], ["secreta", "Votação secreta"], ["contingencia", "Plano de contingência"], ["ata", "Ata e registros"], ["erros-hibrida", "Erros comuns"], ["checklist", "Checklist operacional"], ["faq", "Perguntas frequentes"],
  ].map(([id, label]) => ({ id, label })),
  sources: legalSources,
  related: ["/pt/governanca-condominial/assembleia-condominial-online-e-valida", "/pt/governanca-condominial/quorum-assembleia-condominio", "/pt/seguranca-e-criptografia/lgpd-para-condominios"],
  ctaLabel: "Organizar uma assembleia híbrida",
  body: <>
    <p>Formato híbrido não significa realizar uma assembleia presencial e outra online em paralelo. Existe uma única mesa, uma pauta, uma base de presença e um resultado para cada item. A operação precisa impedir que a diferença de canal crie participantes de primeira e segunda classe.</p>
    <p>O principal risco é a dessincronização: a pessoa assina a lista física e entra no sistema; o voto de papel é somado ao voto digital; uma pergunta remota não chega à mesa; ou o quórum exibido não reflete quem deixou a sala. O planejamento deve tratar pessoas e unidades como fonte única, independentemente do canal.</p>

    <h2 id="conceito">O que é uma assembleia híbrida</h2>
    <p>É a reunião em que parte dos participantes está no local físico e parte acessa remotamente, com interação simultânea. Todos acompanham o mesmo debate e votam nos mesmos itens. Ela difere de uma consulta eletrônica posterior e de uma sessão permanente: esses procedimentos possuem tempos e requisitos próprios.</p>
    <p>A mesa deve comandar ambos os ambientes. No local, alguém monitora microfones, projeção e credenciamento; no remoto, alguém acompanha fila de fala, chat, conexão e suporte. Essas funções podem ser acumuladas em reuniões pequenas, mas precisam ser nomeadas.</p>
    <p>O desenho deve priorizar equivalência funcional. Nem toda experiência será idêntica, porém todos precisam receber informação, ter oportunidade de manifestação e conseguir votar conforme as regras.</p>

    <h2 id="previsao-legal">Previsão legal</h2>
    <p>A Lei nº 14.309/2022 incluiu o artigo 1.354-A no Código Civil, admitindo convocação, realização e deliberação eletrônicas quando a convenção não proíbe e os direitos de voz, debate e voto são preservados. A modalidade híbrida combina o meio eletrônico com o presencial e deve atender às mesmas salvaguardas.</p>
    <p>A convocação de todos os condôminos, a pauta, a aptidão e os quóruns continuam indispensáveis. A tecnologia não substitui a convenção. Confira também normas complementares aprovadas no regimento e eventuais exigências locais relacionadas ao espaço físico.</p>
    <p>Leia primeiro o guia sobre quando uma <Link href="/pt/governanca-condominial/assembleia-condominial-online-e-valida">assembleia online pode ser válida</Link>. Em pautas controversas ou convenções ambíguas, obtenha orientação jurídica antes de definir o formato.</p>

    <h2 id="quando-usar">Quando utilizar o formato</h2>
    <p>O híbrido é útil quando há condôminos que valorizam a reunião física e outros que não podem se deslocar. Pode ampliar acesso em condomínios com proprietários residentes em outras cidades, pessoas com mobilidade reduzida ou agendas diversas. Também pode aproveitar infraestrutura já conhecida sem restringir a participação remota.</p>
    <p>Não é necessariamente a opção mais simples. Reuniões com internet instável, equipe reduzida, espaço sem acústica ou pauta altamente complexa podem exigir mais preparação. Compare capacidade técnica, custo, número de participantes, acessibilidade e risco de votação.</p>
    <DataTable headers={["Cenário", "Vantagem possível", "Risco a tratar"]} rows={[
      ["Muitos proprietários ausentes", "Participação remota", "Identificação e suporte"],
      ["Público acostumado ao presencial", "Transição gradual", "Equivalência de fala"],
      ["Pauta com documentos", "Exibição simultânea", "Mesma versão nos dois canais"],
      ["Condomínio grande", "Mais opções de acesso", "Equipe e infraestrutura suficientes"],
    ]} />

    <h2 id="edital">Regras do edital</h2>
    <p>Declare expressamente a modalidade híbrida, endereço, plataforma, horários das convocações, pauta e instruções para os dois canais. Explique cadastro, procurações, documentos, manifestação, votação, suporte e contingência. Não faça o remoto descobrir regras apenas depois do login.</p>
    <p>Defina até quando o participante escolhe ou troca de canal. A troca pode ser permitida, mas deve atualizar uma única presença. Informe se dispositivos serão disponibilizados no local e como pessoas sem equipamento poderão votar.</p>
    <p>Descreva o que acontece se houver falha geral de internet, energia, som ou plataforma. O edital não precisa resolver cada detalhe técnico, mas deve indicar critérios de suspensão, retomada e comunicação.</p>

    <h2 id="infraestrutura">Infraestrutura presencial e online</h2>
    <p>No local, teste conexão principal e alternativa, energia, projeção, câmera, caixas de som e microfones. Um microfone ambiente distante costuma impedir o remoto de compreender perguntas. Use microfone móvel ou ponto de fala e confirme que a plataforma recebe o áudio.</p>
    <p>No online, teste limite de participantes, permissões, compartilhamento de tela, fila de fala e suporte. Documentos apresentados devem ser legíveis nos dois ambientes. Desative notificações pessoais e evite exibir planilhas com CPF, e-mail ou situação financeira.</p>
    <p>Faça um ensaio completo, não apenas um teste de login. Simule entrada presencial, acesso remoto, procuração, troca de canal, abertura de voto, queda de conexão, reentrada e exportação do resultado.</p>
    <Checklist items={["Internet principal e contingência", "Energia e extensões protegidas", "Câmera enquadrando mesa/apresentação", "Microfone para falas da sala", "Retorno de áudio sem eco", "Tela visível no local", "Dispositivo de apoio para votação", "Operador remoto e suporte", "Cópia local dos documentos essenciais"]} />

    <h2 id="identificacao">Identificação dos participantes</h2>
    <p>Use cadastro prévio de unidades, titulares e representantes. Na entrada física, confira a identidade e marque o canal “presencial”. No remoto, aplique o procedimento informado. O identificador deve ser suficiente para reduzir representação indevida sem coletar dados excessivos.</p>
    <p>Procurações precisam ser conferidas uma vez e associadas às unidades correspondentes. Pulseiras, crachás ou cartões no local podem ajudar a equipe, mas não devem expor CPF ou inadimplência. No remoto, o nome exibido na sala não é prova isolada de aptidão.</p>
    <p>Se alguém muda do remoto para o presencial, encerre ou marque a sessão anterior antes de ativar a nova. Uma trilha operacional simples evita duplicidade.</p>

    <h2 id="presenca">Lista de presença unificada</h2>
    <p>A lista deve conter uma linha por unidade ou representação relevante, não duas listas somadas ao final. Campos úteis: unidade, pessoa credenciada, canal atual, horário de entrada, saída, retorno, procurações, aptidão e observação.</p>
    <p>Defina uma fonte oficial. Uma planilha paralela pode servir de contingência, mas precisa de reconciliação. Antes de cada votação, a equipe confirma o estado único e anuncia o quórum.</p>
    <p>Assinatura física não deve virar um voto extra. Da mesma forma, estar conectado em dois dispositivos não duplica presença. O identificador lógico é a unidade representada e seu direito aplicável.</p>

    <h2 id="voz">Direito de voz e debate</h2>
    <p>A presidência deve alternar ou integrar as filas. Uma prática é manter uma fila única com origem presencial/remota e anunciar o próximo participante. Perguntas no chat precisam de moderador que as encaminhe, sem selecionar apenas manifestações favoráveis.</p>
    <p>Todos devem ouvir a proposta final. Repita no microfone qualquer intervenção presencial feita longe dele. Quando um documento muda, compartilhe a mesma versão na tela e no projetor. Conceda tempo razoável para o remoto reagir ao atraso da transmissão.</p>
    <p>Regras de tempo e ordem podem organizar o debate, desde que sejam transparentes e aplicadas de maneira uniforme. A moderação não pode esvaziar os direitos assegurados pelo artigo 1.354-A.</p>

    <h2 id="votacao">Votação sem duplicidade</h2>
    <p>A solução mais consistente é usar um único mecanismo para todos, inclusive no local. Participantes presenciais podem votar pelo próprio dispositivo ou por estações controladas. Se houver papel e digital, a reconciliação fica mais complexa: é necessário bloquear a segunda via e preservar o sigilo quando aplicável.</p>
    <p>Antes de abrir o item, feche credenciamento, atualize presença, confirme representantes e formule a pergunta. Durante o voto, suporte não deve orientar escolha. Depois, encerre o mecanismo e registre resultados.</p>
    <p>A Allecto possui recursos comerciais de votação e controle de quórum; funcionalidades de assembleia híbrida constam no plano Gestão. Isso não significa validação jurídica automática nem dispensa o plano operacional.</p>

    <h2 id="quorum">Sincronização do quórum</h2>
    <p>Quórum deve ser calculado sobre a união deduplicada dos canais. Entradas e saídas precisam chegar à fonte oficial. Se uma pessoa remota perde conexão por segundos, aplique a regra de tolerância anunciada; se abandona a reunião, atualize antes do próximo item.</p>
    <p>Congele uma fotografia para cada votação: unidades representadas, aptas, pesos e representantes. Não altere retroativamente sem registrar correção. O <Link href="/pt/governanca-condominial/quorum-assembleia-condominio">guia de quórum</Link> explica bases e cálculos.</p>

    <h2 id="secreta">Votação secreta</h2>
    <p>Segredo do voto e verificabilidade precisam ser equilibrados. A mesa pode precisar comprovar que uma unidade apta votou uma única vez sem expor sua escolha. Defina quem acessa registros individualizados e o que aparece no relatório.</p>
    <p>Evite cédula física identificável colocada ao lado de lista nominal ou exibição de tela individual. Se misturar canais, os dois devem oferecer nível equivalente de sigilo. A convenção e a matéria podem exigir análise específica.</p>

    <h2 id="contingencia">Plano de contingência</h2>
    <p>Classifique falhas: individual, parcial no local, parcial no remoto ou geral. Para cada uma, indique responsável, canal de aviso, tempo de avaliação e decisão possível. Uma falha individual breve pode ser tratada com suporte; perda geral de áudio ou votação pede interrupção.</p>
    <p>Tenha conexão alternativa, contatos exportados, documentos essenciais e registro manual de presença. Contingência não deve criar um método de voto improvisado e impossível de conferir. Se a igualdade de participação não puder ser restaurada, suspender pode ser mais prudente.</p>
    <DataTable headers={["Falha", "Resposta inicial", "Registro"]} rows={[
      ["Áudio da sala não chega ao remoto", "Pausar debate e trocar equipamento", "Início, fim e falas repetidas"],
      ["Plataforma de voto indisponível", "Não coletar votos paralelos sem regra", "Decisão da mesa e retomada"],
      ["Internet do local caiu", "Ativar conexão alternativa", "Impacto nos dois canais"],
      ["Participante isolado desconectou", "Oferecer suporte e registrar retorno", "Itens em que esteve presente"],
    ]} />

    <h2 id="ata">Ata e registros finais</h2>
    <p>A ata informa modalidade híbrida, canais, convocação, mesa, presença consolidada, quórum por item, propostas, resultados, abstenções e ocorrências técnicas relevantes. Não precisa narrar cada clique, mas deve permitir compreender se os direitos foram preservados.</p>
    <p>Guarde edital, documentos apresentados, lista versionada, procurações, memória de cálculo e relatórios com acesso e retenção definidos. Gravação integral não é substituto da ata e deve ser avaliada à luz da necessidade e da <Link href="/pt/seguranca-e-criptografia/lgpd-para-condominios">LGPD</Link>.</p>
    <h3>Roteiro minuto a minuto</h3>
    <p>Noventa minutos antes, equipe técnica liga equipamentos e verifica contingência. Sessenta minutos antes, abre credenciamento presencial e remoto. Quinze minutos antes, reconcilia procurações e duplicidades. Na chamada, a presidência recebe o total consolidado, anuncia a base e registra se pode instalar.</p>
    <p>Em cada item, a secretaria apresenta documentos, o moderador unifica falas, a presidência formula a proposta e o operador congela a presença. A votação abre pelo mesmo período nos dois canais. Após o encerramento, a equipe confere totais antes do anúncio. Entre itens, processa entradas e saídas.</p>
    <p>No fim, a presidência resume decisões e informa próximos passos. A equipe salva relatórios, reconcilia a lista, registra falhas e prepara a ata. Dentro do prazo interno, responsáveis revisam o pacote, revogam acessos temporários e respondem incidentes ou impugnações.</p>
    <h3>Acessibilidade e inclusão</h3>
    <p>Verifique legenda, contraste, tamanho de fonte, leitura de documentos, acesso por teclado e possibilidade de acompanhante quando cabível. No local, cuide de rota e assentos; no remoto, envie instruções em linguagem simples. Acessibilidade não deve ser tratada como suporte excepcional solicitado durante o voto.</p>
    <p>Ofereça teste prévio sem exigir que o condômino exponha sua escolha ou documentos em grupo. Durante a reunião, mantenha canal de suporte separado do debate. Registre barreiras relatadas e melhore o procedimento seguinte.</p>
    <h3>Governança da equipe</h3>
    <p>Defina quem pode alterar cadastro, liberar voto, ver escolhas individualizadas, exportar relatórios e encerrar a reunião. Evite que uma única pessoa acumule configuração, votação e conferência sem revisão. Contas individuais e registros de alteração apoiam responsabilização.</p>
    <p>Faça uma reunião de retrospectiva: o áudio funcionou? Houve duplicidade? Quanto tempo levou o credenciamento? Participantes remotos conseguiram falar? Transforme respostas em ajustes do regimento operacional, sem esconder ocorrências relevantes.</p>
    <h3>Comunicação antes e depois</h3>
    <p>Envie lembrete com links, endereço, horário, documentos e canal de suporte, evitando anexos com dados desnecessários. Oriente quem representa várias unidades e quem pretende trocar de canal. Uma sessão de teste deve validar acesso, não antecipar decisões ou constranger participantes.</p>
    <p>Após a assembleia, comunique resultados e disponibilidade da ata pelos canais previstos. Não distribua a lista operacional completa quando um resumo atende à transparência. Explique onde enviar correção ou impugnação e preserve a versão que fundamentou cada resultado.</p>
    <h3>Capacidade da sala e do atendimento</h3>
    <p>Dimensione assentos, equipamentos, licenças e equipe para o público convocado, não apenas para a média histórica. Filas de credenciamento no local e suporte remoto congestionado podem atrasar a instalação e impedir correções antes do voto.</p>
    <p>Separe suporte técnico de decisões de aptidão. A equipe técnica ajuda a acessar; a secretaria confere cadastro e documentos; a presidência resolve o procedimento. Essa separação evita que alguém sem autoridade aprove procurações ou altere quórum sob pressão.</p>
    <h3>Ensaio com casos adversos</h3>
    <p>Além do caminho ideal, simule dois participantes para a mesma unidade, procuração limitada, pessoa sem celular, queda do áudio, voto não enviado e troca do remoto para a sala. A equipe deve executar o procedimento previsto e anotar dúvidas.</p>
    <p>O ensaio produz uma lista de decisões: quem bloqueia duplicidade, quem autoriza credenciamento tardio, quem declara pausa e quem confere o resultado. Publicar internamente essas responsabilidades reduz ordens conflitantes durante uma reunião tensa.</p>

    <h2 id="erros-hibrida">Erros comuns</h2>
    <ul><li>Manter listas presencial e online sem deduplicação.</li><li>Permitir papel e digital para a mesma unidade.</li><li>Usar áudio que o remoto não compreende.</li><li>Ignorar chat e pedidos de fala online.</li><li>Projetar dados pessoais ou financeiros.</li><li>Não atualizar entradas, saídas e trocas de canal.</li><li>Aplicar quórum inicial a todos os itens.</li><li>Improvisar votação por mensagem durante falha.</li><li>Não ensaiar o fluxo completo.</li><li>Prometer que a tecnologia garante validade.</li></ul>

    <h2 id="checklist">Checklist operacional</h2>
    <Checklist items={["Validar lei, convenção, regimento e pauta", "Redigir edital específico para o híbrido", "Definir equipe e papéis", "Atualizar cadastro e procurações", "Escolher uma lista de presença oficial", "Planejar troca de canal sem duplicidade", "Testar áudio bidirecional e documentos", "Usar mecanismo único de votação quando possível", "Sincronizar quórum por item", "Preparar contingência técnica", "Registrar ocorrências e resultados", "Revisar ata, acesso e retenção"]} />

    <h2 id="faq">Perguntas frequentes</h2>
    <h3>Assembleia híbrida é permitida?</h3><p>O Código Civil admite participação eletrônica sob condições. Confirme ausência de vedação convencional, preservação de direitos e demais formalidades.</p>
    <h3>Preciso disponibilizar computador no local?</h3><p>Não há resposta universal, mas todos os presentes precisam de meio efetivo de votar. Planeje estações ou método controlado se nem todos possuem dispositivo.</p>
    <h3>Posso somar cédulas e votos online?</h3><p>É possível desenhar reconciliação, mas o risco de duplicidade e quebra de sigilo aumenta. Um mecanismo único tende a ser mais controlável.</p>
    <h3>Como contar quem está em dois dispositivos?</h3><p>Conte a unidade/representação uma vez. Dispositivos são canais, não eleitores.</p>
    <h3>O que fazer se a internet cair?</h3><p>Aplique o plano comunicado, suspenda atos que dependem da participação e registre impacto e decisão. Não improvise silenciosamente.</p>
    <h3>A reunião deve ser gravada?</h3><p>Não automaticamente. Avalie finalidade, necessidade, transparência, acesso e retenção. A ata e os registros de votação continuam essenciais.</p>
    <h3>Como fazer voto secreto?</h3><p>Use mecanismo que confirme elegibilidade e unicidade sem divulgar a escolha. Restrinja registros individualizados e valide regras do caso.</p>
    <h3>A Allecto conduz a parte presencial?</h3><p>O conteúdo não promete serviço operacional presencial. A plataforma apoia recursos digitais; equipe, infraestrutura e procedimento continuam a cargo do organizador.</p>
  </>,
};

export const lgpdContent: ArticleContent = {
  directAnswer: "Em geral, a LGPD alcança as operações do condomínio que usam dados de pessoas identificadas ou identificáveis. Adequação exige conhecer finalidades e fluxos, definir papéis e bases legais, limitar acesso, contratar fornecedores com critérios, atender titulares, reter somente o necessário e responder a incidentes — não apenas obter consentimentos.",
  sections: [
    ["aplicacao", "A LGPD se aplica?"], ["dados-pessoais", "Dados pessoais tratados"], ["sensiveis", "Dados sensíveis"], ["papeis", "Papéis dos agentes"], ["bases", "Bases legais"], ["consentimento", "Consentimento"], ["inventario", "Inventário de dados"], ["acesso", "Permissões e acesso"], ["fornecedores", "Fornecedores"], ["cameras", "Câmeras e controle de acesso"], ["assembleias", "Assembleias e votações"], ["titulares", "Direitos dos titulares"], ["retencao", "Retenção e descarte"], ["incidentes", "Resposta a incidentes"], ["contratos", "Checklist contratual"], ["erros-lgpd", "Erros comuns"], ["plano", "Plano de implementação"], ["faq", "Perguntas frequentes"],
  ].map(([id, label]) => ({ id, label })),
  sources: [
    { label: "Lei Geral de Proteção de Dados — Lei nº 13.709/2018, texto compilado", href: LGPD },
    { label: "ANPD — Guia sobre agentes de tratamento e encarregado", href: ANPD_AGENTS },
    { label: "ANPD — Guia de segurança para agentes de pequeno porte", href: ANPD_SECURITY },
    { label: "ANPD — Regulamento de Comunicação de Incidente de Segurança", href: ANPD_INCIDENTS },
  ],
  related: ["/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance", "/pt/governanca-condominial/assembleia-hibrida-condominio"],
  ctaLabel: "Conhecer a segurança da Allecto",
  body: <>
    <p>Condomínios tratam dados todos os dias: cadastro de moradores, visitantes, empregados e fornecedores; imagens; cobranças; procurações; atas; ocorrências; contatos e credenciais. A LGPD não é um projeto restrito ao software. Ela orienta desde a ficha deixada na portaria até o grupo de mensagens, o contrato da administradora e o descarte de caixas antigas.</p>
    <p>O objetivo prático é governança: saber o que existe, por que é usado, quem decide, quem acessa, com quem é compartilhado e quando deixa de ser necessário. A resposta depende de cada operação; não existe selo automático de “condomínio em conformidade”.</p>

    <h2 id="aplicacao">A LGPD se aplica aos condomínios?</h2>
    <p>A LGPD disciplina tratamento de dados pessoais por pessoas naturais ou jurídicas, públicas ou privadas, nas hipóteses de aplicação da lei. Embora a natureza jurídica do condomínio gere debates próprios, suas operações organizadas de cadastro, acesso, cobrança e gestão devem ser avaliadas sob as regras de proteção de dados. Adotar princípios, direitos e medidas de segurança é uma abordagem prudente de governança.</p>
    <p>“Tratamento” é amplo: coletar, receber, consultar, usar, compartilhar, armazenar, arquivar, alterar e eliminar. Assim, uma planilha local, câmera, livro de portaria ou e-mail pode integrar o escopo. Dados de pessoa jurídica não são, por si, dados pessoais, mas nome, telefone e e-mail de seu representante podem ser.</p>
    <p>O mapeamento deve considerar também empregados, candidatos, prestadores e visitantes, não apenas proprietários. Para casos controversos, obtenha orientação especializada.</p>

    <h2 id="dados-pessoais">Dados pessoais tratados pelo condomínio</h2>
    <DataTable headers={["Processo", "Exemplos", "Pergunta de necessidade"]} rows={[
      ["Cadastro", "Nome, contato, unidade, vínculo", "Todos os campos têm finalidade definida?"],
      ["Cobrança", "Situação financeira, comprovantes", "Quem realmente precisa acessar?"],
      ["Portaria", "Visitante, placa, horário", "Por quanto tempo o registro é útil?"],
      ["Empregados", "Documentos trabalhistas e saúde", "Há área restrita e prazo profissional?"],
      ["Assembleias", "Presença, procurações, votos, atas", "O relatório expõe somente o necessário?"],
      ["Ocorrências", "Relatos, imagens, envolvidos", "O canal evita divulgação em grupos?"],
    ]} />
    <p>Classifique origem, formato e localização. O mesmo dado pode estar no sistema da administradora, e-mail do síndico, telefone do zelador e backup. O inventário precisa enxergar cópias e compartilhamentos, não apenas o banco principal.</p>
    <p>Minimização começa no formulário. Se a finalidade é enviar convocação, talvez nome, unidade e contato sejam suficientes; solicitar profissão, data de nascimento ou documento completo “por garantia” aumenta risco e exige justificativa.</p>

    <h2 id="sensiveis">Dados pessoais sensíveis</h2>
    <p>A LGPD define categorias sensíveis, como dados sobre saúde, biometria, origem racial ou étnica, convicção religiosa, opinião política, filiação sindical, vida sexual e dados genéticos. Condomínios podem tratar saúde em pedidos de acessibilidade, biometria no controle de acesso e informações sindicais ou médicas de empregados.</p>
    <p>Esses dados seguem hipóteses legais específicas e pedem controles reforçados. Não transforme uma justificativa médica em anexo visível a conselho inteiro se apenas a decisão administrativa é necessária. Biometria não deve ser adotada apenas por conveniência sem avaliação de necessidade, alternativas, fornecedor, segurança e retenção.</p>
    <p>Crianças e adolescentes também merecem análise própria, especialmente em cadastros de acesso, imagens de lazer e eventos. Evite listas públicas identificando rotinas.</p>

    <h2 id="papeis">Papéis do condomínio, administradora e fornecedores</h2>
    <p>Controlador é quem toma as decisões sobre finalidades e elementos essenciais do tratamento; operador trata dados em nome do controlador e conforme instruções. A ANPD ressalta que os papéis são definidos por operação, não apenas pelo rótulo contratual. Uma mesma empresa pode ser operadora em um fluxo e controladora em outro.</p>
    <p>O condomínio frequentemente define finalidades de cadastro, cobrança, segurança e assembleia. Administradora, portaria remota, contabilidade, folha, advocacia e plataformas devem ser analisadas caso a caso. Fornecedor não vira operador automaticamente, e empregados subordinados não são agentes separados.</p>
    <p>Documente quem decide, instruções, subcontratados e contatos. O encarregado atua como canal nos termos aplicáveis; agentes de pequeno porte podem ter regras diferenciadas, sem ficarem dispensados dos princípios e direitos.</p>

    <h2 id="bases">Bases legais</h2>
    <p>A LGPD oferece hipóteses legais diferentes para dados comuns e sensíveis. Em operações condominiais podem ser avaliados cumprimento de obrigação legal ou regulatória, execução de contrato ou procedimentos preliminares, exercício regular de direitos, legítimo interesse e consentimento, entre outras. A escolha exige finalidade concreta e documentação.</p>
    <p>Não selecione uma base para o condomínio inteiro. A folha de pagamento, a cobrança de cota, o cadastro de visitantes e uma campanha de imagem têm contextos diferentes. Para legítimo interesse, avalie finalidade legítima, necessidade, expectativas, impactos e salvaguardas; a ANPD possui orientação específica.</p>
    <p>Dados sensíveis não usam simplesmente as mesmas hipóteses do artigo 7º; consulte o artigo 11 e obtenha apoio profissional. A base deve refletir a prática, não servir de justificativa posterior para coleta excessiva.</p>

    <h2 id="consentimento">Por que consentimento nem sempre é a base adequada</h2>
    <p>Consentimento precisa ser livre, informado, inequívoco e associado a finalidade determinada quando ele é a base. Também pode ser revogado. Em uma relação na qual o morador não consegue recusar uma operação essencial sem prejuízo, a liberdade pode ser questionável.</p>
    <p>Além disso, muitas rotinas decorrem de obrigações, contratos ou exercício de direitos. Pedir consentimento nesses casos cria a falsa impressão de que a retirada eliminaria uma obrigação de guarda ou cobrança. O correto é avaliar a hipótese adequada e informar com transparência.</p>
    <p>Consentimento pode ser pertinente para usos opcionais específicos, mas não é um passe geral nem conserta falta de segurança, finalidade ou minimização.</p>

    <h2 id="inventario">Inventário de dados</h2>
    <p>Comece por processos, não por sistemas. Converse com síndico, administradora, portaria, RH, contabilidade, conselho e manutenção. Para cada atividade registre titular, dados, origem, finalidade, base em avaliação, acesso, destinatários, sistema, retenção, descarte e riscos.</p>
    <DataTable headers={["Campo", "Exemplo", "Ação"]} rows={[
      ["Finalidade", "Autorizar visitante", "Eliminar usos vagos como “segurança em geral”"],
      ["Origem", "Morador pelo aplicativo", "Confirmar transparência"],
      ["Acesso", "Portaria durante o turno", "Revisar perfil e desligamentos"],
      ["Compartilhamento", "Empresa de portaria remota", "Revisar contrato e suboperadores"],
      ["Retenção", "Prazo operacional validado", "Criar evento de descarte"],
      ["Risco", "Exposição de rotina familiar", "Aplicar salvaguardas"],
    ]} />
    <p>Marque planilhas pessoais, grupos de mensagens e papel. Priorize fluxos com biometria, saúde, finanças, crianças, grande volume ou monitoramento. Atualize o inventário quando entrar um fornecedor ou tecnologia.</p>

    <h2 id="acesso">Permissões e controle de acesso</h2>
    <p>Aplique menor privilégio: cada função acessa somente o necessário. Conselho não precisa necessariamente ver todos os documentos trabalhistas; portaria não precisa de histórico financeiro; fornecedor técnico não precisa da base completa de moradores. Perfis devem ser traduzidos em permissões concretas.</p>
    <p>Use contas individuais, senhas fortes e autenticação adicional quando disponível. Remova acesso no desligamento e revise periodicamente usuários, links compartilhados, caixas de e-mail e dispositivos. Senha coletiva impede responsabilização e se espalha além do controle.</p>
    <p>O repositório da Allecto comprova controle de documentos por organização, assembleia, papel e usuário, além de tokens de visualização de curta duração. Este guia não promete padrões específicos de criptografia, certificação LGPD ou segurança absoluta.</p>

    <h2 id="fornecedores">Compartilhamento com fornecedores</h2>
    <p>Antes de compartilhar, confirme finalidade, dados mínimos e papel do destinatário. Faça diligência proporcional: segurança, histórico, contatos de incidente, subcontratação, localização, eliminação e capacidade de atender solicitações.</p>
    <p>O contrato deve refletir instruções, confidencialidade, controles, comunicação de incidente, cooperação com titulares, retorno/eliminação e evidências. Cláusula genérica dizendo “cumpre a LGPD” não substitui responsabilidades operacionais.</p>
    <p>Ao encerrar o serviço, revogue acessos, exporte o necessário e obtenha tratamento para cópias remanescentes. O condomínio deve saber onde seus dados continuam armazenados.</p>

    <h2 id="cameras">Câmeras e controle de acesso</h2>
    <p>Câmeras coletam imagens e rotinas. Defina finalidade, ângulo, responsáveis, acesso, prazo e procedimento para solicitações. Evite áreas de intimidade e compartilhamento informal em grupos. Exportações para investigação precisam de autorização e registro.</p>
    <p>Controle de acesso pode envolver placa, documento, foto ou biometria. Compare alternativas menos invasivas. Informe moradores e visitantes de forma adequada e avalie acessibilidade e contingência. Uma falha biométrica não deve deixar alguém sem procedimento seguro.</p>
    <p>Logs ajudam a investigar, mas guardar indefinidamente aumenta exposição. Retenção depende de finalidade, riscos, contratos e obrigações; estabeleça descarte seguro e suspensão quando houver incidente ou disputa.</p>

    <h2 id="assembleias">Dados de assembleias e votações</h2>
    <p>Editais, listas, procurações, chats, votos, atas e relatórios contêm dados pessoais. Separe transparência condominial de exposição pública. A ata deve registrar decisões sem reproduzir documentos de identidade, contatos ou detalhes desnecessários de conflitos.</p>
    <p>Em votação aberta, informe o que será visível. Em votação secreta, restrinja associação entre pessoa e escolha conforme o desenho adotado. Dados de aptidão financeira devem ficar com equipe autorizada, mesmo quando influenciam voto.</p>
    <p>Gravação não deve ser padrão sem avaliação. Defina finalidade, informação aos participantes, acesso, prazo e descarte. Consulte o guia sobre <Link href="/pt/governanca-condominial/assembleia-hibrida-condominio">assembleia híbrida</Link> para integrar privacidade ao procedimento.</p>

    <h2 id="titulares">Direitos dos titulares</h2>
    <p>O artigo 18 prevê direitos como confirmação de tratamento, acesso, correção, informação sobre compartilhamento e outras providências nas condições legais. Nem todo pedido implica entrega irrestrita ou eliminação imediata: direitos de terceiros, obrigações e exercício regular de direitos precisam ser considerados.</p>
    <p>Crie canal, autenticação, triagem, responsável, prazos e modelos de resposta. Registre pedido, decisão, buscas realizadas, terceiros consultados e entrega. Evite enviar uma base completa por e-mail sem verificar identidade e segurança.</p>
    <p>Explique negativas ou limitações em linguagem clara e indique o canal adequado. O processo deve alcançar fornecedores que guardam dados em nome do condomínio.</p>

    <h2 id="retencao">Retenção e descarte</h2>
    <p>Guardar tudo “por segurança” contraria a minimização e amplia o impacto de incidentes. Apagar tudo após a troca de síndico destrói memória e pode prejudicar obrigações e defesa. Crie uma tabela por categoria, fundamento, evento inicial, fase ativa, arquivo, acesso e destinação.</p>
    <p>Prazos legais, contratuais e prescricionais devem ser validados por assessorias competentes. Suspenda descarte quando houver litígio, auditoria, sinistro, investigação ou solicitação pendente. Veja o <Link href="/pt/gestao-de-documentos/modelo-politica-gestao-retencao-documentos-condominio-templates-checklist-compliance">modelo de política de retenção</Link>.</p>
    <p>Descarte papel por fragmentação compatível e dados digitais por exclusão controlada, incluindo cópias e integrações quando aplicável. Registre autorização e execução sem manter o conteúdo eliminado.</p>

    <h2 id="incidentes">Resposta a incidentes</h2>
    <p>Incidente pode envolver acesso indevido, perda, alteração, indisponibilidade ou divulgação. Prepare canais para que portaria e fornecedores reportem rapidamente. O plano deve conter triagem, contenção, preservação de evidências, avaliação de titulares/dados/impactos, decisão de comunicação, recuperação e lições aprendidas.</p>
    <p>O Regulamento de Comunicação de Incidente de Segurança da ANPD disciplina quando incidentes com risco ou dano relevante devem ser comunicados pelo controlador à ANPD e aos titulares, inclusive prazo regulatório. Não aplique automaticamente todo incidente como notificável nem deixe a decisão sem responsável. Consulte a regra vigente e assessoria.</p>
    <p>Não apague logs para “resolver” o problema. Preserve evidências com acesso restrito, contenha credenciais e documente horários e decisões. Mensagens aos titulares devem ser claras, úteis e não especulativas.</p>
    <h3>Exemplo de triagem</h3>
    <p>Um e-mail com planilha de moradores foi enviado ao destinatário errado. A equipe registra horário, remetente, dados, quantidade e destinatário; solicita exclusão sem depender apenas dessa confirmação; revoga link quando possível; preserva evidências; avalia se houve acesso e quais danos podem decorrer. O responsável decide medidas e comunicações com base no regulamento e documenta o raciocínio.</p>
    <p>Compare com indisponibilidade temporária de um sistema sem acesso indevido. Ainda é um incidente a tratar operacionalmente, mas natureza, titulares afetados e risco são diferentes. A classificação evita respostas automáticas e permite priorizar contenção.</p>
    <h3>Programa de treinamento</h3>
    <p>Treinamento deve refletir tarefas. Portaria pratica conferência sem fotografar documentos no telefone pessoal; conselho aprende a usar repositório restrito; administradora reconhece solicitação de titular; síndico exercita decisão de incidente. Um vídeo anual genérico não substitui rotinas e simulações.</p>
    <p>Inclua phishing, links públicos, impressão, descarte, tela compartilhada, troca de gestão e comunicação de falhas. Registre presença e dúvidas. Reforce que reportar rapidamente um erro é melhor do que ocultá-lo.</p>
    <h3>Indicadores de acompanhamento</h3>
    <p>Use métricas simples: acessos antigos removidos, fornecedores revisados, pedidos recebidos/respondidos, incidentes por causa, documentos sem prazo, treinamentos e testes de recuperação. Indicadores servem para priorizar; não devem virar nota artificial de conformidade.</p>
    <p>Revise trimestralmente itens críticos e anualmente o inventário completo, ajustando a frequência ao risco. Mudança de administradora, câmera, biometria, plataforma ou processo de assembleia deve disparar revisão extraordinária.</p>
    <h3>Transparência e avisos de privacidade</h3>
    <p>O aviso deve responder, em linguagem adequada ao público, quem trata os dados, para quais finalidades, quais compartilhamentos relevantes existem, como exercer direitos e onde encontrar informações adicionais. Não precisa revelar detalhes que comprometam segurança, mas não deve esconder práticas atrás de frases genéricas.</p>
    <p>Use avisos por contexto: portaria, câmeras, cadastro, empregados e assembleia podem exigir informações diferentes. Uma política extensa no site não substitui sinalização no momento da coleta. Mantenha versões e data de vigência para demonstrar o que foi informado.</p>
    <h3>Qualidade e atualização dos dados</h3>
    <p>Dados desatualizados prejudicam privacidade e operação: convite vai ao antigo morador, visitante permanece autorizado, cobrança chega ao contato errado. Crie confirmação periódica e canal de correção, registrando a fonte sem aceitar alterações sensíveis sem autenticação.</p>
    <p>Na troca de titular ou locatário, encerre vínculos antigos e preserve apenas o que tiver fundamento. Não simplesmente copie cadastros para uma nova planilha. Sistemas e fornecedores precisam receber a atualização de modo coordenado.</p>
    <h3>Privacidade desde o desenho</h3>
    <p>Antes de implantar um processo, pergunte se a finalidade pode ser atingida com menos dados, acesso menor ou prazo mais curto. Configure opções restritivas como padrão: links não públicos, relatórios sem identificadores excessivos e permissões concedidas por função.</p>
    <p>Para iniciativas de maior risco, documente avaliação mais aprofundada e salvaguardas. A LGPD prevê relatório de impacto em certos contextos e a ANPD pode solicitá-lo; a necessidade e o conteúdo devem ser avaliados profissionalmente.</p>
    <h3>Prestação de contas e evidências</h3>
    <p>O princípio da responsabilização pede demonstração de medidas eficazes. Guarde decisões de finalidade e base, revisões de acesso, treinamentos, contratos, testes, respostas a titulares e avaliações de incidentes. Evidência não significa acumular dados pessoais sem limite; registre o controle realizado com o mínimo necessário.</p>
    <p>Apresente periodicamente ao conselho ou instância competente um panorama sem expor titulares: riscos prioritários, fornecedores pendentes, incidentes, pedidos e plano de melhoria. A governança ganha continuidade na troca de síndico e deixa de depender da memória de uma pessoa.</p>

    <h2 id="contratos">Checklist contratual</h2>
    <Checklist items={["Descrever serviço, finalidade e categorias de dados", "Definir papéis por operação", "Registrar instruções e usos proibidos", "Exigir confidencialidade e controle de acesso", "Conhecer subcontratados relevantes", "Definir comunicação e cooperação em incidentes", "Apoiar solicitações de titulares", "Tratar segurança e evidências proporcionais", "Definir retenção, devolução e eliminação", "Planejar transição e revogação de acessos", "Prever auditoria ou comprovação compatível com o risco"]} />

    <h2 id="erros-lgpd">Erros comuns</h2>
    <ul><li>Acreditar que uma política pronta garante conformidade.</li><li>Pedir consentimento para todas as operações.</li><li>Manter cadastro sem finalidade ou revisão.</li><li>Compartilhar listas em grupos abertos.</li><li>Usar contas e senhas coletivas.</li><li>Expor inadimplência ou documentos em tela.</li><li>Comprar biometria sem análise de necessidade.</li><li>Confiar apenas em cláusula genérica do fornecedor.</li><li>Não remover ex-gestores.</li><li>Guardar imagens e logs indefinidamente.</li><li>Não ter canal para titulares e incidentes.</li><li>Prometer “100% seguro” ou “compliance garantido”.</li></ul>

    <h2 id="plano">Plano de implementação</h2>
    <h3>Primeiros 30 dias: conhecer e conter</h3><p>Nomeie responsáveis, crie canal, inventarie processos críticos, remova acessos antigos e interrompa compartilhamentos evidentemente excessivos. Liste fornecedores e incidentes abertos.</p>
    <h3>De 31 a 60 dias: decidir e documentar</h3><p>Defina papéis, finalidades, bases em avaliação, avisos, perfis e tabela de retenção. Revise contratos prioritários e treine portaria, administração e conselho.</p>
    <h3>De 61 a 90 dias: testar e melhorar</h3><p>Simule solicitação de titular e incidente, confirme restauração quando houver backup, execute revisão de acessos e teste descarte. Registre pendências e estabeleça ciclo periódico.</p>
    <Checklist items={["Patrocínio do síndico e responsabilidades", "Inventário de processos e sistemas", "Mapa de fornecedores e compartilhamentos", "Bases e transparência por finalidade", "Perfis, contas e revisão de acessos", "Canal e procedimento de titulares", "Tabela de retenção e legal hold", "Plano e simulação de incidentes", "Treinamento recorrente", "Revisão após mudanças"]} />

    <h2 id="faq">Perguntas frequentes</h2>
    <h3>Condomínio precisa de consentimento de todos?</h3><p>Não para toda operação. A base depende da finalidade e das hipóteses legais. Consentimento inadequado pode gerar falsa expectativa de escolha.</p>
    <h3>O síndico é pessoalmente o controlador?</h3><p>Os papéis são avaliados institucionalmente e por operação. O condomínio costuma tomar decisões; o síndico atua em sua administração. Casos concretos merecem orientação.</p>
    <h3>A administradora é sempre operadora?</h3><p>Não. Ela pode seguir instruções em um fluxo e tomar decisões próprias em outro. Contrato e prática real importam.</p>
    <h3>Posso publicar lista de inadimplentes?</h3><p>Transparência financeira não autoriza exposição irrestrita. Restrinja acesso e avalie forma necessária com assessoria.</p>
    <h3>Câmeras precisam de consentimento?</h3><p>Não presuma uma base única. Defina finalidade, proporcionalidade, transparência, acesso e retenção e avalie a hipótese legal adequada.</p>
    <h3>Todo incidente deve ser comunicado à ANPD?</h3><p>O regulamento considera risco ou dano relevante e atribui decisão ao controlador. Registre a avaliação e siga os requisitos vigentes.</p>
    <h3>Pedido de eliminação obriga apagar tudo?</h3><p>Não automaticamente. Obrigações, exercício de direitos e direitos de terceiros podem justificar conservação. Responda de modo fundamentado.</p>
    <h3>Quanto tempo guardar imagens?</h3><p>Não há prazo universal para todo condomínio. Defina período proporcional à finalidade e suspenda descarte quando houver ocorrência relevante.</p>
    <h3>Backup é arquivo?</h3><p>Não. Backup apoia recuperação; arquivo atende retenção e consulta. Ambos precisam de acesso, ciclo e descarte coerentes.</p>
    <h3>Uma plataforma torna o condomínio adequado?</h3><p>Não. Tecnologia apoia controles; governança, contratos, decisões, treinamento e resposta continuam necessários.</p>
  </>,
};

export const ARTICLE_CONTENTS = {
  "assembleia-condominial-online-e-valida": onlineAssemblyContent,
  "quorum-assembleia-condominio": quorumContent,
  "votacao-por-fracao-ideal-condominio": fractionContent,
  "assembleia-hibrida-condominio": hybridContent,
  "lgpd-para-condominios": lgpdContent,
} satisfies Record<string, ArticleContent>;
