# Definition of Done (DoD), Plano de Testes e Aprovação — Sprint 2

**Projeto:** Sistema de Gestão de Traduções — Aliança Traduções
**Equipe:** Softworks — Fatec, ADS, 2026-2
**Elaborado em:** 20/10/2026
**Documentos relacionados:** `Backlog_Sprint2.md` · `DoR_Sprint2.md` (critérios de aceite CA-xx.y citados abaixo)
**Referência:** Guia de PO (Fatec) — o DoD é um checklist verificado por um membro **diferente** dos que desenvolveram a story.

---

## 1. Definition of Done — por User Story

Uma story só é **Pronta** quando **todos** os itens abaixo estiverem marcados. O verificador é uma pessoa que não desenvolveu a story.

**Código e revisão**
- [ ] O código passou por Code Review
- [ ] Pull Request para `develop` aprovado por **pelo menos 2 membros** da equipe (sendo 1 diferente de quem desenvolveu)
- [ ] A branch está atualizada com `develop` e sem conflitos; mudanças pequenas e focadas, com commits claros (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`)

**Qualidade técnica**
- [ ] `ruff check` sem erros e `pytest` passando por inteiro (nenhum teste antigo quebrado)
- [ ] Testes automatizados escritos para as regras de negócio e para os erros da story (inclui permissões 401/403)
- [ ] Testes de regressão: as funcionalidades já prontas continuam funcionando (ver seção 4)
- [ ] Migrations Alembic versionadas, com *upgrade* **e** *downgrade* testados, e **um único head** (sem ramificações)
- [ ] Dados existentes foram preservados pela migration (quando a story altera uma tabela já em uso)
- [ ] Nenhum segredo ou credencial no código ou no `.env.example` real
- [ ] Nomes de entidades, tabelas e campos novos em **inglês**

**Aderência ao DoR**
- [ ] Todos os **critérios de aceite** (CA) da story foram executados e passaram
- [ ] Regras de negócio, dados e validações implementados como especificado
- [ ] Mensagens de confirmação, erro e aviso implementadas com o texto do DoR (ou texto equivalente aprovado pelo PO)
- [ ] A tela segue o esboço do DoR
- [ ] A tela usa a **API real** (sem dados de exemplo) e funciona no **Expo Web** e no dispositivo/emulador
- [ ] Permissões por perfil conferidas **na API** e na tela

**Documentação**
- [ ] Documentação da API atualizada (rotas e campos novos ou alterados)
- [ ] Modelagem do banco atualizada (diagrama/dicionário)
- [ ] Manual do Usuário atualizado com a funcionalidade
- [ ] Manual de Instalação atualizado, se mudar configuração, dependências ou variáveis de ambiente
- [ ] README atualizado quando a story altera o escopo do MVP

**Integração e validação**
- [ ] A alteração foi **integrada em `develop`** e testada lá
- [ ] A funcionalidade foi **validada pela equipe** em demonstração curta
- [ ] Não existem erros críticos conhecidos
- [ ] O PO registrou o aceite (seção 6)

## 2. Definition of Done da Sprint

- [ ] Todas as stories da **Meta** (ranks 1 a 15) estão Prontas pelo DoD acima
- [ ] As stories da faixa Planejada e da Complementar atendem ao DoR e à DoD
- [ ] `develop` está estável: build do front e testes do backend passam
- [ ] O fluxo ponta a ponta (seção 5) roda inteiro sem intervenção técnica
- [ ] Manual de Instalação, Manual do Usuário, documentação de API e modelagem do banco atualizados
- [ ] Dúvidas pendentes (seção 7 do backlog) estão registradas, com responsável, ou resolvidas
- [ ] Backlog da Sprint 3 revisado, incluindo o que foi adiado
- [ ] Burndown e resultado da Sprint registrados para a Sprint Review

## 3. Estratégia de testes

| Nível | O que cobre | Ferramenta / quem | Quando |
|---|---|---|---|
| **A — Automático de backend** | Regras de negócio, validações, permissões por perfil (401/403), migrations | `pytest` (+ `pytest-cov`), `ruff`; escrito por quem desenvolve | A cada PR; bloqueia o merge se falhar |
| **M — Manual de tela** | Fluxo na tela (Expo Web e emulador), mensagens, campos obrigatórios | Executor ≠ desenvolvedor, seguindo os CA | Antes do merge em `develop` |
| **I — Integração front–API** | A tela grava e lê pela API real, sem dados de exemplo | Execução manual com o backend rodando e banco de testes | Antes do merge |
| **R — Regressão** | O que já funcionava continua funcionando | Checklist da seção 4 + suíte `pytest` completa | A cada merge em `develop` |
| **E — Ponta a ponta** | O fluxo completo Requisição → aceite → entrega → conferência | Cenário da seção 5, com os cinco perfis | No fim da Sprint (e a cada integração grande) |
| **S — Segurança e permissões** | Cada perfil acessa só o que deve; o freelancer não vê valores nem outras etapas | Casos 401/403 por rota + teste manual com a URL digitada | Em S2-16 e S2-21 e na regressão |

**Dados de teste (semente):** 1 Administrador, 1 Gestor de Projeto, 1 Atendimento, 1 Tradutor Interno (TQA), 3 freelancers ativos (tradutor, revisor, formatador), 1 freelancer pré-cadastrado e 1 aguardando aprovação; idiomas pt-BR, en-US, es-LATAM; serviços Tradução e Revisão; preços Tradução pt-BR → en-US a 0,12 e Revisão pt-BR → en-US a 0,05; 1 Empresa com 2 funcionários e 1 Pessoa Física; 1 modelo de workflow de 3 etapas (Tradução → Revisão → Formatação).

**Ambiente:** backend com banco de testes (não o de desenvolvimento) e migrations aplicadas do zero; front em Expo Web e em um emulador.

## 4. Checklist de regressão (rodar a cada merge em `develop`)

- [ ] Login de cada perfil entra e cai na tela certa; sair funciona (cookie/sessão)
- [ ] Cadastro de usuário interno e de freelancer continua funcionando
- [ ] Cadastro de cliente (Empresa e Pessoa) funciona e os dados antigos continuam visíveis
- [ ] Modelos de workflow (trilhas e quadros): criar, editar, excluir e a **ordem das etapas** é mantida
- [ ] CRUD de idiomas, serviços e preços funciona
- [ ] Filtros dos endpoints de listagem funcionam
- [ ] Autorização: rota de admin retorna 403 para outro perfil
- [ ] Migrations aplicam do zero e fazem *downgrade* sem erro; **um único head**
- [ ] Build do front (Expo Web) sem erro de TypeScript/ESLint

## 5. Cenário de aceite ponta a ponta (roteiro da demonstração)

Executar na ordem, com os dados de teste. Cada passo indica o resultado esperado e as stories cobertas.

| # | Perfil | Ação | Resultado esperado | Stories |
|:---:|---|---|---|---|
| 1 | Administrador | Cadastra o idioma "Inglês (EUA)", o serviço "Tradução" e o preço pt-BR → en-US a 0,12 | Itens aparecem nas listas e nos seletores | S2-01, 02, 03 |
| 2 | Administrador | Cadastra um usuário Atendimento com nome, sobrenome e e-mail | Usuário entra e vê só o menu do Atendimento | S2-04, 21 |
| 3 | Atendimento | Cadastra uma Empresa com 2 funcionários e uma Pessoa Física | Ambos aparecem na lista | S2-05 |
| 4 | Gestor de Projeto | Pré-cadastra um freelancer; entra como freelancer e completa o cadastro | Status "Pendente" → cadastro ativado automaticamente | S2-06, 07 |
| 5 | Gestor de Projeto | Revisa e aprova o freelancer | Status "Ativo"; passa a aparecer na atribuição | S2-08 |
| 6 | Atendimento | Registra uma requisição (Tradução pt-BR → en-US) para a Empresa | Requisição "Nova" na lista | S2-09 |
| 7 | Atendimento | Aprova a requisição com 1.000 palavras e prazo | Orçamento de **120,00** gerado; requisição "Aprovada" | S2-10 |
| 8 | Atendimento | Ajusta o valor final para 100,00 com justificativa | Orçamento mostra 100,00; valor calculado 120,00 preservado; tabela de preços intacta | S2-11 |
| 9 | Atendimento | Registra a aprovação do cliente | Orçamento "Aprovado"; **uma OS** criada, "Aguardando projeto" | S2-12 |
| 10 | Gestor de Projeto | Abre a OS, escolhe o modelo de 3 etapas e cria o projeto | Projeto com 3 etapas na ordem do modelo | S2-13 |
| 11 | Gestor de Projeto | Etapa 1: solicita disponibilidade a 2 freelancers. Etapas 2 e 3: atribuição direta | Pedidos enviados; etapas 2 e 3 "Atribuídas" | S2-14 |
| 12 | Freelancer | Vê o pedido, **não vê** valor nem dados do cliente, e aceita | Etapa 1 atribuída; o outro pedido é encerrado | S2-15, 16 |
| 13 | Gestor de Projeto | Consulta a lista de OS | A OS aparece em "Parcialmente atribuídas" (depois, em "Já atribuídas") | S2-19 |
| 14 | Freelancer | Inicia e entrega o arquivo da etapa 1 | Etapa 1 "Entregue"; etapa 2 liberada ao freelancer dela, com o arquivo | S2-17, 18 |
| 15 | Freelancers das etapas 2 e 3 | Cada um entrega a sua etapa em sequência (mesmo fluxo do passo 14) | Última entrega leva o projeto a "Aguardando conferência" | S2-17, 18 |
| 16 | Gestor de Projeto | Tenta concluir com uma etapa pendente; depois conclui com todas entregues | Primeiro é recusado com aviso; depois "Concluído", repassado ao Atendimento | S2-20 |
| 17 | Atendimento | Vê o projeto "Pronto para envio ao cliente" | Nenhum e-mail foi enviado pelo sistema | S2-20 |
| 18 | Freelancer | Tenta abrir por URL uma etapa de outro freelancer | 403/404 | S2-16 |

## 6. Verificação de aceite por story

Tipos de teste: **A** automático, **M** manual, **I** integração, **S** segurança, **E** ponta a ponta. A coluna "Evidência" é o que deve ser anexado ao aceite (teste passando, print, vídeo curto ou link do PR).

| Story | Verificação principal | Tipos | Critérios (DoR) |
|---|---|:---:|---|
| S2-01 Idiomas | Criar, duplicar, inativar item em uso, 403 para não-admin | A, M, I | CA-01.1 a 01.4 |
| S2-02 Serviços | Idem idiomas | A, M, I | CA-02.1 a 02.4 |
| S2-03 Preços | Combinação única, valores inválidos, preço antigo não altera orçamento | A, M, I | CA-03.1 a 03.4 |
| S2-04 Usuários internos | Cadastro com sobrenome, e-mail único, **migração preserva usuários antigos**, 403 | A, M, S | CA-04.1 a 04.4 |
| S2-05 Clientes | Empresa com funcionários, Pessoa Física, validações, dados da Sprint 1 visíveis | A, M, I | CA-05.1 a 05.5 |
| S2-06 Pré-cadastro | Cadastro com status pendente, e-mail duplicado | A, M | CA-06.1 a 06.3 |
| S2-07 Completar cadastro | Etapas, obrigatórios, listas ativas, data de nascimento | A, M, I | CA-07.1 a 07.4 |
| S2-08 Ativação automática | Ativa ao completar o cadastro, incompleto fora da atribuição, 403 | A, M, S | CA-08.1 a 08.3 |
| S2-09 Requisição | Registro, validações, lista pela API, 403 | A, M, I | CA-09.1 a 09.4 |
| S2-10 Orçamento | **Cálculo 1.000 × 0,12 = 120,00**, sem preço, sem duplicar, recusa com motivo | A, M | CA-10.1 a 10.4 |
| S2-11 Ajuste de valor | Valor ajustado x calculado, tabela intacta, bloqueio após aprovação | A, M | CA-11.1 a 11.4 |
| S2-12 Aprovação → OS | Uma OS por orçamento, reaprovação recusada, recusa com motivo | A, M | CA-12.1 a 12.4 |
| S2-13 Montar projeto | Etapas copiadas do modelo, modelo alterado depois não afeta, um projeto por OS | A, M | CA-13.1 a 13.4 |
| S2-14 Atribuição | Direta, solicitação com primeiro aceite, filtros de compatibilidade | A, M, E | CA-14.1 a 14.4 |
| S2-15 Visualização e aceite | Só o selecionado vê; aceite vincula; disputa; sem valor do cliente | A, M, S | CA-15.1 a 15.4 |
| S2-16 Só a própria etapa | 403/404 pela API, lista restrita, arquivos protegidos | A, S | CA-16.1 a 16.3 |
| S2-17 Entrega de arquivo | Upload válido/inválido, só o dono entrega | A, M | CA-17.1 a 17.3 |
| S2-18 Próxima etapa | Libera a seguinte com o arquivo, aviso ao Gestor, última etapa | A, M, E | CA-18.1 a 18.4 |
| S2-19 Lista de OS | Filtros e contagem atribuídas/total | A, M | CA-19.1 a 19.3 |
| S2-20 Conferência | Bloqueio com pendência, repasse ao Atendimento, nenhum e-mail ao cliente | A, M, E | CA-20.1 a 20.3 |
| S2-21 Perfis e menus | Matriz de menus por perfil, 403 pela API, perfil TQA | A, M, S | CA-21.1 a 21.3 |
| S2-22 Áreas e softwares (admin) | CRUD, duplicado, em uso, 403 | A, M | CA-22.1 a 22.3 |
| S2-23 Áreas e softwares (freelancer) | Seleção e persistência no perfil | A, M | CA-23.1 e 23.2 |
| S2-24 Disponibilidade | Grade semanal, ausências, sobreposição | A, M | CA-24.1 a 24.3 |
| S2-25 Termo e documentos | Modelo para baixar, envio, acesso restrito | A, M, S | CA-25.1 a 25.3 |
| S2-26 Pagamento | Conta brasileira e internacional, CPF/CNPJ, privacidade | A, M, S | CA-26.1 a 26.3 |
| S2-27 Perfil do colaborador interno | Campos opcionais, só o próprio perfil, foto | A, M | CA-27.1 a 27.3 |
| S2-28 Grupos de permissão | Matriz módulo × ação, efeito imediato, grupo em uso | A, M, S | CA-28.1 a 28.3 |

## 7. Procedimento de aprovação

1. **Desenvolvedor** conclui a story, roda `ruff`, `pytest` e abre o PR com o resumo (o que mudou, banco, API, testes, riscos de conflito, commits).
2. **Revisor 1 e Revisor 2** (pelo menos um sem ter desenvolvido) fazem o Code Review e marcam o checklist técnico do DoD.
3. **Executor do teste** (quem não desenvolveu) roda os critérios de aceite da story na tela, com o backend real, e anexa a evidência.
4. **Merge em `develop`**, seguido de regressão rápida (seção 4).
5. **PO** confere a story contra o DoR (regras, dados, mensagens, esboço) e registra o aceite no quadro: **Aceita**, **Aceita com ressalva** (com a pendência anotada) ou **Devolvida** (com o motivo).
6. Story **Devolvida** volta para o desenvolvimento e entra de novo no fluxo; não conta como Pronta.

**Modelo de registro de aceite** (copiar por story):

```
Story: S2-__ — ______________________
Desenvolvedor: ________   Revisores: ________ / ________   Executor do teste: ________
Data: __/__/____   PR: #____   Commits: ____________
Critérios de aceite executados: CA-__.__ (✔/✘) ...
Regressão (seção 4) executada: sim / não
Documentação atualizada (API, banco, manuais): sim / não
Resultado do PO: Aceita / Aceita com ressalva / Devolvida
Observações / pendências: ______________________
```

## 8. Critérios de aprovação da Sprint (Sprint Review)

A Sprint é considerada **atingida** quando:
- todas as stories da **Meta** foram aceitas pelo PO; e
- o **cenário ponta a ponta** (seção 5) foi demonstrado com sucesso, ao menos até o passo 12 (aceite do freelancer) para a Meta; até o 18 se a faixa Planejada foi concluída.

A Sprint é apresentada ao cliente e ao professor com o incremento funcionando, as stories aceitas e as decisões tomadas.

## 9. Validação com o cliente

Antes ou durante a Sprint Review, o cliente deve confirmar, em linguagem simples:
- [ ] Os campos de cadastro de usuário interno, Empresa, Pessoa e freelancer estão corretos
- [ ] O fluxo de orçamento está como eles trabalham (registro pelo Atendimento, ajuste de valor, aprovação, geração da OS)
- [ ] A forma de atribuir trabalho (direta e solicitação de disponibilidade) atende — e que a seleção automática "melhor posicionado" virá depois
- [ ] O freelancer não ver valores do cliente atende à expectativa de confidencialidade
- [ ] O formato do preço (por palavra, por serviço e par de idiomas) é suficiente, ou se os itens adicionais precisam entrar
- [ ] As respostas pendentes: CNPJ e departamentos, mapeamento de perfis e permissões, lista oficial de idiomas e especialidades
