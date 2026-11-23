# Sprint 3 — Documentação da Sprint

**Período:** 02/11/2026 a 22/11/2026.

**Objetivo:** completar o fluxo financeiro e de acompanhamento do sistema (faturas, comunicação com o cliente, assistente virtual, aprovação de entregas e painel administrativo) e refinar a operação diária da equipe (designação de tradutores, edição de orçamentos e convites).

**Meta da Sprint:** como a equipe não definiu um subconjunto menor, todas as User Stories abaixo são Meta, conforme a regra do Product Owner.

**Capacidade da equipe:** 68 horas de tarefas planejadas (detalhadas na seção [Tarefas da Sprint](#tarefas-da-sprint)), distribuídas entre os 5 integrantes do time, com tarefas de no máximo 4 horas, conforme o guia do Product Owner. A Sprint 3 tem 3 semanas (02/11 a 22/11/2026) e 55 pontos de história.

**Priorização:** as histórias da Sprint 3 são de prioridade Média e Baixa (ranks 19 a 24), pois as histórias de prioridade Alta (ranks 1 a 12) foram entregues nas Sprints 1 e 2. Os refinamentos da seção [Melhorias e refinamentos](#melhorias-e-refinamentos) complementam funcionalidades de prioridade Alta já existentes (designação de tradutores, orçamentos e convites) e foram planejados junto às histórias, para aumentar a qualidade do que o cliente recebe.

Checklists usados: [DoR e DoD](../dor_dod.md). Modelo de dados: [Modelagem do Banco](../modelagem_banco.md). Backlog completo do produto: [README](../../README.md#backlog).

## Backlog da Sprint

| Rank | Prioridade | User Story | Estimativa | Entrega (Pull Requests) |
|---:|---|---|---:|---|
| 19 | Média | Como cliente, quero um auxílio de bots para tirar dúvidas pontuais, para obter respostas rápidas sobre serviços, idiomas e prazos sem depender do horário de atendimento. | 13 | #57, #60, #62 |
| 20 | Média | Como financeiro, quero criar a fatura de compra referente ao pagamento de um freelancer, para formalizar o valor devido a ele. | 8 | #61 |
| 21 | Média | Como financeiro, quero criar a fatura de venda de um serviço finalizado, para ter um documento-guia para o sistema externo de nota fiscal. | 8 | #64 |
| 22 | Média | Como gestor, quero controlar as alterações dos projetos, para garantir a rastreabilidade das ações realizadas. | 13 | #65 |
| 23 | Média | Como atendente, quero enviar um email referente ao orçamento, para que o cliente tenha a confirmação do início do projeto. | 8 | #63 |
| 24 | Baixa | Como administrador, quero consultar requisições, orçamentos, ordens de serviço e financeiro, para acompanhar o desempenho do negócio. | 5 | #69 |

**Total estimado:** 55 story points (rank 19 a 24).

## Tarefas da Sprint

Tarefas técnicas, estimadas em horas, criadas no primeiro dia da Sprint. A planilha de tarefas (`Sprint_3_Tarefas.xlsx`) é a fonte do acompanhamento diário.

### US1 (rank 19) — Como cliente, quero um auxílio de bots para tirar dúvidas pontuais, para obter respostas rápidas sobre serviços, idiomas e prazos sem depender do horário de atendimento.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Integrar agente ao front da aplicação | Igor | 4h | 10/11 | 11/11 | 11/11 |
| Implementar agente de auxílio na landingpage | Igor | 6h | 06/11 | 10/11 | 11/11 |

### US2 (rank 20) — Como financeiro, quero criar a fatura de compra referente ao pagamento de um freelancer, para formalizar o valor devido a ele.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Criar fatura de pagamento em pdf | Tiago | 5h | 08/11 | 09/11 | 10/11 |
| Enviar fatura para email do freelancer | Tiago | 3h | 06/11 | 09/11 | 09/11 |

### US3 (rank 21) — Como financeiro, quero criar a fatura de venda de um serviço finalizado, para ter um documento-guia para o sistema externo de nota fiscal.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Criar fatura de pagamento em pdf | Igor | 5h | 14/11 | 15/11 | 16/11 |
| Enviar fatura para email do cliente | Igor | 3h | 14/11 | 15/11 | 16/11 |

### US4 (rank 22) — Como gestor, quero controlar as alterações dos projetos, para garantir a rastreabilidade das ações realizadas.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Criar a função do gestor de aprovar ou reprovar entrega do freelancer | Guilherme | 4h | 10/11 | 16/11 | 14/11 |
| Colocar comentarios se reprovar | Guilherme | 4h | 10/11 | 16/11 | 14/11 |

### US5 (rank 23) — Como atendente, quero enviar um email referente ao orçamento, para que o cliente tenha a confirmação do início do projeto.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| enviar pdf do orçamento aprovado pro cliente | Igor | 3h | 12/11 | 14/11 | 14/11 |

### US6 (rank 24) — Como administrador, quero consultar requisições, orçamentos, ordens de serviço e financeiro, para acompanhar o desempenho do negócio.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Melhorar dashboard (já tem de frelancers ocupados, colocar os projetos) | Mariana | 4h | 10/11 | 21/11 | 14/11 |

### Melhorias e refinamentos

Itens pedidos durante a Sprint a partir do uso do sistema e das revisões da equipe.

| Tarefa | Responsável | Horas | Início | Entrega | Previsão |
|---|---|---:|---|---|---|
| Permitir o cliente selecionar +de um idioma na tradução | Fábio | 1h | 10/11 | 10/11 | 10/11 |
| Gestor poder selecionar + de um tradutor por tarefa (isso é um convite pro tradutor) | Mariana | 6h | — | — | — |
| Tradutor poder recusar convite de serviço (e se aceitar bloquear os outros convites dos outros tradutores) | Fábio | 4h | 05/11 | 05/11 | 05/11 |
| Atendente poder arterar o orçamento (preço, adicionar arquivos posteriores) | Mariana | 8h | — | — | — |
| na hora do gestor designar tradutor pra tarefa filtrar por caracteristicas do orçamento (tipo de tradução, idioma, proeficiência) | Mariana | 5h | 16/11 | 21/11 | 19/11 |
| Na hora do cliente selecionar idioma mudar para lista com pesquisa ao inves de selecionar itens como esta (como o cara falou que tem idioma pra caramba tipo 8 Inglês diferentes) | Igor | 3h | 16/11 | 17/11 | 16/11 |

**Total de horas planejadas na Sprint:** 68h.

## Entregas relacionadas às melhorias

| Melhoria | Pull Request |
|---|---|
| Seleção de vários idiomas de destino em uma solicitação | #67 |
| Filtros nas solicitações | #68 |
| Tradutor aceita ou recusa o convite de uma etapa | #59 |
| Filtro de tradutores por idioma na designação de etapas | #70 |
| Atendente altera o orçamento e anexa documentos depois de criado | #71 |
| Gestor convida um tradutor adicional por etapa (colaborador com aceite) | #72 |

## DoR da Sprint 3 — critérios de aceitação por User Story

Cada história entrou na Sprint com o checklist do [DoR](../dor_dod.md#dor--definition-of-ready) cumprido: descrição clara, critérios de aceitação escritos, regras de negócio claras, estimativa, sem dependência bloqueadora e modelo de dados disponível ([Modelagem do Banco](../modelagem_banco.md)). Os critérios abaixo foram verificados na demonstração.

| Rank | User Story | Critérios de aceitação | Regras de negócio | Mensagens |
|---:|---|---|---|---|
| 19 | Bot de dúvidas | O visitante abre o chat na página pública, faz perguntas sobre serviços, idiomas e preços e recebe resposta. | O assistente só responde sobre os serviços; a chave do Gemini fica só no backend. | Aviso de erro se o assistente estiver indisponível. |
| 20 | Fatura de pagamento ao freelancer | O financeiro cria a fatura com descrição e valor, gera o PDF e envia ao e-mail do tradutor. | Número de fatura único; valor positivo; vínculo opcional com projeto e etapa. | Confirmação de envio; erro de e-mail não configurado. |
| 21 | Fatura de venda ao cliente | A fatura é gerada em PDF a partir do orçamento aprovado e enviada ao e-mail do cliente. | Uma fatura por orçamento; só orçamento aprovado gera fatura. | Confirmação de envio; erro se já existe fatura. |
| 22 | Controle das alterações (aprovar/reprovar entrega) | O gestor aprova ou reprova a entrega de uma etapa; ao reprovar, informa o motivo, que o tradutor vê. As ações ficam registradas na trilha de auditoria. | Só o gestor decide; a reprovação exige comentário; a etapa volta a "em andamento". | Confirmação da decisão; erro se o comentário estiver vazio. |
| 23 | E-mail do orçamento | O atendente envia o PDF do orçamento ao cliente, com botões para aprovar ou recusar. | O link de decisão vale só para o orçamento enviado. | Confirmação de envio; erro se o e-mail do cliente falhar. |
| 24 | Painel do administrador | O administrador vê indicadores de requisições, orçamentos, projetos e financeiro, e o resumo de projetos. | Só o administrador acessa o painel. | Mensagem de carregamento e de falha por bloco. |

Artefatos relacionados: telas por perfil descritas no [Manual do Usuário](../user_manual.md), dados em [Modelagem do Banco](../modelagem_banco.md), estratégia de testes em [DoR e DoD](../dor_dod.md) (testes automatizados, lint, checagem de tipos e teste manual da demonstração).

## Definition of Done da Sprint

Cada entrega foi revisada por Pull Request e passou pelos testes automatizados (backend), pelo lint e pela checagem de tipos (frontend). Os itens abaixo resumem a conferência final de fechamento.

- [x] Backend: testes automatizados passando
- [x] Frontend: lint e checagem de tipos sem erros
- [x] Migrações sobem do zero até uma única versão (head)
- [x] Rotas protegidas exigem login; só as rotas públicas previstas ficam abertas
- [x] Modelagem do banco documentada
- [x] Estratégia de branch e padrão de commits documentados
- [ ] Manual do Usuário atualizado com as funcionalidades da Sprint
- [ ] `main` atualizada com a versão final da `develop`
