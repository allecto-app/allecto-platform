# ROPA Inicial (LGPD) - Allecto Plataforma de Condominios

Status: rascunho inicial tecnico para revisao juridica  
Data de geracao: 2026-03-13  
Base de mapeamento: codigo-fonte atual (`apps/admin`, `backend/convex`)

## 1) Identificacao do tratamento (preencher)

- Controlador: `[Razao social da empresa/condominio operador da conta]`
- CNPJ: `[preencher]`
- Encarregado (DPO): `[nome e contato]`
- Operadores principais:
- `Convex` (backend/banco)
- `Vercel/infra web` (hospedagem app)
- `Resend` (disparo de emails)
- `Stripe` (cobranca/assinatura)
- Escopo: gestao condominial (moradores, unidades, assembleias, votacoes, comunicacoes e billing SaaS)

## 2) Inventario de operacoes de tratamento

| ID | Operacao | Titulares | Dados pessoais tratados | Finalidade | Base legal sugerida (validar) | Compartilhamento/Operador | Retencao sugerida (validar) | Medidas de seguranca |
|---|---|---|---|---|---|---|---|---|
| 1 | Cadastro e gestao de moradores | Moradores, sindico, conselho | Nome, email, telefone, funcao, status ativo/inativo, condominio/unidade vinculada | Permitir acesso e administracao do condominio | Execucao de contrato; legitimo interesse (administracao condominial) | Convex (DB), Vercel (app) | Enquanto relacao ativa + prazo legal/defesa | Controle de acesso por perfil, trilhas de alteracao, minimizacao |
| 2 | Gestao de unidades e vinculos (membership) | Moradores | Codigo unidade, bloco, andar, vinculo morador-unidade, papel (proprietario/inquilino) | Organizar quem pode votar e receber comunicacoes por unidade | Execucao de contrato; legitimo interesse | Convex | Enquanto necessario para operacao e historico legitimado | Segregacao por condominio, validacoes de integridade |
| 3 | Convites de acesso e onboarding de morador | Moradores convidados | Email, nome (opcional), token hash, status do convite, expiracao, metadata minima | Habilitar primeiro acesso com seguranca | Execucao de contrato; legitimo interesse | Resend (email), Convex | Convites expirados/revogados por janela curta operacional | Token com expiracao, hash de token, revogacao |
| 4 | Autenticacao por OTP e sessao | Usuarios da plataforma | Email/telefone (quando aplicavel), OTP, expiracao/consumo, sessao, IP e user-agent | Autenticar usuario e prevenir abuso/fraude | Execucao de contrato; seguranca/legitimo interesse | Convex, Vercel | OTP curta duracao; sessoes conforme politica de seguranca | OTP com validade, hash/digest de token, rate limiting, eventos de seguranca |
| 5 | Assembleias, atas e votacoes | Moradores votantes | Registro de voto (unidade, residentId, escolha, comentario opcional), metadados da assembleia | Deliberacoes condominiais e prova historica de votacao | Cumprimento de obrigacao legal/regulatoria; legitimo interesse | Convex | Historico de votacao conforme obrigacoes condominiais e prescricionais | Regras de voto por unidade, trilha temporal, controles de consulta |
| 6 | Notificacoes e comprovacao de envio/leitura | Moradores | Logs de notificacao (canal/template/contagens), estado de leitura por usuario (`notificationReads`) | Comunicacao de assembleias, lembretes e status | Execucao de contrato; legitimo interesse | Convex, provedores de envio (email/SMS/push quando aplicavel) | Janela operacional + auditoria minima | Escopo por condominio, dados agregados nos logs |
| 7 | Gestao documental (atas/PDFs) | Moradores e administradores | Titulos de documentos, IDs de armazenamento, hashes, eventos de visualizacao (userId/data) | Disponibilizar documentos oficiais e rastreabilidade de acesso | Cumprimento de obrigacao legal; execucao de contrato | Convex + storage provider (conforme deploy) | Conforme obrigacoes de guarda documental condominial | Controle de permissao (roles/users), hash de integridade, eventos de acesso |
| 8 | Auditoria e seguranca da conta | Usuarios admin/plataforma | Tentativas de login, eventos de seguranca, IP, email (quando aplicavel) | Prevencao a fraude, investigacao e resposta a incidentes | Legitimo interesse; cumprimento de obrigacao legal (seguranca) | Convex, infra | Curto/medio prazo conforme politica de seguranca | Registro de eventos, limites de tentativa, segregacao de acesso |
| 9 | Cobranca SaaS e faturamento | Administradores/contato financeiro | Email de cobranca, IDs Stripe (customer/subscription/invoice), plano/status | Processar assinatura e cobranca da plataforma | Execucao de contrato; obrigacao legal fiscal/contabil | Stripe | Prazos legais fiscais/contabeis + defesa de direitos | Minimizacao de dados, segregacao tenant, apenas IDs financeiros necessarios |
| 10 | Importacao em lote de cadastros | Moradores | Nome, email, telefone, unidade, funcao | Migracao inicial e manutencao de base cadastral | Execucao de contrato; legitimo interesse | Convex | Arquivos/importes temporarios conforme rotina operacional | Validacoes de formato, consistencia e deduplicacao |
| 11 | Suporte operacional (manual) | Moradores/administradores | Dados estritamente necessarios para resolver chamados (identificadores de conta, logs tecnicos) | Atendimento e resolucao de problemas | Execucao de contrato; legitimo interesse | Ferramentas internas de suporte (preencher) | Conforme politica de suporte e auditoria | Acesso restrito por necessidade, registro de acoes |

## 3) Regras de minimizacao e anonimização ja observadas no sistema

- Exclusao de morador foi implementada em modo de anonimização:
- remove/vincula dados de identificacao pessoal do cadastro
- preserva historico de votos para integridade de deliberacoes
- remove comentarios de voto (quando aplicavel) para reduzir PII residual
- Exclusao de unidade foi implementada sem apagar historico de votacao:
- unidade e anonimizada e marcada como excluida
- exclusao bloqueada se ainda houver moradores vinculados
- Listagens operacionais desconsideram registros marcados como excluidos (`deletedAt`)

## 4) Pontos de validacao juridica necessarios

- Confirmar base legal principal por operacao (especialmente votos, logs e notificacoes).
- Definir politica formal de retencao por tabela/processo com prazos objetivos.
- Formalizar matriz controlador x operador por cliente/condominio.
- Confirmar necessidade de RIPD (DPIA) para operacoes de maior risco.
- Revisar textos de transparencia (politica de privacidade/termos) para refletir este inventario.
- Definir procedimento de atendimento de direitos do titular (acesso, correcao, eliminacao, oposicao, portabilidade quando cabivel).

## 5) Evidencias que devem acompanhar este ROPA

- Politica de Privacidade e Termos de Uso vigentes.
- Contratos/DPA com operadores (Convex, Resend, Stripe e demais fornecedores).
- Politica de retencao e descarte.
- Procedimento de resposta a incidentes.
- Procedimento de atendimento a solicitacoes de titulares.
- Matriz de perfil de acesso (quem acessa o que no produto e no suporte).

## 6) Dono e ciclo de revisao

- Responsavel interno pelo ROPA: `[nome/cargo]`
- Revisao recorrente: trimestral
- Revisao extraordinaria: sempre que houver nova feature com dados pessoais, novo operador, incidente relevante ou mudanca de base legal

---

Observacao: este documento e um modelo tecnico inicial e nao substitui parecer juridico.
