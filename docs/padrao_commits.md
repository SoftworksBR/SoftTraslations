# Padrão de Mensagens de Commit

Todo commit do projeto segue o padrão do Guia do GitHub da API:

```text
<tipo> (<referência>): <descrição da entrega feita no commit>
```

- **tipo:** o que o commit faz (tabela abaixo).
- **referência:** identificador da demanda. Usamos o número da User Story do
  Backlog (`US-24`) ou, para melhorias e correções sem User Story, o número do
  Pull Request ou da Issue (`#72`). Pode haver mais de uma, separadas por
  vírgula.
- **descrição:** frase curta, no imperativo ou no infinitivo, que diga o que
  está sendo entregue. Pequenas mudanças, comentários pequenos.

## Tipos

| Tipo | Quando usar | Exemplo |
| --- | --- | --- |
| `feat` | Adição de funcionalidade | `feat (US-23): envia o orçamento ao cliente por e-mail` |
| `fix` | Correção de defeito | `fix (#72): trava a etapa nas ações do tradutor adicional` |
| `docs` | Documentação | `docs (US-22): inclui a modelagem do banco de dados` |
| `style` | Formatação, sem alterar comportamento | `style (#70): ajusta a indentação do filtro de idiomas` |
| `refactor` | Refatoração sem mudar a funcionalidade | `refactor (US-21): separa a geração do PDF da fatura` |
| `test` | Criação ou ajuste de testes | `test (#71): cobre o envio concorrente de anexos` |
| `chore` | Manutenção que não afeta o comportamento | `chore (#72): atualiza dependências do frontend` |

## Regras

1. Um commit por entrega: pequenas mudanças, pequenos commits, mantendo a
   última versão estável.
2. A referência é obrigatória, para que cada commit possa ser ligado à tarefa
   que o motivou.
3. O título do Pull Request segue o mesmo padrão do commit principal.
4. A mensagem descreve o resultado, não o esforço ("corrige a trava do
   convite", e não "mexe no serviço").

## Observação sobre o histórico

O padrão por tipo (`feat`, `fix`, `test`...) vale desde o início do projeto e
está em quase todos os commits. A referência da demanda foi incorporada ao
padrão no fechamento da Sprint 3 e vale para todos os commits a partir daí;
o histórico anterior não é reescrito, para preservar a rastreabilidade dos
Pull Requests já revisados.
