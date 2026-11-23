# Definition of Ready (DoR) e Definition of Done (DoD)

Os dois checklists abaixo são usados em todas as Sprints. O registro de cada
Sprint está na pasta [`docs/sprints`](./sprints/).

## DoR — Definition of Ready

Uma User Story só entra no Backlog da Sprint se cumprir o checklist.

**Sobre a User Story**

- [ ] Tem título claro, descrição bem definida e objetivo compreendido
- [ ] Tem critérios de aceitação escritos
- [ ] Tem regras de negócio claras
- [ ] Foi estimada pela equipe
- [ ] Não tem dependências bloqueadoras
- [ ] A compreensão foi validada com o time

**Sobre os artefatos relacionados**

- [ ] Design/documentação disponível (esboço da tela, quando houver)
- [ ] Regras de negócio detalhadas (texto ou diagrama)
- [ ] Modelo de dados disponível ([Modelagem do Banco](./modelagem_banco.md))
- [ ] Estratégia de testes definida

## DoD — Definition of Done

Uma User Story só é considerada concluída quando cumpre o checklist, conferido
por um membro diferente dos que a desenvolveram.

- [ ] Todos os critérios de aceitação foram atendidos
- [ ] O código passou por revisão (Pull Request aprovado por outro membro da
      equipe, sem aprovar o próprio PR)
- [ ] Os testes automatizados passam e foram escritos para o que mudou
- [ ] O lint e a checagem de tipos passam, sem erros novos
- [ ] Foram feitos testes de regressão para garantir que outras
      funcionalidades não foram afetadas
- [ ] Não existem erros críticos conhecidos
- [ ] A migração do banco, quando houver, sobe do zero e o banco de dados
      está documentado ([Modelagem do Banco](./modelagem_banco.md))
- [ ] O Manual do Usuário foi atualizado ([Manual do Usuário](./user_manual.md))
- [ ] O Manual de Instalação foi atualizado, quando necessário
      ([Manual de Instalação](./instalation_manual.md))
- [ ] A funcionalidade foi validada pela equipe e demonstrada na Review
- [ ] A alteração foi integrada à `develop` por Pull Request
