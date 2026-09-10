# SoftworksBR

## 📌 SoftTranslations – Gerenciamento da tradução de documentos técnicos

Sistema desenvolvido pela SoftworksBr em parceria com a **Aliança Traduções**, com o objetivo de auxiliar colaboradores na gestão dos serviços prestados pela empresa.
A plataforma visa conectar **clientes que necessitem de serviços de tradução** a **tradutores**, permitindo o gerenciamento completo por parte da empresa a solicitações, orçamentos, projetos e entregas.

---
## 📖 Sumário

- [Sobre o Projeto](#about)
- [Objetivo do Projeto](#objective)
- [Documentação](#documents)
- [Backlog do Produto](#backlog)
- [Programação por Sprint](#sprint)
- [Tecnologias Utilizadas](#tecnologies)
- [Autores](#authors)

---

## 📌 <span id="about">Sobre o Projeto</span>

O projeto **SofTranslations** tem como objetivo servir como um hub central onde todas as operações da **Aliança Traduções** possam ser realizadas e monitoradas, facilitando a gestão dos diversos serviços em andamento. 
O sistema permitirá a solicitação de serviços direta do cliente agilizando o processo de criação de orçamentos, ampla personalização no cadastro dos serviços e de tradutores permitindo o fácil emparelhamento entre eles, agentes de inteligencia artificial que auxiliam o usuário a utilizar o software, entre outras funcionalidades. 

---


## 🎯 <span id="objective">Objetivos do Projeto</span>

- Facilitar a criação de orçamentos com os clientes.
- Permitir que a gestão poça escolher o tradutor certo para cada serviço de maneira fácil e rápida.
- utilizar workflows personalizados para deixar explícito o progresso dos serviços.
- utilizar agentes de ia personalizados para auxiliar no uso do sistema.

---

## 📚 <span id="documeents">Manuais e Documentação</span>

- 📖 [Manual de Instalação](Em produção ...)  
- 👨‍💻 [Manual do Usuário](Em produção...)

---

# 📋 <span id="backlog">Backlog do Produto</span>

| Rank | User Story | Sprint |
|---|---|---|---|---:|---|
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

- em andamento ...

## 🏆 DoD - Definition of Done

- em andamento ... 

## 📅 <span id="sprint">Programação por Sprint </span>

### 🟢 Sprint 1 - Fundação da Plataforma e Solicitações

**Objetivo:** criar a estrutura base do sistema (páginas, conexões cruds básicos) 

### 📈 Backlog da Sprint 1

| Rank | User Story | Sprint |
|---|---|---|---|---:|---|
| 1 | Como administrador, quero cadastrar os funcionários internos, informando seus dados e o grupo de permissão associado, para organizar o acesso da equipe ao sistema. | Sprint 1 |
| 2 | Como gestor de projeto, quero pré-cadastrar um freelancer com seus dados básicos, para convidá-lo a completar o cadastro e se juntar à equipe de prestadores. |  Sprint 1 |
| 3 | Como freelancer, quero completar meu cadastro informando tipo (tradutor/revisor/formatador/intérprete), habilidades, idiomas e documentos comprobatórios, para finalizar minha entrada na base de prestadores. | Sprint 1 |
| 4 | Como gestor de projeto, quero revisar e ativar o cadastro de um freelancer depois que ele completar suas informações, para liberar o acesso dele ao sistema. |  Sprint 1 |
| 5 | Como atendimento, quero cadastrar empresas clientes com seus departamentos e contatos, para organizar quem solicita os serviços. | Sprint 1 |
| 6 | Como gestor de projeto, quero cadastrar e editar modelos de workflow reutilizáveis, com suas etapas e o tipo de freelancer necessário em cada uma, para agilizar a montagem de novos projetos. | Sprint 1 |
| 7 | Como administrador, quero cadastrar tabelas de preço por par de idioma e itens adicionais, para uso na montagem de orçamentos. | Sprint 1 |

## 🚀 MVP(Mínimo Produto Viável) Sprint 1:
Em andamento...

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
  </table>
</div>
