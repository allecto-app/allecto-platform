# PROCEDIMENTO INTERNO - ATENDIMENTO DE DIREITOS DO TITULAR (DSAR)

Status: modelo para revisao juridica  
Versao: 1.0  
Data: 13/03/2026  
Classificacao: uso interno

## 1. Objetivo

Definir o fluxo operacional para recebimento, analise, atendimento e registro de solicitacoes de titulares de dados pessoais, em conformidade com a LGPD.

## 2. Escopo

Aplica-se a solicitacoes relacionadas a titulares cadastrados na plataforma, incluindo no minimo:
- acesso/exportacao de dados
- eliminacao/anonimização de dados

## 3. Canais de Entrada

- Email LGPD: `[preencher]`
- Formulario web: `[preencher]`
- Atendimento interno com abertura manual de protocolo

Cada solicitacao deve receber protocolo unico e data/hora de abertura.

## 4. Papeis e Responsabilidades

- DPO/Privacidade: supervisionar conformidade e prazos
- Juridico: validar base legal e excecoes
- Tech/SecOps: executar exportacao, anonimização/eliminacao e evidencias tecnicas
- Suporte: comunicacao com titular e acompanhamento de status

## 5. Fluxo Operacional

1. Recebimento:
- registrar protocolo, titular, tipo de pedido, canal e prazo de resposta.

2. Validacao de identidade:
- confirmar legitimidade do solicitante antes de qualquer entrega/eliminação.

3. Classificacao:
- tipo da solicitacao (`access` ou `deletion`), escopo e dados envolvidos.

4. Analise juridica:
- identificar obrigacoes legais/regulatorias e excecoes de retencao.

5. Execucao tecnica:
- `access`: gerar export consolidado dos dados do titular.
- `deletion`: executar anonimização/eliminacao conforme politica de retencao e base legal.

6. Revisao e aprovacao:
- revisar resultado tecnico e registrar decisao final.

7. Resposta ao titular:
- enviar retorno formal com resultado, fundamentos e orientacoes.
- emitir relatorio de encerramento do protocolo (formato DOC e/ou PDF imprimivel) para arquivo interno.

8. Encerramento:
- concluir protocolo e manter trilha de auditoria.

## 6. Controles Minimos de Auditoria

Para cada protocolo DSAR, manter:
- identificador/protocolo
- tipo, status e datas relevantes
- responsavel e aprovadores
- eventos de trilha (acoes executadas, notas e justificativas)
- evidencias de exportacao/eliminacao
- relatorio final de encerramento anexado ao caso

## 7. Regras Especificas para Eliminacao

- A eliminacao deve respeitar obrigacoes legais de guarda e defesa de direitos.
- Quando necessario preservar historico sem identificacao, aplicar anonimização.
- Em contexto condominial, historico de votacao pode ser mantido sem PII para preservar integridade deliberativa.

## 8. SLA e Prazos

- Prazo interno alvo: `[preencher]`
- Escalonamento em caso de risco de prazo: `[preencher]`
- Registro de justificativa para extensao de prazo: obrigatorio

## 9. Registro de Versoes

| Versao | Data | Alteracao | Responsavel | Aprovacao |
|---|---|---|---|---|
| 1.0 | 13/03/2026 | Emissao inicial | `[preencher]` | `[pendente]` |

## 10. Assinaturas

Elaboracao: `[nome/cargo]` - Assinatura: __________________  
Revisao Juridica: `[nome/cargo]` - Assinatura: __________________  
Aprovacao Final: `[nome/cargo]` - Assinatura: __________________

---

Nota: este documento e modelo interno e nao substitui parecer juridico formal.
