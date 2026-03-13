# REGISTRO DE OPERACOES DE TRATAMENTO DE DADOS PESSOAIS (ROPA)

## ALLECTO - PLATAFORMA DE GESTAO CONDOMINIAL

Versao: 1.0 (Rascunho inicial)  
Data: 13/03/2026  
Classificacao: Uso interno (Governanca LGPD)  

---

## 1. Identificacao do Documento

Controlador: `[Preencher razao social]`  
CNPJ: `[Preencher]`  
Encarregado (DPO): `[Nome e contato]`  
Responsavel interno pelo ROPA: `[Nome e cargo]`  
Escopo: Operacoes de tratamento de dados pessoais na plataforma Allecto para contexto condominial.

Operadores relevantes:
- Convex (backend e banco de dados)
- Vercel/infra de hospedagem do app
- Resend (envio de email)
- Stripe (cobranca/assinatura)

---

## 2. Controle de Versoes e Aprovacao

| Versao | Data | Autor | Alteracoes | Status |
|---|---|---|---|---|
| 1.0 | 13/03/2026 | Time tecnico | Emissao inicial do inventario | Em revisao juridica |

### Aprovacoes

| Area | Responsavel | Data | Parecer |
|---|---|---|---|
| Juridico | `[Preencher]` | `[Preencher]` | `[Pendente]` |
| Seguranca/Tech | `[Preencher]` | `[Preencher]` | `[Pendente]` |
| DPO/Privacidade | `[Preencher]` | `[Preencher]` | `[Pendente]` |
| Diretoria | `[Preencher]` | `[Preencher]` | `[Pendente]` |

---

## 3. Inventario de Operacoes de Tratamento

| ID | Operacao | Titulares | Dados pessoais | Finalidade | Base legal sugerida (validar) | Compartilhamento/Operador | Retencao sugerida (validar) | Medidas de seguranca |
|---|---|---|---|---|---|---|---|---|
| 1 | Cadastro e gestao de moradores | Moradores, sindico, conselho | Nome, email, telefone, funcao, status ativo/inativo, vinculo condominio/unidade | Permitir acesso e administracao condominial | Execucao de contrato; legitimo interesse | Convex, Vercel | Enquanto relacao ativa + prazos legais/defesa | Controle de acesso por perfil, segregacao por condominio |
| 2 | Gestao de unidades e vinculos | Moradores | Codigo unidade, bloco, andar, vinculo morador-unidade, tipo de vinculo | Definir elegibilidade de voto e comunicacoes | Execucao de contrato; legitimo interesse | Convex | Enquanto necessario para operacao e historico legitimado | Validacoes de integridade e consistencia |
| 3 | Convites e onboarding | Moradores convidados | Email, nome (opcional), token hash, status, expiracao | Permitir primeiro acesso com seguranca | Execucao de contrato; legitimo interesse | Resend, Convex | Curto prazo operacional (convite expira/revoga) | Token com expiracao e hash |
| 4 | Autenticacao por OTP e sessoes | Usuarios | Email/telefone, OTP, expiracao/consumo, sessao, IP e user-agent | Autenticacao e prevencao de fraude | Execucao de contrato; seguranca/legitimo interesse | Convex, Vercel | Curto/medio prazo conforme politica de seguranca | Rate limiting, expiracao, trilhas de seguranca |
| 5 | Assembleias, atas e votacoes | Moradores votantes | Voto (unidade, residentId, escolha, comentario opcional), metadados de assembleia | Deliberacao e prova historica condominial | Obrigacao legal/regulatoria; legitimo interesse | Convex | Conforme obrigacoes condominiais e prazos prescricionais | Controle de elegibilidade, integridade historica |
| 6 | Notificacoes e leitura | Moradores | Logs de envio (canal/template/contagens) e estado de leitura por usuario | Comunicar convocacoes, lembretes e encerramento | Execucao de contrato; legitimo interesse | Convex, provedor de envio | Janela operacional + auditoria minima | Escopo por condominio, minimizacao em logs |
| 7 | Gestao documental | Moradores e administradores | Metadados de documentos, storageId, hash, eventos de visualizacao | Disponibilizar documentos oficiais com rastreabilidade | Obrigacao legal; execucao de contrato | Convex + storage provider | Conforme obrigacoes de guarda documental | Permissoes por papel/usuario, hash de integridade |
| 8 | Auditoria e seguranca | Usuarios admin/plataforma | Tentativas de login, eventos de seguranca, IP, email | Monitoracao, deteccao e resposta a incidente | Legitimo interesse; obrigacao legal de seguranca | Convex, infra | Conforme politica de seguranca e auditoria | Trilhas de eventos e controles de acesso |
| 9 | Cobranca SaaS | Administradores/financeiro | Email de cobranca, IDs Stripe, status de assinatura/fatura | Processar assinatura e cobranca | Execucao de contrato; obrigacao fiscal/contabil | Stripe | Prazos legais fiscais/contabeis | Minimizacao e segregacao por tenant |
| 10 | Importacao em lote | Moradores | Nome, email, telefone, unidade, funcao | Migracao e atualizacao cadastral | Execucao de contrato; legitimo interesse | Convex | Curto prazo para artefatos temporarios | Validacao de formato, deduplicacao |
| 11 | Suporte operacional | Moradores/administradores | Identificadores de conta e logs tecnicos necessarios | Resolver chamados e incidentes | Execucao de contrato; legitimo interesse | Ferramentas internas (preencher) | Conforme politica de suporte | Acesso por necessidade e registro de atendimento |

---

## 4. Direitos dos Titulares (fluxo interno)

Canal de solicitacoes LGPD: `[Email/Formulario]`  
SLA de resposta: `[Preencher]`

Checklist minimo:
- Confirmacao de identidade do solicitante
- Classificacao do pedido (acesso/correcao/eliminacao/oposicao etc.)
- Busca e consolidacao de dados por modulo
- Resposta ao titular dentro do prazo interno
- Registro de evidencias da solicitacao e atendimento

Fluxo operacional suportado no sistema:
- abertura de protocolo DSAR
- trilha de auditoria por evento (status, notas, acoes executadas)
- geracao de exportacao de dados do titular (access request)
- execucao formal de eliminacao/anonimização (deletion request)

---

## 5. Politica de Retencao e Descarte (a definir)

Diretriz:
- Definir prazo por categoria de dado e base legal
- Encerrar retencao quando cessar finalidade, salvo obrigacao legal/regulatoria ou defesa de direitos
- Aplicar anonimização quando possivel para preservar historico sem PII

Observacoes tecnicas atuais:
- Exclusao de morador ocorre com anonimização e preservacao de historico de votos.
- Exclusao de unidade preserva historico de votacao e bloqueia exclusao se houver moradores vinculados.
- Rotina automatizada de retencao implementada com:
- execucao diaria agendada
- modo dry-run antes da limpeza real
- registro historico de execucoes para auditoria
- politica global por categoria com possibilidade de override por condominio (quando aprovado)

Referencias internas:
- `docs/lgpd/Politica-Retencao-e-Descarte-modelo.md`
- `docs/lgpd/Anexo-Privacidade-Retencao-modelo.md`
- `docs/lgpd/Procedimento-DSAR-modelo.md`
- `docs/lgpd/Politica-Trilha-Auditoria-Administrativa-modelo.md`

---

## 6. Transferencia Internacional e Operadores

Preencher para cada fornecedor:
- Pais/regiao de processamento
- Mecanismo de transferencia internacional aplicavel
- Clausulas contratuais e DPA assinados
- Medidas tecnicas e organizacionais exigidas

---

## 7. Gestao de Incidentes com Dados Pessoais

Referencia interna: `[Politica/Playbook de incidente]`  
Fluxo minimo:
- Deteccao e classificacao
- Contencao e mitigacao
- Analise de impacto aos titulares
- Decisao de notificacao a ANPD e titulares (quando aplicavel)
- Registro de causa raiz e plano de acao

---

## 8. Plano de Acao de Adequacao (pendencias)

| Item | Descricao | Responsavel | Prazo | Status |
|---|---|---|---|---|
| A1 | Validar base legal por operacao | Juridico/DPO | `[Preencher]` | Pendente |
| A2 | Formalizar politica de retencao por tabela/processo | Juridico + Tech | `[Preencher]` | Pendente |
| A3 | Consolidar DPA com todos os operadores | Juridico | `[Preencher]` | Pendente |
| A4 | Revisar Politica de Privacidade publica | Juridico + Produto | `[Preencher]` | Pendente |
| A5 | Definir e publicar canal de direitos LGPD | DPO + Suporte | `[Preencher]` | Pendente |

---

## 9. Assinaturas

Responsavel pela elaboracao:  
Nome: `[Preencher]`  
Cargo: `[Preencher]`  
Assinatura: ____________________________  
Data: ____/____/______

Revisao juridica:  
Nome: `[Preencher]`  
OAB/area: `[Preencher]`  
Assinatura: ____________________________  
Data: ____/____/______

Aprovacao final:  
Nome: `[Preencher]`  
Cargo: `[Preencher]`  
Assinatura: ____________________________  
Data: ____/____/______

---

Nota: documento de governanca interna. Nao substitui parecer juridico formal.
