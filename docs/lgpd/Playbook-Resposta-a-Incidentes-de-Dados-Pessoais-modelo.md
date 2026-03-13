# PLAYBOOK DE RESPOSTA A INCIDENTES DE DADOS PESSOAIS (MODELO)

Status: rascunho inicial para startup  
Versao: 1.0  
Data: 13/03/2026  
Classificacao: uso interno

## 1. Objetivo

Definir um procedimento pratico para detectar, conter, investigar, comunicar e encerrar incidentes envolvendo dados pessoais na plataforma.

## 2. Escopo

Aplica-se a qualquer evento com potencial de:
- acesso nao autorizado a dados pessoais
- vazamento/exposicao indevida
- perda, alteracao ou indisponibilidade relevante de dados pessoais
- uso indevido de credenciais/sessoes

## 3. Time de Resposta (preencher)

- Incident Lead: `[nome/cargo]`
- Tech Lead/SecOps: `[nome/cargo]`
- Juridico/DPO: `[nome/cargo]`
- Comunicacao/Atendimento: `[nome/cargo]`
- Backup de plantao: `[nome/cargo]`

Canal interno de crise: `[Slack/WhatsApp/Email]`

## 4. Classificacao de Severidade

- `SEV-1` Critico:
  - dados sensiveis ou grande volume afetado, risco alto ao titular, incidente em curso.
  - acao imediata e mobilizacao total.
- `SEV-2` Alto:
  - exposicao relevante, escopo delimitado, impacto moderado/alto.
- `SEV-3` Medio:
  - risco limitado, sem evidencia de exfiltracao, impacto controlavel.
- `SEV-4` Baixo:
  - falso positivo ou evento sem impacto efetivo em dados pessoais.

## 5. Fluxo Operacional

### 5.1 Deteccao e Abertura

1. Registrar incidente com:
- data/hora da deteccao
- origem do alerta
- sistema/modulo afetado
- descricao inicial
2. Atribuir severidade inicial e owner.

### 5.2 Contencao Imediata

Checklist tecnico:
- revogar sessoes/tokens comprometidos
- rotacionar segredos/chaves
- bloquear endpoint/usuario/IP suspeito
- desabilitar funcionalidade de risco (se necessario)
- preservar evidencias (logs, snapshots, queries)

### 5.3 Investigacao

Checklist:
- identificar vetor de ataque/falha
- delimitar janela temporal
- mapear dados potencialmente afetados (categorias e quantidade)
- identificar titulares/condominios afetados
- confirmar se incidente persiste

### 5.4 Avaliacao Juridica e de Notificacao

Juridico/DPO avalia:
- risco ou dano relevante aos titulares
- obrigatoriedade de comunicacao a ANPD
- necessidade de comunicacao aos titulares
- conteudo minimo da comunicacao

### 5.5 Comunicacao

Se aplicavel:
- preparar comunicacao ANPD
- preparar comunicacao aos titulares afetados
- registrar data/hora, canal e conteudo enviado

### 5.6 Recuperacao

- corrigir causa raiz
- restaurar operacao com monitoramento reforcado
- validar integridade dos dados

### 5.7 Encerramento e Pos-incidente

- documentar RCA (root cause analysis)
- registrar acoes corretivas/preventivas com prazo e dono
- atualizar politicas, controles e backlog tecnico
- conduzir retrospectiva curta (30-60 min)

## 6. Critérios Minimos para Notificar ANPD/Titulares

Notificar quando houver indicio de risco/dano relevante aos titulares, considerando:
- natureza/categoria dos dados
- volume de titulares afetados
- facilidade de identificacao dos titulares
- medidas tecnicas de mitigacao aplicadas
- possibilidade de fraude, discriminacao ou prejuizo material/moral

Observacao: decisao final deve ser validada por Juridico/DPO.

## 7. Evidencias Obrigatorias por Incidente

- timeline de eventos
- logs tecnicos relevantes
- decisoes tomadas (quem aprovou e quando)
- escopo final do impacto
- comprovantes de comunicacao (quando houver)
- plano de remediacao e status

## 8. Templates Operacionais

### 8.1 Registro Inicial do Incidente

- ID do incidente: `[INC-YYYYMMDD-XX]`
- Data/hora de abertura:
- Reportado por:
- Severidade inicial:
- Sistemas afetados:
- Hipotese inicial:
- Owner:

### 8.2 Atualizacao de Status (interno)

- Hora:
- Situacao atual:
- Acoes executadas:
- Risco atual:
- Proximo checkpoint:

### 8.3 Rascunho de Comunicacao ao Titular (modelo curto)

Assunto: Aviso de incidente de seguranca de dados  
Corpo:
- O que ocorreu (linguagem clara)
- Quais dados podem ter sido afetados
- Medidas ja adotadas
- Recomendacoes ao titular
- Canal de suporte/encarregado

### 8.4 Rascunho de Comunicacao ANPD (modelo curto)

- identificacao do controlador
- descricao do incidente
- dados/titulares potencialmente afetados
- medidas tecnicas e administrativas adotadas
- riscos relacionados ao incidente
- plano de mitigacao/remediacao

## 9. SLA Interno Sugerido (startup)

- Triage inicial: ate 1h
- Contencao inicial: ate 4h (SEV-1/2)
- Avaliacao juridica preliminar: ate 24h
- Relatorio pos-incidente: ate 5 dias uteis

## 10. Manutencao do Playbook

- Revisao trimestral ou apos incidente relevante
- Simulado rapido semestral (tabletop)
- Dono do documento: `[preencher]`

## 11. Registro de Versoes

| Versao | Data | Alteracao | Responsavel | Aprovacao |
|---|---|---|---|---|
| 1.0 | 13/03/2026 | Emissao inicial | `[preencher]` | `[pendente]` |

---

Nota: modelo interno inicial, nao substitui parecer juridico formal.
