# Backlog de Sprint 2

**Projeto:** Sistema de Gestão de Traduções — Aliança Traduções
**Equipe:** Softworks — Fatec, ADS, 2026-2
**Documento elaborado em:** 20/10/2026 (Sprint 2 em andamento)
**Documentos relacionados:** `DoR_Sprint2.md` (detalhamento de cada story e critérios de aceite) · `DoD_Testes_Sprint2.md` (Definition of Done, plano de testes e aprovação)
**Referência:** Guia de Product Owner (Fatec) — apenas User Stories que cumprem o DoR podem fazer parte de um Backlog de Sprint; as de maior prioridade são selecionadas primeiro; a Meta é o subconjunto de entrega obrigatória e inegociável.

---

## 1. Como ler este documento

Cada item recebe uma marca de confiança, para não misturar o que o cliente disse com o que a equipe decidiu ou supôs:

| Marca | Significado |
|:---:|---|
| ✅ | **Confirmado pelo cliente** (kickoff, Slack de 03/09, 05/09 ou 20/10/2026) |
| 🔶 | **Decisão ou proposta do PO/equipe** — coerente com o que o cliente disse, mas não validada por ele |
| ❓ | **Dúvida aberta** — depende de resposta do cliente, do professor ou de decisão da equipe (ver seção 7) |

Terminologia: nos documentos de PO usamos **Freelancer**; nas telas voltadas ao cliente usa-se **Recursos** (termo do cliente, mantido até ele decidir um novo nome). Perfis internos: **Administrador, Gestor de Projeto, Atendimento, Tradutor Interno (TQA)**. O **cliente final não acessa o sistema** ✅.

---

## 2. Meta da Sprint 2 (proposta do PO — a equipe confirma a capacidade no planning)

Como a Sprint 2 dá continuidade à Sprint 1 e acrescenta as respostas do cliente, este backlog é organizado em **três faixas**, em ordem de prioridade. Pelo guia de PO, não se desenvolve uma story de faixa inferior enquanto houver pendência de faixa superior.

| Faixa | Ranks | Conteúdo | Situação |
|---|:---:|---|---|
| **Meta** (obrigatória e inegociável) | 1 a 15 | Configurações do admin (idiomas, serviços, preços), cadastros atualizados conforme o cliente (usuários internos, clientes, freelancer — pré-cadastro, completar fase 1, revisão e ativação) e o fluxo **Requisição → Orçamento → Ordem de Serviço → Projeto → atribuição → aceite do freelancer** | 🔶 proposta |
| **Planejada** | 16 a 21 | Execução da etapa: acesso só à própria etapa, entrega de arquivo, encaminhamento automático, lista de OS, conferência final e perfis/menus por usuário (versão mínima). Corresponde ao MVP já descrito no README do repositório | 🔶 proposta |
| **Complementar** | 22 a 28 | Cadastro completo do freelancer (áreas de domínio, softwares, disponibilidade, termo, documentos, pagamento), perfil opcional dos usuários internos e grupos de permissão configuráveis | 🔶 proposta |

> **Atenção à capacidade.** São 28 stories. O PO não estima capacidade — isso é decisão da equipe (Planning Poker). Se for preciso cortar, corta-se de baixo para cima (Complementar → Planejada), nunca a Meta.

---

## 3. Ponto de partida

### 3.1 Histórias da Sprint 1 retomadas
A Sprint 2 dá continuidade a todas as histórias da Sprint 1, com o detalhamento pedido pelo cliente:

| História da Sprint 1 | Onde entra na Sprint 2 |
|---|---|
| S1-1 — grupo de permissão | S2-21 (perfis e menus, versão mínima) e S2-28 (grupos configuráveis) |
| S1-2 — pré-cadastro do freelancer | S2-06 |
| S1-3 — completar cadastro | S2-07, S2-22 a S2-26 |
| S1-4 — ativação do cadastro do freelancer | S2-08 |
| S1-5 — empresas (concluída, mas o cliente respondeu campos diferentes) | S2-05 |
| S1-6 — modelos de workflow (concluída) | reaproveitada em S2-13 |
| S1-7 — tabela de preço | S2-03 |

---

## 4. Respostas do cliente de 20/10/2026 incorporadas ✅

| Tema | Resposta do cliente | Efeito neste backlog |
|---|---|---|
| Administrador | "Sem nada preenchido" | S2-04 (❓ interpretação a confirmar: sem campos extras) |
| Gestor, Atendimento e qualquer usuário interno | Nome, Sobrenome, e-mail; depois o usuário inclui data de nascimento, foto e telefone | S2-04 e S2-27 |
| Cliente — Empresa | Nome, e-mail principal, site, telefone principal, informações gerais (bloco de texto), marcar "Pessoa Jurídica"; funcionários da empresa (quantos quiser): nome, sobrenome, e-mail, telefone, informações gerais | S2-05 |
| Cliente — Pessoa | Nome, sobrenome, e-mail, telefone, informações gerais/preferências, marcar "Pessoa Física" | S2-05 |
| Freelancer | A equipe preenche nome, sobrenome e e-mail; o freelancer preenche o restante conforme o **Manual Plunet de Primeiro Acesso** (anexo do cliente) | S2-06, S2-07, S2-22 a S2-26 |
| Menus | Manter a exibição por perfil de login "faz sentido" | S2-21 |
| Painel de trabalhos ativos e concluídos | Visível para Admin, Atendimento, Projetos e Tradutores Internos (TQA) | Regra de acesso registrada em S2-21; a tela do painel é a story #24 da Sprint 3 |

O que o manual do cliente traz para o freelancer: perfil (forma de tratamento, título acadêmico, função, data de nascimento, telefones, site, fuso horário, endereço, foto); propriedades obrigatórias (áreas de domínio, tipo de serviço, idioma de partida, chegada e nativo, softwares); disponibilidade e ausências; termo de confidencialidade; documentos e certificações; dados de pagamento (conta brasileira ou internacional).

---

## 5. Backlog de Sprint — User Stories


### Faixa 1 — Meta

| Rank | ID | User Story | Origem | Conf. |
|:---:|:---:|---|---|:---:|
| 1 | S2-01 | Como administrador, quero cadastrar e editar os idiomas com que a Aliança trabalha, para usá-los nas tabelas de preço, nas requisições e no cadastro dos freelancers. | Novo — pedido do scrum master; menu Idiomas = DEVE | ✅ |
| 2 | S2-02 | Como administrador, quero cadastrar e editar os tipos de serviço oferecidos (ex.: tradução, revisão, DTP), para usá-los em requisições, orçamentos e preços. | Novo — scrum master; menu Serviços = DEVE | ✅ |
| 3 | S2-03 | Como administrador, quero cadastrar a tabela de preços por serviço e par de idiomas, para calcular o valor dos orçamentos. | Retoma S1-7 | ✅ |
| 4 | S2-04 | Como administrador, quero cadastrar usuários internos informando nome, sobrenome, e-mail e perfil, para organizar o acesso da equipe. | Retoma S1-1 + resposta do cliente | ✅ |
| 5 | S2-05 | Como atendimento, quero cadastrar clientes como Empresa (pessoa jurídica) ou Pessoa (pessoa física), com seus contatos, para organizar quem solicita os serviços. | Retoma S1-5 + resposta do cliente | ✅ / ❓ |
| 6 | S2-06 | Como gestor de projeto, quero pré-cadastrar um freelancer informando nome, sobrenome e e-mail, para que ele complete o próprio cadastro. | Retoma S1-2 | ✅ |
| 7 | S2-07 | Como freelancer, quero completar meu cadastro informando meu perfil, idiomas de partida, chegada e nativo e os tipos de serviço que presto, para finalizar minha entrada na base de prestadores. | Retoma S1-3 (fase 1) | ✅ |
| 8 | S2-08 | Como gestor de projeto, quero que o cadastro do freelancer seja ativado automaticamente quando ele completar as informações, para liberar o acesso dele ao trabalho. | Retoma S1-4 | ✅ |
| 9 | S2-09 | Como atendimento, quero registrar uma requisição de orçamento recebida do cliente, para dar início ao processo de orçamento. | Novo — ajuste do "cliente solicita orçamento" | 🔶 / ❓ |
| 10 | S2-10 | Como atendimento, quero analisar uma requisição e aprová-la para que ela se torne um orçamento, informando prazo e observações, para formalizar o pedido de serviço. | Backlog #8 | ✅ |
| 11 | S2-11 | Como atendimento, quero ajustar manualmente o valor final de um orçamento sem alterar a tabela de preço padrão, para atender casos específicos. | Backlog #17 | ✅ |
| 12 | S2-12 | Como atendimento, quero registrar a aprovação do orçamento pelo cliente, para gerar a ordem de serviço. | Backlog #9 | ✅ |
| 13 | S2-13 | Como gestor de projeto, quero ver o orçamento aprovado e montar o projeto a partir dele, escolhendo um modelo de workflow para definir as etapas, para estruturar o trabalho. | Backlog #10 + pedido do scrum master | ✅ |
| 14 | S2-14 | Como gestor de projeto, quero atribuir freelancers às etapas — diretamente ou solicitando disponibilidade a freelancers selecionados —, para distribuir o trabalho. | Backlog #11 (MVP) | ✅ |
| 15 | S2-15 | Como freelancer, quero visualizar os trabalhos disponibilizados a mim e aceitá-los, para saber o que preciso executar. | Backlog #12 + pedido do scrum master | ✅ |

### Faixa 2 — Planejada

| Rank | ID | User Story | Origem | Conf. |
|:---:|:---:|---|---|:---:|
| 16 | S2-16 | Como freelancer, quero ter acesso apenas à etapa em que fui alocado, para preservar a confidencialidade das demais partes do projeto. | Backlog #16 | ✅ |
| 17 | S2-17 | Como freelancer, quero entregar o arquivo referente à minha etapa, para concluir minha parte do trabalho. | Backlog #13 | ✅ |
| 18 | S2-18 | Como gestor de projeto, quero que o trabalho siga automaticamente para a próxima etapa assim que uma etapa for entregue, para manter o fluxo sem intervenção manual. | Backlog #14 | ✅ |
| 19 | S2-19 | Como gestor de projeto, quero visualizar a lista de ordens de serviço sem freelancer atribuído e já atribuídas, para acompanhar a distribuição do trabalho. | Backlog #18 | ✅ |
| 20 | S2-20 | Como gestor de projeto, quero verificar todas as etapas concluídas e repassar o projeto ao Atendimento, para garantir que nada ficou pendente antes da entrega ao cliente. | Backlog #15 | ✅ |
| 21 | S2-21 | Como administrador, quero que cada perfil enxergue e acesse somente os menus e funcionalidades do seu perfil, para proteger as informações do negócio. | Backlog #19 (versão mínima) + resposta do cliente | ✅ / ❓ |

### Faixa 3 — Complementar

| Rank | ID | User Story | Origem | Conf. |
|:---:|:---:|---|---|:---:|
| 22 | S2-22 | Como administrador, quero cadastrar as áreas de domínio e os softwares usados pelos freelancers, para que eles os selecionem no próprio cadastro. | Manual do cliente | ✅ |
| 23 | S2-23 | Como freelancer, quero informar minhas áreas de domínio e os softwares que utilizo, para completar meu perfil profissional. | Manual do cliente | ✅ |
| 24 | S2-24 | Como freelancer, quero informar meus horários de trabalho e minhas ausências, para que só me ofereçam trabalho quando estou disponível. | Manual do cliente | ✅ |
| 25 | S2-25 | Como freelancer, quero enviar o termo de confidencialidade assinado e meus documentos e certificações, para concluir minha habilitação. | Manual do cliente + S1-3 | ✅ |
| 26 | S2-26 | Como freelancer, quero informar meus dados de pagamento, para que a Aliança possa me pagar pelos serviços. | Manual do cliente | ✅ |
| 27 | S2-27 | Como colaborador interno, quero incluir minha data de nascimento, foto e telefone no meu perfil, para completar meus dados. | Resposta do cliente | ✅ |
| 28 | S2-28 | Como administrador, quero criar e editar grupos de permissão com controles por módulo e ação, para adaptar os perfis internos à estrutura real da empresa. | Backlog #19 (completo) | ✅ / ❓ |

---

## 6. Itens técnicos e de qualidade (não são User Stories; entram como tarefas)

| ID | Item | Responsável atual | Situação (20/10) |
|:---:|---|---|---|
| T-1 | Atualizar para Expo SDK 57 | Igor (previsto 10/10) | ✅ integrado (PR #36) |
| T-2 | Cookies de segurança | Fábio (previsto 08/10) | ✅ integrado (PR #33) |
| T-3 | Documentação: README/MVP, **Manual de Instalação, Manual do Usuário, documentação de API e modelagem do banco** (obrigatórios pela Fatec) | Igor (previsto 09/10) | README/MVP integrado (#35); demais pendentes |
| T-4 | Landing page responsiva para mobile | Guilherme (previsto 17/10) | Em branch (#40/#41), não integrado |
| T-5 | Padronizar nomes de entidades em inglês (empresa → company; revisar `/employee` x plural) | — | PR #27 e #38 abertos; ver D-04 |
| T-6 | Trocar dados de exemplo (`@/data/...`) pela API nas telas | Fábio (branch de redesign) | Em branch, não integrado |
| T-7 | Coordenar a ordem das migrations Alembic entre #27, #38 e as novas (evitar múltiplos heads) | — | Risco ativo |
| T-8 | Infraestrutura de envio de e-mail (SMTP) para os e-mails de orçamento e fatura | — | ✅ |

---

## 7. Decisões e dúvidas em aberto

| ID | Dúvida | Quem decide | Impacto |
|:---:|---|---|---|
| D-01 | CNPJ e departamentos: o cliente não os citou ao listar os campos de empresa. São necessários? | Cliente | S2-05; código de S1-5 já implementado |
| D-02 | "Administrador — sem nada preenchido": significa sem campos extras? | Cliente | S2-04 |
| D-03 | "Cliente solicita orçamento": o cliente não acessa o sistema ✅. O Atendimento registra (S2-09) ou o site envia (#30, Sprint 3)? As telas de cliente já criadas (solicitação de orçamento) ficam, são adaptadas ou removidas? | Equipe + cliente | S2-09; telas do cliente existentes |
| D-04 | Renomeação de empresa para inglês (PR #27) junto com a mudança de modelo de cliente | Equipe | S2-05, T-5, T-7 |
| D-05 | Tipo de freelancer (tradutor, revisor, formatador, intérprete) pode ser derivado do tipo de serviço? O manual do cliente não tem esse campo | Cliente | S2-07, S2-13, S2-14 |
| D-06 | Quais campos do manual Plunet são realmente necessários? O cliente pediu antes para não replicar o sistema atual 1 para 1 | Cliente | S2-07, S2-22 a S2-26 |
| D-07 | Mapeamento de perfis e permissões prometido pelo cliente em 05/09 | Cliente | S2-21, S2-28 |
| D-08 | Lista de idiomas e especialidades prometida pelo cliente | Cliente | S2-01, S2-22 (enquanto isso, usar a lista do manual como semente provisória) |
| D-10 | Modelo de preço: o repositório usa preço por palavra por serviço e par de idiomas; o DoR original previa fator multiplicador e itens adicionais (taxa administrativa, urgência, certificações). Itens adicionais entram nesta sprint? Multi-moeda? | Equipe + cliente | S2-03, S2-10 |
| D-11 | Atribuição automática "melhor posicionado" adiada: comunicar ao cliente e ao professor | PO | S2-14 |
| D-12 | Grupos de permissão configuráveis (#19): o README os adia; o cliente espera perfis granulares | Equipe + professor | S2-21, S2-28 |
| D-13 | Perfil Tradutor Interno (TQA): o que ele pode fazer além de ver o painel? | Cliente | S2-21 |
| D-15 | Banco híbrido com MongoDB: continua valendo? Hoje tudo está em PostgreSQL | Equipe | Arquitetura/documentação |

---

## 8. Quebra em tarefas (feita pela equipe no planning)

Regra da Fatec: tarefas são técnicas, estimadas em **horas (máx. 4 h)**, não em pontos. A estimativa das stories (pontos, Planning Poker) e das tarefas é da equipe — este documento não as define. Para cada story, a divisão sugerida é a mesma usada pela equipe:

1. Entidade no banco (model + migration com *downgrade*)
2. Regras de negócio e rotas (schema, service, controller, route) + testes automatizados
3. Tela (front) conforme o esboço do DoR
4. Conexão front–API (`services/*.ts`), removendo dados de exemplo da tela
5. Teste de aceite pelos critérios do DoR e atualização dos manuais

Tarefa que passar de 4 h deve ser dividida.
