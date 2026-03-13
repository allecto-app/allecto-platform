# POLITICA DE RETENCAO E DESCARTE DE DADOS PESSOAIS (MODELO)

Status: modelo para revisao juridica  
Versao: 1.0  
Data: 13/03/2026  
Classificacao: uso interno

## 1. Objetivo

Estabelecer regras de retencao, anonimização e descarte de dados pessoais tratados pela plataforma Allecto, em conformidade com a LGPD e com as necessidades operacionais e legais do contexto condominial.

## 2. Escopo

Aplica-se a todos os dados pessoais tratados nos modulos:
- cadastro de moradores e unidades
- autenticacao e seguranca
- convites e onboarding
- comunicacoes/notificacoes
- assembleias e votacoes
- suporte e auditoria
- cobranca e faturamento

## 3. Diretrizes Gerais

- Retencao deve ser limitada ao minimo necessario para cada finalidade.
- Ao fim da finalidade, dados devem ser eliminados ou anonimizados, salvo obrigacao legal/regulatoria ou defesa de direitos.
- Dados historicos essenciais para integridade de deliberacoes (ex.: historico de votos) devem ser preservados sem PII sempre que possivel.
- Alteracoes de prazo devem ter aprovacao de Juridico + DPO + Seguranca/Tech.

## 4. Prazos de Retencao (base inicial tecnica)

Observacao: os prazos abaixo sao referencia inicial e devem ser validados juridicamente antes de homologacao final.

| Categoria/Alvo | Prazo padrao | Regra operacional |
|---|---|---|
| OTPs (`otps`) | 30 dias | Remover apos consumo/expiracao + prazo de auditoria tecnica |
| Convites (`invites`) | 90 dias | Remover apos expiracao/revogacao/uso, respeitando janela de suporte |
| Tentativas de login (`loginAttempts`) | 180 dias | Manter para seguranca e analise de abuso |
| Sessoes (`sessions`) | 180 dias | Remover sessoes expiradas/revogadas apos janela de investigacao |
| Reset de senha (`passwordResets`) | 30 dias | Remover apos uso/expiracao |
| Leituras de notificacao (`notificationReads`) | 365 dias | Manter historico de lembretes de leitura por periodo operacional |
| Eventos de seguranca (`securityEvents`) | 365 dias | Manter para resposta a incidentes e auditoria |

## 5. Base Legal e Excecoes

- A retencao pode ser estendida quando necessaria para:
- cumprimento de obrigacao legal/regulatoria
- exercicio regular de direitos em processo judicial, administrativo ou arbitral
- prevencao a fraude e seguranca do titular e do sistema

Excecoes devem ser registradas com:
- justificativa
- base legal aplicavel
- prazo revisado
- responsavel aprovador

## 6. Execucao Tecnica (Purge/Anonimizacao)

A plataforma possui rotina automatizada de retencao com:
- execucao diaria agendada (cron)
- modo `dry-run` para simulacao de impacto
- execucao real com limite por categoria
- log de execucoes para trilha de auditoria
- suporte a politica global e override por condominio (quando aprovado)

Controles minimos:
- acesso restrito a perfil administrativo autorizado
- registro de quem alterou politica e quem disparou execucao
- revisao periodica dos resultados e ajustes de prazo

## 7. Anonimizacao e Preservacao de Historico

Quando houver necessidade de preservar historico sem identificacao:
- remover ou substituir identificadores diretos (nome, email, telefone etc.)
- eliminar campos textuais livres com risco de PII (quando aplicavel)
- manter apenas dados necessarios para consistencia historica e auditoria

Exemplo aplicado:
- historico de votacao pode ser preservado para integridade de resultados, com dados pessoais anonimizados.

## 8. Direitos dos Titulares e Atendimento

Em solicitacoes de titulares (acesso/correcao/eliminacao):
- validar identidade do solicitante
- mapear dados por modulo/tabela
- executar eliminacao ou anonimização quando cabivel
- registrar evidencias de atendimento

Canal oficial LGPD: `[preencher]`  
SLA interno de resposta: `[preencher]`

## 9. Governanca e Responsabilidades

- Dono do processo: `[DPO/Privacidade]`
- Responsavel tecnico: `[Tech Lead/SecOps]`
- Aprovacao juridica: `[Juridico]`
- Revisao ordinaria: trimestral
- Revisao extraordinaria: nova funcionalidade, novo operador, incidente relevante ou mudanca normativa

## 10. Registro de Alteracoes desta Politica

| Versao | Data | Alteracao | Responsavel | Aprovacao |
|---|---|---|---|---|
| 1.0 | 13/03/2026 | Emissao inicial | `[preencher]` | `[pendente]` |

## 11. Assinaturas

Elaboracao: `[nome/cargo]` - Assinatura: __________________  
Revisao Juridica: `[nome/cargo]` - Assinatura: __________________  
Aprovacao Final: `[nome/cargo]` - Assinatura: __________________

---

Nota: este documento e modelo interno e nao substitui parecer juridico formal.
