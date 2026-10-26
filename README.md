# SoftTranslations

## Gerenciamento de serviços de tradução

O SoftTranslations é uma aplicação desenvolvida pela SoftworksBR em parceria
com a **Aliança Traduções** para organizar solicitações de tradução e o fluxo
de trabalho interno. O projeto inclui um frontend responsivo em Expo/React
Native e uma API FastAPI.

---
## 📖 Sumário

- [Sobre o Projeto](#about)
- [Recursos disponíveis](#available-features)
- [Manuais e documentação](#documents)
- [Backlog do Produto](#backlog)
- [Tecnologias Utilizadas](#tecnologies)
- [Autores](#authors)

---

## <span id="about">Sobre o Projeto</span>

O sistema organiza solicitações públicas, propostas de orçamento e projetos
com etapas de trabalho. O acesso interno é separado por perfis de
administrador, atendimento, gestor de projetos e tradutor freelancer.

## <span id="available-features">Recursos disponíveis</span>

- Formulário público para envio de solicitação de tradução e anexos.
- Consulta interna de solicitações e criação de orçamento pelo atendimento.
- Registro de aprovação ou recusa de orçamento pelo atendimento.
- Criação de projeto a partir de orçamento aprovado e associação a trilhas.
- Cadastro de etapas reutilizáveis e trilhas de workflow; consulta de projetos,
  etapas e tradutores.
- Consulta de etapas atribuídas ao tradutor.
- Gerenciamento de contas internas pelo administrador.

O produto está em desenvolvimento. Funcionalidades descritas no backlog não
estão necessariamente disponíveis na interface atual. O
[Manual do Usuário](docs/user_manual.md) registra os fluxos existentes e as
limitações conhecidas; o [Manual de Instalação](docs/instalation_manual.md)
descreve como executar o projeto localmente.

---

## 📚 <span id="documents">Manuais e Documentação</span>

- [Manual de Instalação](docs/instalation_manual.md)
- [Manual do Usuário](docs/user_manual.md)
- [Documentação do backend](backend/README.md)
- [Notas técnicas do fluxo solicitação–orçamento–projeto](docs/FLUXO_ORCAMENTO_E_PROJETOS.md)

---

# 📋 <span id="backlog">Backlog do Produto</span>

O backlog abaixo é o planejamento do produto, não uma lista de recursos
garantidamente implementados. Consulte a seção [Recursos disponíveis](#available-features)
e os manuais para entender o que pode ser utilizado hoje.

| Rank | User Story | Sprint |
|---:|---|---|
| 1 | Como administrador, quero cadastrar os funcionários internos, informando seus dados e o grupo de permissão associado, para organizar o acesso da equipe ao sistema. | Sprint 1 |
| 2 | Como gestor de projeto, quero pré-cadastrar um freelancer com seus dados básicos, para convidá-lo a completar o cadastro e se juntar à equipe de prestadores. |  Sprint 1 |
| 3 | Como freelancer, quero completar meu cadastro informando tipo (tradutor/revisor/formatador/intérprete), habilidades, idiomas e documentos comprobatórios, para finalizar minha entrada na base de prestadores. | Sprint 1 |
| 4 | Como gestor de projeto, quero revisar e ativar o cadastro de um freelancer depois que ele completar suas informações, para liberar o acesso dele ao sistema. |  Sprint 1 |
| 5 | Como atendimento, quero cadastrar empresas clientes com seus departamentos e contatos, para organizar quem solicita os serviços. | Sprint 1 |
| 6 | Como gestor de projeto, quero cadastrar e editar modelos de workflow reutilizáveis, com suas etapas e o tipo de freelancer necessário em cada uma, para agilizar a montagem de novos projetos. | Sprint 1 |
| 7 | Como administrador, quero cadastrar tabelas de preço por par de idioma e itens adicionais, para uso na montagem de orçamentos. | Sprint 1 |
| 8 | Como atendimento, quero criar um orçamento a partir de uma Requisição ou solicitação do cliente, para formalizar o pedido de serviço. | Sprint 2 |
| 9 | Como atendimento, quero registrar a aprovação do orçamento pelo cliente, para gerar a ordem de serviço. | Sprint 2 |
| 10 | Como gestor de projeto, quero definir as etapas de uma ordem de serviço a partir de um modelo de workflow, para estruturar o projeto. | Sprint 2 |
| 11 | Como gestor de projeto, quero selecionar ou atribuir freelancers para cada etapa, escolhendo entre atribuição automática (melhor posicionado ou primeiro a aceitar) ou manual (requisitar disponibilidade ou atribuição direta), para adequar o método a cada caso. | Sprint 2 |
| 12 | Como freelancer, quero visualizar e aceitar os trabalhos disponibilizados a mim, para saber o que preciso executar. | Sprint 2 |
| 13 | Como freelancer, quero entregar o arquivo referente à minha etapa, para concluir minha parte do trabalho. | Sprint 2 |
| 14 | Como gestor de projeto, quero que o sistema encaminhe automaticamente o trabalho para o freelancer da próxima etapa assim que uma etapa for entregue, para manter o fluxo sem intervenção manual. | Sprint 2 |
| 15 | Como gestor de projeto, quero verificar todas as etapas concluídas antes de enviar o resultado final ao cliente, para garantir que nada ficou pendente. | Sprint 2 |
| 16 | Como freelancer, quero ter acesso apenas à etapa em que fui alocado, para preservar a confidencialidade das demais partes do projeto. | Sprint 2 |
| 17 | Como atendimento, quero ajustar manualmente o valor final de um orçamento sem alterar a tabela de preço padrão, para atender casos específicos. | Sprint 2 |
| 18 | Como gestor de projeto, quero visualizar a lista de ordens de serviço sem freelancer atribuído e já atribuídas, para acompanhar a distribuição do trabalho. | Sprint 2 |
| 19 | Como administrador, quero criar e editar grupos de permissão com controles por módulo e ação, para adaptar os perfis internos da equipe conforme a estrutura real da empresa. | Sprint 2 |
| 20 | Como financeiro, quero criar a fatura de venda de um serviço finalizado, para ter um documento-guia para o sistema externo de nota fiscal. | Sprint 3 |
| 21 | Como financeiro, quero criar a fatura de compra referente ao pagamento de um freelancer, para formalizar o valor devido a ele. | Sprint 3 |
| 22 | Como gestor de projeto, quero disparar um e-mail automático com modelo pré-preenchido ao selecionar um projeto pronto, para agilizar a comunicação com o cliente. (ator a confirmar — pode passar a ser do Atendimento) | Sprint 3 |
| 23 | Como atendimento, quero visualizar uma lista de clientes com filtros, para localizar rapidamente informações de um cliente específico. | Sprint 3 |
| 24 | Como administrador, quero consultar um painel principal com o resumo de tudo que está pendente ou em andamento nos menus habilitados para cada perfil, para agilizar o acompanhamento diário da equipe. | Sprint 3 |
| 25 | Como administrador, quero consultar um log de sessão com o histórico de login dos usuários, para fins de auditoria. | Sprint 3 |
| 26 | Como administrador, quero consultar um log de alterações do sistema, para garantir rastreabilidade das ações realizadas. | Sprint 3 |
| 27 | Como colaborador interno, quero criar tarefas vinculadas a um cliente, freelancer, orçamento ou ordem de serviço nas áreas onde tenho permissão, para organizar pendências relacionadas ao meu trabalho. | Sprint 3 |
| 28 | Como gestor de projeto, quero consultar relatórios de requisições, orçamentos, ordens de serviço, serviços, faturas e lucro, para acompanhar o desempenho do negócio. (pode fazer sentido dividir por área/departamento mais pra frente) | Sprint 3 |
| 29 | Como administrador, quero acessar um aplicativo mobile com o painel principal e as configurações, para acompanhar o sistema rapidamente mesmo fora do computador. | Sprint 3 |
| 30 | Como atendimento, quero receber automaticamente como Requisição no sistema os pedidos preenchidos pelo cliente no formulário do site institucional, para analisá-los e transformá-los em orçamento. | Sprint 3 |

--- 

## 🏃‍ DoR - Definition of Ready

- [ ] Possui descrição clara.
- [ ] Possui critérios de aceitação definidos.
- [ ] As dependências foram identificadas.
- [ ] As dúvidas foram esclarecidas.
- [ ] Pode ser estimada e desenvolvida pela equipe.

## 🏆 DoD - Definition of Done

- [ ] Todos os critérios de aceitação foram atendidos.
- [ ] O desenvolvimento foi finalizado.
- [ ] Os testes necessários foram realizados.
- [ ] O código foi revisado.
- [ ] Não existem erros críticos conhecidos.
- [ ] A documentação foi atualizada, quando necessário.
- [ ] A funcionalidade foi validada pela equipe.
- [ ] A alteração foi integrada ao projeto.

## 📅 <span id="sprint">Programação por Sprint </span>

### 🟢 Sprint 1 - Fundação da Plataforma e Solicitações

**Objetivo:** criar a estrutura base do sistema (páginas, conexões cruds básicos) 

### 📈 Backlog da Sprint 1

| Rank | User Story | Sprint |
|---:|---|---|
| 1 | Como administrador, quero cadastrar os funcionários internos, informando seus dados e o grupo de permissão associado, para organizar o acesso da equipe ao sistema. | Sprint 1 |
| 2 | Como gestor de projeto, quero pré-cadastrar um freelancer com seus dados básicos, para convidá-lo a completar o cadastro e se juntar à equipe de prestadores. |  Sprint 1 |
| 3 | Como freelancer, quero completar meu cadastro informando tipo (tradutor/revisor/formatador/intérprete), habilidades, idiomas e documentos comprobatórios, para finalizar minha entrada na base de prestadores. | Sprint 1 |
| 4 | Como gestor de projeto, quero revisar e ativar o cadastro de um freelancer depois que ele completar suas informações, para liberar o acesso dele ao sistema. |  Sprint 1 |
| 5 | Como atendimento, quero cadastrar empresas clientes com seus departamentos e contatos, para organizar quem solicita os serviços. | Sprint 1 |
| 6 | Como gestor de projeto, quero cadastrar e editar modelos de workflow reutilizáveis, com suas etapas e o tipo de freelancer necessário em cada uma, para agilizar a montagem de novos projetos. | Sprint 1 |
| 7 | Como administrador, quero cadastrar tabelas de preço por par de idioma e itens adicionais, para uso na montagem de orçamentos. | Sprint 1 |

## 🚀 MVP(Mínimo Produto Viável) Sprint 1:

- [1] CRUD básico de Administradores, Gestores, Atendente por parte do Administrador.
- [2] Pré-cadastro do Freelancer por parte do Gestor.
- [3] Conclusão de cadastro por parte do Freelancer.
- [3] Cadastro de Workflow por parte do Gestor.

---

### 📈 Backlog da Sprint 2

| Rank | User Story | Sprint |
|---:|---|---|
| 8 | Como atendimento, quero criar um orçamento a partir de uma Requisição ou solicitação do cliente, para formalizar o pedido de serviço. | Sprint 2 |
| 9 | Como atendimento, quero registrar a aprovação do orçamento pelo cliente, para gerar a ordem de serviço. | Sprint 2 |
| 10 | Como gestor de projeto, quero definir as etapas de uma ordem de serviço a partir de um modelo de workflow, para estruturar o projeto. | Sprint 2 |
| 11 | Como gestor de projeto, quero selecionar ou atribuir freelancers para cada etapa, escolhendo entre atribuição automática (melhor posicionado ou primeiro a aceitar) ou manual (requisitar disponibilidade ou atribuição direta), para adequar o método a cada caso. | Sprint 2 |
| 12 | Como freelancer, quero visualizar e aceitar os trabalhos disponibilizados a mim, para saber o que preciso executar. | Sprint 2 |
| 13 | Como freelancer, quero entregar o arquivo referente à minha etapa, para concluir minha parte do trabalho. | Sprint 2 |
| 14 | Como gestor de projeto, quero que o sistema encaminhe automaticamente o trabalho para o freelancer da próxima etapa assim que uma etapa for entregue, para manter o fluxo sem intervenção manual. | Sprint 2 |
| 15 | Como gestor de projeto, quero verificar todas as etapas concluídas antes de enviar o resultado final ao cliente, para garantir que nada ficou pendente. | Sprint 2 |
| 16 | Como freelancer, quero ter acesso apenas à etapa em que fui alocado, para preservar a confidencialidade das demais partes do projeto. | Sprint 2 |
| 17 | Como atendimento, quero ajustar manualmente o valor final de um orçamento sem alterar a tabela de preço padrão, para atender casos específicos. | Sprint 2 |
| 18 | Como gestor de projeto, quero visualizar a lista de ordens de serviço sem freelancer atribuído e já atribuídas, para acompanhar a distribuição do trabalho. | Sprint 2 |
| 19 | Como administrador, quero criar e editar grupos de permissão com controles por módulo e ação, para adaptar os perfis internos da equipe conforme a estrutura real da empresa. | Sprint 2 |

## 🚀 MVP (Mínimo Produto Viável) — Sprint 2

1. **Orçamento e ordem de serviço (itens 8, 9 e 17):** o atendimento cria um orçamento a partir de uma requisição, informa prazo e observações, ajusta o valor final sem alterar a tabela de preços e registra a aprovação do cliente. A aprovação gera uma ordem de serviço vinculada à requisição e ao orçamento.
2. **Preparação e distribuição do projeto (itens 10, 11 e 18):** o gestor cria o projeto da ordem de serviço usando um workflow existente, acompanha ordens com e sem freelancer atribuído e distribui cada etapa. No MVP, a atribuição pode ser direta pelo gestor ou por solicitação de disponibilidade a candidatos selecionados, com encaminhamento ao primeiro candidato que aceitar. A seleção automática por “melhor posicionado” fica para uma evolução posterior.
3. **Execução das etapas (itens 12, 13 e 16):** o freelancer consulta os trabalhos disponibilizados, aceita uma solicitação de disponibilidade e visualiza somente as etapas atribuídas a si. Em cada etapa, pode enviar o arquivo de entrega e acompanhar sua situação.
4. **Progressão e encerramento (itens 14 e 15):** após a entrega de uma etapa, o sistema encaminha o trabalho à próxima etapa definida no workflow. O gestor consegue conferir o progresso e só pode marcar o projeto como concluído quando todas as etapas tiverem sido entregues.
5. **Acesso por perfil (item 19, versão mínima):** o MVP mantém o controle de acesso pelos perfis existentes — atendimento, gestor, administrador e freelancer — e garante que cada perfil opere somente nas áreas autorizadas. A criação de grupos configuráveis com permissões por módulo e ação fica para uma evolução posterior.

---

## 💻 <span id="tecnologies">Tecnologias</span>
<h4 align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"></a>
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white"></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"></a>
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white"></a>
  <a href="https://www.mongodb.com/"><img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white"></a>
  <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"></a>
  <a href="https://git-scm.com/"><img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white"></a>
  <a href="https://github.com/"><img src="https://img.shields.io/badge/GitHub-121011?style=for-the-badge&logo=github&logoColor=white"></a>
</h4>

---


## 👥 <span id="authors">Autores</span>

<div align="center">
  <table>
    <tr>
      <th>Membro</th>
      <th>Função</th>
      <th>Github</th>
      <th>Linkedin</th>
    </tr>
    <tr>
      <td>Igor Mateus de Andrade</td>
      <td>Scrum Master</td>
      <td><a href="https://github.com/IgorAndrade2024/"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
      <td><a href="www.linkedin.com/in/igor-andrade-b3b434327"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
    </tr>
        <tr>
      <td>Mariana Lins</td>
      <td>Product Owner</td>
      <td><a href="https://github.com/mariana-lins/"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
      <td><a href="https://www.linkedin.com/in/mariana-lins8/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
    </tr>
    <tr>
      <td>Guilherme Henrique</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/guiih0412"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
      <td><a href="https://www.linkedin.com/in/guilherme-henrique-36b3a0220/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
    </tr>
    <tr>
      <td>Tiago Bertolini</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/HelionLight"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
      <td><a href="https://www.linkedin.com/in/tiago-bortolini-772b162b6/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
    </tr>
    <tr>
      <td>Fábio Nawa</td>
      <td>Desenvolvedor</td>
      <td><a href="https://github.com/FabioNawa"><img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"></a></td>
      <td><a href="https://www.linkedin.com/in/fábiohnawa/"><img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"></a></td>
    </tr>
  </table>
</div>
