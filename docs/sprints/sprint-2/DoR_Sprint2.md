# Definition of Ready (DoR) — Sprint 2

**Projeto:** Sistema de Gestão de Traduções — Aliança Traduções
**Equipe:** Softworks — Fatec, ADS, 2026-2
**Elaborado em:** 20/10/2026
**Referência:** Guia de Product Owner (Fatec) — só uma User Story com DoR completo pode entrar em um Backlog de Sprint. Cada story abaixo traz: regras de negócio, dados (com tipo e validação), mensagens de confirmação/erro/aviso, esboço de tela e **critérios de aceite** (exigidos também pelo checklist do README do repositório).

**Marcas de confiança:** ✅ confirmado pelo cliente · 🔶 proposta do PO/equipe (validar) · ❓ depende de decisão pendente (ver `Backlog_Sprint2.md`, seção 7).
**Regra geral de linguagem:** nomes de entidades, tabelas e campos no código ficam em **inglês**; textos de tela e mensagens em **português**, usando o vocabulário do cliente. Os valores de enum permanecem em português (ex.: `tradutor`, `revisor`), como já ocorre em `Roles`.

**Regras transversais (valem para todas as stories):**
- RT-1 — Toda rota exige usuário autenticado e verifica o perfil; resposta 401 sem autenticação e 403 sem permissão.
- RT-2 — Mensagens de erro de validação indicam o campo e o motivo.
- RT-3 — Campos de data/hora gravados pelo servidor (`created_at`, `updated_at`); fuso padrão `America/Sao_Paulo`.
- RT-4 — Exclusão que afetaria histórico é substituída por **inativação** (nada em uso é apagado).
- RT-5 — O freelancer nunca vê valores cobrados do cliente nem dados do cliente além do necessário para executar a etapa.
- RT-6 — Telas concluídas usam a API real; não restam dados de exemplo (`@/data/...`) nelas.
- RT-7 — Em Expo Web, alertas usam o helper `alerta` (o `Alert.alert` nativo não funciona na web).

---

# FAIXA 1 — META

### S2-01 — Cadastrar idiomas (rank 1) ✅
> Como administrador, quero cadastrar e editar os idiomas com que a Aliança trabalha, para usá-los nas tabelas de preço, nas requisições e no cadastro dos freelancers.

**Regras de negócio**
- Só o Administrador cria e edita; os demais perfis apenas consultam.
- Nome único. Variantes regionais são idiomas distintos (ex.: Português (Brasil), Inglês (EUA), Espanhol (LATAM), Espanhol (Espanha)), como no sistema atual do cliente.
- Idioma em uso (em preço, requisição ou freelancer) não é excluído: é **inativado**; idioma inativo não aparece em novos cadastros, mas permanece no histórico.
- 🔶 Enquanto o cliente não enviar a lista oficial (D-08), a lista do manual dele serve de semente provisória.

**Dados**
- Nome — texto, obrigatório, máx. 60 caracteres, único
- Código — texto, opcional (ex.: `pt-BR`), único quando informado
- Ativo — booleano, padrão verdadeiro

**Mensagens**
- Confirmação: "Idioma [nome] salvo com sucesso."
- Erro: "Já existe um idioma com este nome."
- Aviso: "Este idioma está em uso e não pode ser excluído. Você pode inativá-lo."

**Esboço de tela:** lista de idiomas (nome, código, ativo) com busca; botão "Novo idioma" abre formulário (nome, código, ativo); ação "Inativar/Ativar" por linha.

**Critérios de aceite**
- CA-01.1 — Dado um admin autenticado, quando cria "Português (Brasil)", então o idioma aparece na lista e nos seletores.
- CA-01.2 — Dado um nome já existente, quando tenta criar de novo, então recebe o erro de duplicidade e nada é gravado.
- CA-01.3 — Dado um idioma em uso, quando tenta excluir, então recebe o aviso e o idioma continua existindo; ao inativar, some dos seletores de novos cadastros.
- CA-01.4 — Dado um usuário que não é admin, quando tenta criar ou editar, então recebe 403.

---

### S2-02 — Cadastrar tipos de serviço (rank 2) ✅
> Como administrador, quero cadastrar e editar os tipos de serviço oferecidos, para usá-los em requisições, orçamentos e preços.

**Regras de negócio**
- Só o Administrador cria e edita.
- Nome único; serviço em uso é inativado, não excluído.
- 🔶 Sementes provisórias, retiradas do manual do cliente: Tradução, Revisão, DTP, Formatação, Legendagem, Dublagem, Localização, Post Editing (Pós-edição), Preparação, Transcrição, Transcriação, Conferência. A lista final vem do cliente (D-08).

**Dados**
- Nome — texto, obrigatório, máx. 80 caracteres, único
- Descrição — texto, opcional, máx. 255 caracteres
- Ativo — booleano, padrão verdadeiro

**Mensagens**
- Confirmação: "Serviço [nome] salvo com sucesso."
- Erro: "Já existe um serviço com este nome."
- Aviso: "Este serviço está em uso e não pode ser excluído. Você pode inativá-lo."

**Esboço de tela:** mesma estrutura da lista de idiomas (nome, descrição, ativo) e formulário simples.

**Critérios de aceite**
- CA-02.1 — Admin cria "Revisão" e o serviço aparece nos seletores de preço e de requisição.
- CA-02.2 — Nome duplicado é recusado com a mensagem de erro.
- CA-02.3 — Serviço usado em preço ou requisição não é apagado; pode ser inativado.
- CA-02.4 — Não-admin recebe 403 ao criar ou editar.

---

### S2-03 — Cadastrar tabela de preços (rank 3) ✅ / ❓
> Como administrador, quero cadastrar a tabela de preços por serviço e par de idiomas, para calcular o valor dos orçamentos.

**Regras de negócio**
- Só o Administrador cria e edita; Atendimento consulta (precisa dela para o orçamento).
- Uma entrada ativa por combinação serviço + idioma de origem + idioma de destino.
- Origem e destino devem ser diferentes; só idiomas e serviços ativos podem ser escolhidos.
- O preço é **por palavra**, como no repositório hoje. ❓ D-10: o DoR original previa fator multiplicador por par de idiomas e itens adicionais (taxa administrativa, urgência, certificações). O cliente pediu para **não** replicar o sistema atual 1 para 1; confirmar se os itens adicionais e a multi-moeda entram nesta sprint. Se não entrarem, registrar como adiados.
- Alterar um preço **não** altera orçamentos já criados (o orçamento guarda o valor calculado na data).

**Dados**
- Serviço — seleção, obrigatório
- Idioma de origem / idioma de destino — seleção, obrigatório
- Preço por palavra — decimal, obrigatório, maior que 0, até 4 casas
- Moeda — texto, padrão BRL (❓ multi-moeda)
- Ativo — booleano, padrão verdadeiro

**Mensagens**
- Confirmação: "Preço salvo com sucesso."
- Erro: "Já existe um preço para este serviço e par de idiomas." · "Origem e destino não podem ser o mesmo idioma."
- Aviso: "O novo preço vale apenas para orçamentos futuros."

**Esboço de tela:** grade filtrável (serviço, origem, destino, preço, ativo); formulário em modal; ❓ seção de itens adicionais, se confirmada.

**Critérios de aceite**
- CA-03.1 — Admin cadastra Tradução pt-BR → en-US a 0,12 e a combinação aparece na grade.
- CA-03.2 — A mesma combinação ativa não pode ser repetida.
- CA-03.3 — Preço zero, negativo ou com origem igual ao destino é recusado.
- CA-03.4 — Alterar o preço não muda o valor de um orçamento já gerado.

---

### S2-04 — Cadastrar usuários internos (rank 4) ✅ / ❓
> Como administrador, quero cadastrar usuários internos informando nome, sobrenome, e-mail e perfil, para organizar o acesso da equipe.

**Regras de negócio**
- Só o Administrador cadastra usuários internos (Gestor de Projeto, Atendimento, Tradutor Interno/TQA e outros administradores); o Gestor de Projeto continua cadastrando apenas freelancers (S2-06).
- E-mail único em todo o sistema.
- Perfis: Administrador, Gestor de Projeto, Atendimento, Tradutor Interno (TQA) 🔶 (o TQA é citado pelo cliente como perfil com acesso ao painel; o que mais ele faz é ❓ D-13).
- ✅ Gestor de Projeto, Atendimento e demais internos: cadastro com nome, sobrenome e e-mail. ❓ D-02: para o Administrador o cliente respondeu "sem nada preenchido" — tratar como sem campos adicionais.
- 🔶 A senha inicial é definida no cadastro (como hoje) e o usuário é orientado a trocá-la no primeiro acesso.
- **Migração:** usuários já cadastrados com um único campo de nome devem ser preservados; o sobrenome dos registros antigos fica vazio e pode ser completado depois.
- Usuário novo entra com status Ativo.

**Dados**
- Nome — texto, obrigatório, máx. 60 caracteres
- Sobrenome — texto, obrigatório para novos cadastros, máx. 60 caracteres
- E-mail — texto, obrigatório, formato válido, único
- Perfil — seleção, obrigatório
- Senha inicial — texto, obrigatório, mínimo 8 caracteres 🔶
- Status — ativo/inativo, padrão ativo

**Mensagens**
- Confirmação: "Usuário [nome] cadastrado com sucesso."
- Erro: "Já existe um usuário cadastrado com este e-mail."
- Aviso: "Informe nome e sobrenome para concluir o cadastro."

**Esboço de tela:** formulário (nome, sobrenome, e-mail, perfil, senha inicial) + lista de usuários internos com busca e filtro por perfil.

**Critérios de aceite**
- CA-04.1 — Admin cadastra um Atendimento com nome, sobrenome e e-mail; ele consegue entrar e vê só o menu de Atendimento.
- CA-04.2 — E-mail repetido é recusado.
- CA-04.3 — Usuários criados antes da mudança continuam entrando normalmente após a migração.
- CA-04.4 — Não-admin não cadastra usuário interno (403).

---

### S2-05 — Cadastrar clientes: Empresa e Pessoa (rank 5) ✅ / ❓
> Como atendimento, quero cadastrar clientes como Empresa (pessoa jurídica) ou Pessoa (pessoa física), com seus contatos, para organizar quem solicita os serviços.

**Regras de negócio**
- Só o Atendimento cadastra clientes (✅ papel confirmado em 03/09).
- O cadastro começa pela escolha do tipo: **Empresa (Pessoa Jurídica)** ou **Pessoa (Pessoa Física)** ✅.
- Empresa: nome, e-mail principal, site, telefone principal, informações gerais (bloco de texto) e os **funcionários da empresa** — quantos quiser — cada um com nome, sobrenome, e-mail, telefone e informações gerais ✅.
- Pessoa: nome, sobrenome, e-mail, telefone e informações gerais (preferências) ✅.
- ❓ D-01: o cliente **não citou CNPJ nem departamentos**. Proposta 🔶 até a confirmação: CNPJ opcional (se informado, mantém a validação de dígitos e a unicidade já implementadas) e departamento fora do formulário. Os dados já gravados em S1-5 são preservados.
- E-mail principal único entre clientes ❓ (confirmar se duas empresas podem repetir e-mail).
- Cliente com histórico (requisição, orçamento, OS) não é excluído, apenas inativado (RT-4).
- Esta story depende da decisão sobre o PR #27 e a renomeação (D-04).

**Dados — Empresa**
- Nome — texto, obrigatório, máx. 120 caracteres
- E-mail principal — texto, obrigatório, formato válido
- Site — texto, opcional, URL válida
- Telefone principal — texto, obrigatório
- Informações gerais — texto longo, opcional
- Tipo — fixo "Pessoa Jurídica"
- CNPJ — texto, opcional, validado e único quando informado ❓
- Funcionários (lista, zero ou mais): nome (obrigatório), sobrenome (obrigatório), e-mail (obrigatório, formato válido), telefone (obrigatório), informações gerais (opcional)

**Dados — Pessoa**
- Nome, sobrenome — texto, obrigatórios
- E-mail — texto, obrigatório, formato válido
- Telefone — texto, obrigatório
- Informações gerais/preferências — texto longo, opcional
- Tipo — fixo "Pessoa Física"

**Mensagens**
- Confirmação: "Cliente [nome] cadastrado com sucesso."
- Erro: "Já existe um cliente cadastrado com este e-mail." · "CNPJ inválido." · "Já existe uma empresa cadastrada com este CNPJ."
- Aviso: "Informe nome, e-mail e telefone para concluir o cadastro."

**Esboço de tela:** seletor Empresa/Pessoa no topo; formulário correspondente; na Empresa, bloco "Funcionários" com "+ Adicionar" e "Remover" em cada cartão (campos vazios não bloqueiam o envio); lista de clientes com busca.

**Critérios de aceite**
- CA-05.1 — Atendimento cadastra uma Empresa com dois funcionários e ambos aparecem no detalhe.
- CA-05.2 — Atendimento cadastra uma Pessoa Física sem nenhum campo de empresa.
- CA-05.3 — E-mail inválido ou campo obrigatório vazio é recusado com mensagem do campo.
- CA-05.4 — Empresas já cadastradas na Sprint 1 continuam visíveis e editáveis.
- CA-05.5 — Outros perfis, exceto Admin e Atendimento, não cadastram clientes (403).

---

### S2-06 — Pré-cadastrar freelancer (rank 6) ✅
> Como gestor de projeto, quero pré-cadastrar um freelancer informando nome, sobrenome e e-mail, para que ele complete o próprio cadastro.

**Regras de negócio**
- Só o Gestor de Projeto (e o Administrador) pré-cadastra. O freelancer **não inicia** o próprio cadastro ✅.
- O pré-cadastro pede apenas nome, sobrenome e e-mail ✅.
- E-mail único em todo o sistema.
- Status inicial: **Pendente**, até o freelancer completar o cadastro (S2-07).
- O freelancer pré-cadastrado ainda não recebe trabalho.

**Dados**
- Nome — texto, obrigatório, máx. 60 caracteres
- Sobrenome — texto, obrigatório, máx. 60 caracteres
- E-mail — texto, obrigatório, formato válido, único
- Status — gerado pelo sistema

**Mensagens**
- Confirmação: "Freelancer pré-cadastrado."
- Erro: "Já existe um freelancer cadastrado com este e-mail."

**Esboço de tela:** formulário simples (nome, sobrenome, e-mail) + botão "Pré-cadastrar"; lista de freelancers com status.

**Critérios de aceite**
- CA-06.1 — Gestor pré-cadastra um freelancer; ele aparece na lista com status "Pendente".
- CA-06.2 — E-mail duplicado é recusado.
- CA-06.3 — Freelancer pré-cadastrado ainda **não** consegue receber trabalho.
---

### S2-07 — Freelancer completa o cadastro — fase 1 (rank 7) ✅ / ❓
> Como freelancer, quero completar meu cadastro informando meu perfil, idiomas de partida, chegada e nativo e os tipos de serviço que presto, para finalizar minha entrada na base de prestadores.

**Regras de negócio**
- Acessível somente a freelancer pré-cadastrado (S2-06).
- Os campos vêm do manual do cliente ✅; esta story cobre a **fase 1**. Áreas de domínio e softwares (S2-23), disponibilidade (S2-24), termo e documentos (S2-25) e pagamento (S2-26) vêm nas fases seguintes.
- Obrigatórios para concluir: ao menos 1 tipo de serviço, 1 idioma de partida, 1 idioma de chegada e 1 idioma nativo. Os idiomas e serviços são escolhidos das listas do admin (S2-01, S2-02).
- Ao concluir, o cadastro é **ativado automaticamente** (S2-08).
- ❓ D-05: o campo "tipo de freelancer" (tradutor/revisor/formatador/intérprete) criado na Sprint 1 continua até o cliente confirmar se pode ser derivado do tipo de serviço. Enquanto isso, ele é mantido e preenchido.
- ❓ D-06: confirmar quais campos opcionais do manual são necessários; os abaixo são os do formulário do cliente.

**Dados**
- Forma de tratamento — seleção, opcional
- Título acadêmico — texto, opcional
- Função — texto, opcional
- Data de nascimento — data, opcional, não futura
- Telefone — texto, opcional
- Fuso horário — seleção, padrão America/Sao_Paulo
- Tipo(s) de serviço — multisseleção, obrigatório (ao menos 1)
- Idioma(s) de partida / chegada / nativo — multisseleção, obrigatório (ao menos 1 de cada)
- Foto — imagem JPG/PNG, opcional, até 5 MB
- Tipo de freelancer — seleção, obrigatório (mantido da Sprint 1) ❓

**Mensagens**
- Confirmação: "Cadastro concluído com sucesso!"
- Erro: "Selecione ao menos um idioma de partida, um de chegada e um nativo." · "Selecione ao menos um tipo de serviço."
- Aviso: "A foto precisa ser JPG ou PNG de até 5 MB."

**Esboço de tela:** formulário em etapas — (1) dados pessoais e foto, (2) idiomas, (3) serviços, (4) revisão e envio; barra de progresso.

**Critérios de aceite**
- CA-07.1 — Freelancer pré-cadastrado completa as etapas e o cadastro é ativado automaticamente.
- CA-07.2 — Sem idioma nativo, de partida, de chegada ou serviço, o envio é recusado.
- CA-07.3 — Só idiomas e serviços ativos aparecem nos seletores.
- CA-07.4 — Data de nascimento futura é recusada.

---

### S2-08 — Ativação automática do freelancer (rank 8) ✅
> Como gestor de projeto, quero que o cadastro do freelancer seja ativado automaticamente quando ele completar as informações, para liberar o acesso dele ao trabalho.

**Regras de negócio**
- A ativação é por **mudança de status**, nunca por troca de grupo de permissão ✅.
- Ao completar o cadastro (S2-07), o status deixa de ser **Pendente** e o freelancer fica disponível.
- Só freelancer com cadastro completo pode receber solicitações de disponibilidade e etapas (S2-14).
- O Gestor de Projeto acompanha os freelancers e seus status na lista de freelancers.

**Mensagens**
- Confirmação: "Cadastro concluído com sucesso!"

**Critérios de aceite**
- CA-08.1 — Ao completar o cadastro, o freelancer passa a aparecer nas listas de atribuição.
- CA-08.2 — Freelancer com cadastro incompleto não aparece na atribuição.
- CA-08.3 — Atendimento e freelancer não alteram o status de outro freelancer (403).
---

### S2-09 — Registrar requisição de orçamento (rank 9) 🔶 / ❓
> Como atendimento, quero registrar uma requisição de orçamento recebida do cliente, para dar início ao processo de orçamento.

**Regras de negócio**
- ✅ O **cliente não acessa o sistema**: a requisição chega por e-mail/telefone/site e o Atendimento a registra. A recepção automática pelo formulário do site é a story #30 da Sprint 3.
- ❓ D-03: as telas voltadas ao cliente já criadas (solicitação de orçamento) devem ser retiradas do fluxo ou adaptadas ao Atendimento; a decisão anterior da equipe foi não expor o cliente ao sistema.
- A requisição é vinculada a um cliente cadastrado (S2-05) ou, se ainda não cadastrado, o Atendimento o cadastra antes.
- Status: **Nova** → **Em análise** → **Aprovada** (vira orçamento) ou **Recusada** (com motivo).
- Idioma de origem diferente do de destino; serviço e idiomas ativos.

**Dados**
- Cliente — seleção, obrigatório
- Contato — seleção entre os funcionários da empresa, opcional
- Serviço — seleção, obrigatório
- Idioma de origem / destino — seleção, obrigatório
- Quantidade de palavras — inteiro, opcional na requisição (obrigatório no orçamento) 🔶
- Prazo desejado — data, opcional
- Arquivos do cliente — upload, opcional
- Observações — texto longo, opcional
- Status — gerado pelo sistema

**Mensagens**
- Confirmação: "Requisição registrada com sucesso."
- Erro: "Origem e destino não podem ser o mesmo idioma."
- Aviso: "Cadastre o cliente antes de registrar a requisição."

**Esboço de tela:** lista de requisições com filtro por status; formulário de nova requisição; detalhe com botões "Analisar" e "Recusar".

**Critérios de aceite**
- CA-09.1 — Atendimento registra uma requisição para um cliente cadastrado e ela aparece como "Nova".
- CA-09.2 — Sem cliente, serviço ou idiomas, o registro é recusado.
- CA-09.3 — A lista usa a API (sem dados de exemplo).
- CA-09.4 — Gestor de Projeto e freelancer não registram requisição (403).

---

### S2-10 — Aprovar requisição e gerar orçamento (rank 10) ✅
> Como atendimento, quero analisar uma requisição e aprová-la para que ela se torne um orçamento, informando prazo e observações, para formalizar o pedido de serviço.

**Regras de negócio**
- Só requisições "Nova" ou "Em análise" podem ser aprovadas.
- A aprovação cria um **orçamento** ligado 1 para 1 à requisição; a requisição passa a "Aprovada".
- **Valor calculado** = quantidade de palavras × preço por palavra do serviço e par de idiomas (S2-03). Se não houver preço para a combinação, o sistema avisa e o valor é informado manualmente (S2-11).
- O orçamento guarda o valor calculado, o preço usado e a data do cálculo (mudar a tabela depois não o altera).
- Status do orçamento: **Aguardando aprovação do cliente**.
- Recusar a requisição exige motivo.

**Dados**
- Quantidade de palavras — inteiro, obrigatório, maior que 0
- Prazo de entrega — data, obrigatório, não anterior a hoje
- Observações — texto longo, opcional
- Valor calculado — decimal, gerado, somente leitura
- Moeda — gerada (BRL)

**Mensagens**
- Confirmação: "Orçamento [número] gerado com sucesso."
- Erro: "Informe a quantidade de palavras." · "O prazo não pode ser anterior a hoje."
- Aviso: "Não há preço cadastrado para este serviço e par de idiomas. Informe o valor manualmente."

**Esboço de tela:** detalhe da requisição com bloco "Gerar orçamento" (palavras, prazo, observações, valor calculado) e botões "Aprovar e gerar orçamento" / "Recusar"; lista de orçamentos com status.

**Critérios de aceite**
- CA-10.1 — Requisição de Tradução pt-BR → en-US com 1.000 palavras e preço 0,12 gera orçamento de 120,00.
- CA-10.2 — A requisição passa a "Aprovada" e não gera um segundo orçamento.
- CA-10.3 — Sem preço cadastrado, o aviso aparece e o valor pode ser digitado.
- CA-10.4 — Recusa sem motivo é impedida.

---

### S2-11 — Ajustar manualmente o valor do orçamento (rank 11) ✅
> Como atendimento, quero ajustar manualmente o valor final de um orçamento sem alterar a tabela de preço padrão, para atender casos específicos.

**Regras de negócio**
- ✅ O cliente confirmou que o usuário pode ajustar o valor final **sem alterar a tabela padrão**.
- O ajuste vale só para aquele orçamento; o valor calculado original continua gravado.
- Só é possível ajustar enquanto o orçamento estiver "Aguardando aprovação do cliente".
- 🔶 Justificativa obrigatória do ajuste (rastreabilidade).
- Só o Atendimento ajusta.

**Dados**
- Valor final — decimal, obrigatório, maior que 0
- Justificativa — texto, obrigatório, máx. 255 caracteres 🔶

**Mensagens**
- Confirmação: "Valor do orçamento atualizado."
- Erro: "O valor deve ser maior que zero."
- Aviso: "Este ajuste vale apenas para este orçamento. A tabela de preços não será alterada."

**Esboço de tela:** no orçamento, campo "Valor final" editável ao lado do "Valor calculado" (somente leitura), com campo de justificativa e botão "Salvar ajuste".

**Critérios de aceite**
- CA-11.1 — Atendimento muda de 120,00 para 100,00; o orçamento mostra 100,00 e guarda 120,00 como calculado.
- CA-11.2 — A tabela de preços permanece igual.
- CA-11.3 — Orçamento já aprovado pelo cliente não pode mais ser ajustado.
- CA-11.4 — Sem justificativa, o ajuste é recusado.

---

### S2-12 — Registrar aprovação do cliente e gerar ordem de serviço (rank 12) ✅
> Como atendimento, quero registrar a aprovação do orçamento pelo cliente, para gerar a ordem de serviço.

**Regras de negócio**
- ✅ A aprovação do cliente acontece **fora do sistema**; o Atendimento apenas a registra.
- Só orçamento "Aguardando aprovação do cliente" pode ser aprovado.
- Ao registrar, o orçamento vira **Aprovado** e o sistema gera a **Ordem de Serviço (OS)** com número sequencial, vinculada à requisição e ao orçamento, com status **Aguardando projeto**.
- Se o cliente recusar: o orçamento vira **Recusado**, com motivo obrigatório, e nenhuma OS é criada.
- Uma OS por orçamento; a OS gerada não é excluída.

**Dados**
- Data da aprovação — data, obrigatória, padrão hoje, não futura
- Forma de comunicação — seleção (e-mail, telefone, outra), obrigatória 🔶
- Comprovante — anexo, opcional
- Motivo da recusa — texto, obrigatório apenas se recusado

**Mensagens**
- Confirmação: "Aprovação registrada. Ordem de serviço [número] gerada."
- Erro: "Este orçamento já foi aprovado."
- Aviso: "Informe o motivo da recusa."

**Esboço de tela:** no orçamento, botões "Registrar aprovação" e "Registrar recusa" com um pequeno formulário; lista de OS recém-criadas.

**Critérios de aceite**
- CA-12.1 — Aprovar gera exatamente uma OS ligada ao orçamento e à requisição.
- CA-12.2 — Tentar aprovar de novo é recusado.
- CA-12.3 — Recusar sem motivo é impedido; recusado não gera OS.
- CA-12.4 — A OS aparece para o Gestor de Projeto como "Aguardando projeto".

---

### S2-13 — Montar o projeto a partir do orçamento aprovado (rank 13) ✅
> Como gestor de projeto, quero ver o orçamento aprovado e montar o projeto a partir dele, escolhendo um modelo de workflow para definir as etapas, para estruturar o trabalho.

**Regras de negócio**
- O Gestor vê as OS "Aguardando projeto" com as informações do orçamento (cliente, serviço, idiomas, prazo, observações, arquivos).
- O projeto é criado a partir da OS e **herda** essas informações; as etapas vêm de um **modelo de workflow** existente (a trilha da Sprint 1), cada etapa com seu tipo de freelancer.
- As etapas são **copiadas** para o projeto: alterar o modelo depois não afeta projetos já criados.
- 🔶 O Gestor pode remover etapas ou mudar a ordem no projeto sem alterar o modelo (❓ confirmar se também pode adicionar).
- Uma OS tem um único projeto; ao criá-lo, a OS vira **Em projeto**.
- Valores cobrados do cliente ficam ocultos para freelancers (RT-5).

**Dados**
- Modelo de workflow — seleção, obrigatório
- Nome do projeto — texto, gerado a partir da OS, editável, máx. 120 caracteres
- Etapas (lista ordenada) — nome, tipo de freelancer necessário, ordem — copiadas do modelo

**Mensagens**
- Confirmação: "Projeto [nome] criado com [n] etapas."
- Erro: "Esta ordem de serviço já possui projeto."
- Aviso: "O projeto precisa ter ao menos uma etapa."

**Esboço de tela:** lista de OS aguardando projeto → detalhe com resumo do orçamento → seletor de modelo → pré-visualização das etapas reordenáveis → botão "Criar projeto".

**Critérios de aceite**
- CA-13.1 — Gestor escolhe um modelo de 3 etapas e o projeto nasce com 3 etapas na mesma ordem, ligado à OS.
- CA-13.2 — Alterar o modelo depois não muda o projeto criado.
- CA-13.3 — Não é possível criar um segundo projeto para a mesma OS nem um projeto sem etapas.
- CA-13.4 — Atendimento e freelancer não criam projeto (403).

---

### S2-14 — Atribuir freelancers às etapas (rank 14) ✅
> Como gestor de projeto, quero atribuir freelancers às etapas — diretamente ou solicitando disponibilidade a freelancers selecionados —, para distribuir o trabalho.

**Regras de negócio**
- ✅ O Gestor escolhe, por etapa, entre os métodos de atribuição. **MVP desta sprint:** (a) atribuição **direta** a um freelancer; (b) **solicitar disponibilidade** a vários freelancers selecionados — o **primeiro que aceitar** fica com a etapa. A seleção automática por "melhor posicionado" fica para evolução posterior (D-11, a comunicar ao cliente).
- ✅ O trabalho precisa ser **disponibilizado** pelo Gestor antes de o freelancer poder aceitá-lo.
- Só aparecem freelancers **Ativos** (S2-08), compatíveis com o tipo exigido pela etapa e com o serviço e os idiomas da OS.
- Quando alguém aceita, as demais solicitações daquela etapa são encerradas.
- 🔶 Na atribuição direta a etapa já fica **Atribuída** e o freelancer apenas é avisado (não precisa aceitar); na solicitação de disponibilidade, a etapa só é atribuída quando alguém aceita.
- Se uma solicitação ficar sem resposta, o Gestor pode cancelá-la e escolher outros.

**Dados**
- Etapa — seleção
- Método — seleção (direta / solicitar disponibilidade)
- Freelancer(s) — seleção (um, no direto; vários, na solicitação)
- Mensagem opcional ao freelancer — texto, máx. 255 caracteres
- Status da etapa — Sem freelancer · Aguardando aceite · Atribuída · Em andamento · Entregue

**Mensagens**
- Confirmação: "Etapa atribuída a [nome]." / "Solicitação de disponibilidade enviada a [n] freelancers."
- Erro: "Nenhum freelancer ativo compatível com esta etapa."
- Aviso: "Esta etapa já foi aceita por outro freelancer."

**Esboço de tela:** no projeto, cada etapa mostra seu status e o botão "Atribuir"; modal com escolha do método e lista de freelancers compatíveis com caixas de seleção.

**Critérios de aceite**
- CA-14.1 — Atribuição direta deixa a etapa "Atribuída" ao freelancer escolhido.
- CA-14.2 — Solicitação a 3 freelancers: o primeiro aceite fecha a etapa e os outros pedidos ficam encerrados.
- CA-14.3 — Freelancer não ativo ou incompatível não aparece na lista.
- CA-14.4 — Freelancer não consegue aceitar antes de o trabalho ser disponibilizado.

---

### S2-15 — Visualização e aceite do trabalho (rank 15) ✅
> Como freelancer, quero visualizar os trabalhos disponibilizados a mim e aceitá-los, para saber o que preciso executar.

**Regras de negócio**
- Só os freelancers escolhidos pelo Gestor veem o trabalho; ninguém mais.
- O freelancer vê: serviço, idiomas, prazo da etapa, observações e arquivos da etapa — **sem valor cobrado do cliente e sem dados do cliente** (RT-5).
- Ele pode **aceitar** o trabalho. Aceitar vincula a etapa a ele (a primeira aceitação vence em caso de disputa).
- Aceitar atualiza a etapa para "Atribuída" na tabela de serviços do projeto.

**Mensagens**
- Confirmação: "Trabalho aceito. A etapa foi atribuída a você."
- Erro/Aviso: "Este trabalho já foi aceito por outro freelancer."

**Esboço de tela:** "Meus trabalhos" com cartões (serviço, idiomas, prazo) e botão "Aceitar".

**Critérios de aceite**
- CA-15.1 — Freelancer selecionado vê o trabalho; um não selecionado não vê.
- CA-15.2 — Ao aceitar, a etapa fica atribuída a ele e o Gestor vê a atualização.
- CA-15.3 — Se outro aceitar antes, ele recebe o aviso e nada muda.
- CA-15.4 — O freelancer não vê o valor do cliente nem os dados do cliente na tela.
---

# FAIXA 2 — PLANEJADA

### S2-16 — Acessar somente a própria etapa (rank 16) ✅
> Como freelancer, quero ter acesso apenas à etapa em que fui alocado, para preservar a confidencialidade das demais partes do projeto.

**Regras de negócio**
- O freelancer só consulta e altera etapas atribuídas a ele e os pedidos endereçados a ele.
- A restrição vale **na API**, não só na tela: acessar etapa, projeto ou arquivo de terceiros retorna 403/404.
- Não vê outras etapas, outros freelancers, nem preços cobrados.
- Já existe a regra de o freelancer atualizar só o status da própria etapa (PR #18); esta story a amplia para leitura e arquivos.

**Dados:** não há dados novos; é uma regra de autorização.
**Mensagens:** erro "Você não tem acesso a esta etapa."
**Esboço de tela:** a tela do freelancer lista apenas as etapas dele.

**Critérios de aceite**
- CA-16.1 — Freelancer A consulta pela API a etapa de B e recebe 403/404.
- CA-16.2 — A lista do freelancer mostra só suas etapas.
- CA-16.3 — Arquivos de etapas de outros freelancers não são baixáveis.

---

### S2-17 — Entregar o arquivo da etapa (rank 17) ✅
> Como freelancer, quero entregar o arquivo referente à minha etapa, para concluir minha parte do trabalho.

**Regras de negócio**
- Só a etapa atribuída ao freelancer e em andamento aceita entrega.
- Pelo menos 1 arquivo; 🔶 formatos DOC/DOCX, XLS/XLSX, PPT/PPTX, PDF, TXT, INDD, ZIP; até 20 MB por arquivo.
- Ao entregar, a etapa passa a **Entregue** e a data/hora fica registrada.
- 🔶 Até a próxima etapa começar, o freelancer pode substituir o arquivo.
- Para iniciar o trabalho o freelancer marca "Iniciar" (etapa → Em andamento) 🔶.

**Dados**
- Arquivo(s) — upload, obrigatório
- Observações da entrega — texto, opcional

**Mensagens**
- Confirmação: "Entrega registrada com sucesso."
- Erro: "Anexe ao menos um arquivo." · "Formato de arquivo não permitido."

**Esboço de tela:** na etapa, botões "Iniciar" e "Entregar"; área de arrastar/selecionar arquivos; lista de arquivos entregues.

**Critérios de aceite**
- CA-17.1 — Freelancer envia um arquivo válido; a etapa vira "Entregue" e o arquivo fica disponível ao Gestor.
- CA-17.2 — Sem arquivo ou com formato inválido, a entrega é recusada.
- CA-17.3 — Outro freelancer não consegue entregar nessa etapa.

---

### S2-18 — Encaminhar automaticamente para a próxima etapa (rank 18) ✅
> Como gestor de projeto, quero que o trabalho siga automaticamente para a próxima etapa assim que uma etapa for entregue, para manter o fluxo sem intervenção manual.

**Regras de negócio**
- Ao entregar uma etapa, a próxima na ordem é liberada. Se já tem freelancer atribuído, ele é avisado e o **arquivo entregue fica disponível a ele** (ex.: o texto traduzido vai para o revisor).
- Se a próxima etapa não tem freelancer, o Gestor é avisado e ela aparece como "Sem freelancer".
- Entregue a última etapa, o projeto passa a **Aguardando conferência**.
- A ordem das etapas segue a do projeto (a ordem salva é respeitada).

**Dados:** sem dados novos; mudança de status e aviso.
**Mensagens:** ao freelancer — "Nova etapa disponível para você."; ao Gestor — "Etapa [nome] entregue. A próxima etapa precisa de freelancer."
**Esboço de tela:** linha do tempo do projeto com os status das etapas.

**Critérios de aceite**
- CA-18.1 — Entregar a etapa 1 libera a 2 e avisa o freelancer dela.
- CA-18.2 — O freelancer da etapa 2 vê o arquivo entregue na etapa 1 (e só esse).
- CA-18.3 — Etapa seguinte sem freelancer gera aviso ao Gestor.
- CA-18.4 — Entregar a última etapa muda o projeto para "Aguardando conferência".

---

### S2-19 — Lista de OS sem e com freelancer (rank 19) ✅
> Como gestor de projeto, quero visualizar a lista de ordens de serviço sem freelancer atribuído e já atribuídas, para acompanhar a distribuição do trabalho.

**Regras de negócio**
- É uma tela de acompanhamento: o Gestor enxerga o que ainda falta alocar.
- Filtros: **Sem freelancer atribuído**, **Já atribuídas** (todas as etapas), **Parcialmente atribuídas**, Todas.
- Cada linha: número da OS, cliente, serviço, idiomas, prazo, etapas atribuídas/total e status.
- Abrir uma linha leva ao projeto (S2-13/S2-14).
- Visível para Gestor de Projeto e Administrador; Atendimento apenas consulta.

**Dados:** não há dados novos; consulta com filtros.
**Mensagens:** vazio — "Nenhuma ordem de serviço encontrada com este filtro."
**Esboço de tela:** tabela com abas ou filtros no topo e contadores por filtro.

**Critérios de aceite**
- CA-19.1 — Com 2 OS, uma com todas as etapas atribuídas e outra sem nenhuma, cada filtro mostra a OS correta.
- CA-19.2 — A contagem "atribuídas/total" bate com o projeto.
- CA-19.3 — Freelancer não acessa a lista (403).

---

### S2-20 — Verificar etapas e repassar ao Atendimento (rank 20) ✅
> Como gestor de projeto, quero verificar todas as etapas concluídas e repassar o projeto ao Atendimento, para garantir que nada ficou pendente antes da entrega ao cliente.

**Regras de negócio**
- O Gestor vê todas as etapas, quem as fez, as datas e os arquivos entregues.
- Só pode marcar o projeto como **Concluído** quando **todas** as etapas estiverem Entregues.
- Concluído o projeto, ele é repassado ao Atendimento com status **Pronto para envio ao cliente**.
- ✅ O envio do resultado ao cliente é feito **pelo Atendimento, manualmente, fora do sistema**; o sistema não envia e-mail ao cliente. O registro de "entregue" é a story #22 da Sprint 3.

**Dados**
- Observações da conferência — texto, opcional

**Mensagens**
- Confirmação: "Projeto concluído e repassado ao Atendimento."
- Erro/Aviso: "Há etapas ainda não entregues. Conclua todas antes de repassar."

**Esboço de tela:** resumo do projeto com checklist das etapas e arquivos; botão "Concluir e repassar" (desabilitado enquanto houver pendência).

**Critérios de aceite**
- CA-20.1 — Com uma etapa pendente, concluir é recusado com o aviso.
- CA-20.2 — Com todas entregues, o projeto vira "Concluído" e o Atendimento o vê como "Pronto para envio".
- CA-20.3 — O sistema não envia nenhum e-mail ao cliente.

---

### S2-21 — Perfis e menus por usuário, versão mínima (rank 21) ✅ / ❓
> Como administrador, quero que cada perfil enxergue e acesse somente os menus e funcionalidades do seu perfil, para proteger as informações do negócio.

**Regras de negócio**
- ✅ O cliente aprovou organizar a exibição por **perfil de login**.
- Perfis: Administrador, Gestor de Projeto, Atendimento, Tradutor Interno (TQA) 🔶, Freelancer.
- ✅ **Painel de trabalhos ativos e concluídos** (tela da Sprint 3): Administrador, Atendimento, Gestor de Projeto e Tradutor Interno (TQA); não para freelancers.
- Matriz provisória de menus 🔶 (vale até o cliente enviar o mapeamento completo — D-07):

| Menu / funcionalidade | Admin | Gestor de Projeto | Atendimento | TQA | Freelancer |
|---|:---:|:---:|:---:|:---:|:---:|
| Configurações (idiomas, serviços, preços, listas) | ✔ | consulta | consulta | — | — |
| Usuários internos | ✔ | — | — | — | — |
| Clientes | ✔ | consulta | ✔ | — | — |
| Freelancers (pré-cadastro, revisão) | ✔ | ✔ | — | — | — |
| Requisições e orçamentos | ✔ | consulta | ✔ | — | — |
| Ordens de serviço / projetos / atribuição | ✔ | ✔ | consulta | — | — |
| Modelos de workflow | ✔ | ✔ | — | — | — |
| Meus trabalhos / entrega | — | — | — | ❓ | ✔ |
| Painel de trabalhos ativos e concluídos (Sprint 3) | ✔ | ✔ | ✔ | ✔ | — |

- A restrição vale **no backend** (autorização por perfil em cada rota) e no front (o menu só mostra o que o perfil acessa).
- ❓ D-13: o que o TQA faz além de ver o painel.

**Dados:** o perfil já existe no usuário; esta story acrescenta o perfil TQA e a tabela de permissões por rota.
**Mensagens:** erro "Você não tem permissão para acessar esta área."
**Esboço de tela:** menu lateral que muda conforme o perfil logado.

**Critérios de aceite**
- CA-21.1 — Cada perfil, ao entrar, vê apenas os menus da matriz.
- CA-21.2 — Chamar pela API uma rota fora do perfil retorna 403, mesmo digitando a URL.
- CA-21.3 — Um usuário com perfil TQA consegue ser criado e entra com o menu definido.

---

# FAIXA 3 — COMPLEMENTAR

### S2-22 — Cadastrar áreas de domínio e softwares (rank 22) ✅
> Como administrador, quero cadastrar as áreas de domínio e os softwares usados pelos freelancers, para que eles os selecionem no próprio cadastro.

**Regras de negócio**
- ✅ O cliente confirmou que classificações como idioma e especialidade são **lista fixa, ajustável pelo administrador**.
- Nome único em cada lista; item em uso é inativado, não excluído.
- 🔶 Sementes do manual do cliente — áreas: Acadêmica, Agronegócio, Biológica, Comércio Exterior, Contábil, Documentos Pessoais, Engenharia, Farmacêutica, Financeira, Humanas, Jogos, Tecnologia da Informação (a lista completa vem do cliente); softwares: ABBYY, Acrobat Pro, Across, FrameMaker, Illustrator, InDesign, MemoQ, MS Office, MultiTrans, Photoshop, SDLX, SmartCat.

**Dados** (para cada lista)
- Nome — texto, obrigatório, máx. 80 caracteres, único
- Ativo — booleano, padrão verdadeiro

**Mensagens:** "Item [nome] salvo com sucesso." · erro "Já existe um item com este nome." · aviso "Este item está em uso e não pode ser excluído. Você pode inativá-lo."
**Esboço de tela:** duas abas (Áreas de domínio / Softwares), cada uma com lista e formulário simples.

**Critérios de aceite**
- CA-22.1 — Admin cadastra "Engenharia" e o item aparece no cadastro do freelancer.
- CA-22.2 — Nome duplicado é recusado; item em uso só pode ser inativado.
- CA-22.3 — Não-admin recebe 403.

---

### S2-23 — Freelancer informa áreas de domínio e softwares (rank 23) ✅
> Como freelancer, quero informar minhas áreas de domínio e os softwares que utilizo, para completar meu perfil profissional.

**Regras de negócio**
- Extensão do cadastro de S2-07 (fase 2); itens escolhidos das listas de S2-22.
- ✅ Áreas de domínio e softwares são obrigatórios no formulário do cliente — ❓ D-06 confirma se continuam obrigatórios.
- O freelancer pode editar depois, mesmo ativo; alterações ficam registradas na data.

**Dados**
- Áreas de domínio — multisseleção, obrigatório (ao menos 1) ❓
- Softwares — multisseleção, obrigatório (ao menos 1) ❓

**Mensagens:** "Informações profissionais salvas." · erro "Selecione ao menos uma área de domínio." / "Selecione ao menos um software."
**Esboço de tela:** nova etapa do formulário multi-etapa e seção editável no perfil.

**Critérios de aceite**
- CA-23.1 — Freelancer escolhe 2 áreas e 3 softwares e eles aparecem no perfil e na revisão do Gestor.
- CA-23.2 — Sem seleção obrigatória, não conclui a fase.

---

### S2-24 — Informar disponibilidade e ausências (rank 24) ✅
> Como freelancer, quero informar meus horários de trabalho e minhas ausências, para que só me ofereçam trabalho quando estou disponível.

**Regras de negócio**
- **Horário de trabalho:** calendário semanal (segunda a domingo) em faixas de horário, no fuso do freelancer; pode ter data de início de validade.
- **Ausência:** motivo, descrição, registro **dia inteiro** ou **por hora**, período (início e fim).
- Fim não pode ser anterior ao início; ausências não se sobrepõem a outras do mesmo freelancer.
- 🔶 Na seleção de freelancers (S2-14), o Gestor vê um indicador de disponível/ausente; não bloqueia a atribuição.

**Dados**
- Faixas semanais — dia da semana, hora de início, hora de fim
- Ausência — motivo (seleção), memorando (texto), registro (dia inteiro/por hora), início, fim (data/hora)

**Mensagens:** "Disponibilidade salva." · "Ausência registrada." · erro "O fim da ausência não pode ser anterior ao início." · "Já existe uma ausência neste período."
**Esboço de tela:** grade semanal onde se marca/desmarca horários e botão "Adicionar ausência" com formulário em janela.

**Critérios de aceite**
- CA-24.1 — Marcar segunda a sexta, 9h–12h, salva e reaparece igual.
- CA-24.2 — Ausência com fim anterior ao início é recusada; sobreposição também.
- CA-24.3 — O Gestor vê a indicação de ausência na lista de atribuição.

---

### S2-25 — Enviar termo de confidencialidade, documentos e certificações (rank 25) ✅
> Como freelancer, quero enviar o termo de confidencialidade assinado e meus documentos e certificações, para concluir minha habilitação.

**Regras de negócio**
- ✅ O termo é obrigatório. O sistema disponibiliza o **modelo do termo** para download (o admin o cadastra como documento).
- Duas categorias de envio: **Certificações** (tradutor público, ATA, NAATI etc.) e **Documentação** (RG/CNH, RNE, comprovante de residência etc.), como no manual do cliente.
- Pelo menos o termo assinado é obrigatório para concluir; os demais ❓ D-06.
- Arquivos em PDF, JPG ou PNG, até 10 MB cada 🔶.
- O Gestor visualiza os arquivos na revisão (S2-08).
- Documentos pessoais ficam visíveis apenas para o próprio freelancer, o Gestor de Projeto e o Administrador.

**Dados**
- Termo assinado — arquivo, obrigatório
- Certificações — arquivos, opcional
- Documentação — arquivos, opcional ❓

**Mensagens:** "Arquivo enviado com sucesso." · erro "É necessário enviar o termo de confidencialidade assinado." · "Formato ou tamanho de arquivo não permitido."
**Esboço de tela:** etapa do formulário com botão de baixar o modelo e áreas de envio separadas por categoria.

**Critérios de aceite**
- CA-25.1 — Freelancer baixa o modelo e envia o termo assinado; o arquivo aparece na revisão do Gestor.
- CA-25.2 — Sem o termo, não conclui o cadastro.
- CA-25.3 — Outro freelancer e o Atendimento não conseguem acessar os documentos (403).

---

### S2-26 — Informar dados de pagamento (rank 26) ✅
> Como freelancer, quero informar meus dados de pagamento, para que a Aliança possa me pagar pelos serviços.

**Regras de negócio**
- ✅ Obrigatório no formulário do cliente.
- **Conta brasileira:** banco, agência, conta corrente com dígito, nome do titular e CPF/CNPJ do titular.
- **Conta internacional:** banco, titular, IBAN, código bancário, número da conta, SWIFT-BIC, endereço do banco e país.
- Validar CPF/CNPJ; exibir campos conforme o tipo escolhido.
- Dados bancários são sensíveis: visíveis só para o próprio freelancer, o Administrador e (futuramente) o Financeiro; nunca em logs; ❓ avaliar criptografia.
- Esses dados alimentam a fatura de compra da Sprint 3.

**Dados**
- Tipo de conta — seleção (brasileira/internacional), obrigatório
- Brasileira: banco, agência, conta com dígito, titular, CPF/CNPJ — obrigatórios
- Internacional: banco, titular, IBAN, código bancário, número da conta, SWIFT-BIC, endereço do banco, país — obrigatórios

**Mensagens:** "Dados de pagamento salvos." · erro "CPF/CNPJ inválido." · "Preencha todos os campos da conta."
**Esboço de tela:** etapa do formulário com alternância "Conta brasileira / Conta internacional".

**Critérios de aceite**
- CA-26.1 — Conta brasileira com CPF válido é salva.
- CA-26.2 — CPF/CNPJ inválido ou campo vazio é recusado.
- CA-26.3 — Gestor de Projeto não vê os dados bancários; Administrador vê.

---

### S2-27 — Completar o próprio perfil de usuário interno (rank 27) ✅
> Como colaborador interno, quero incluir minha data de nascimento, foto e telefone no meu perfil, para completar meus dados.

**Regras de negócio**
- ✅ Esses três campos são preenchidos pelo próprio usuário depois do cadastro; são opcionais.
- Cada um edita apenas o próprio perfil.
- Foto: JPG ou PNG, até 5 MB. Data de nascimento não futura.
- Vale para Gestor de Projeto, Atendimento, TQA e Administrador.

**Dados**
- Data de nascimento — data, opcional
- Telefone — texto, opcional
- Foto — imagem, opcional

**Mensagens:** "Perfil atualizado com sucesso." · erro "A foto precisa ser JPG ou PNG de até 5 MB." · "Data de nascimento inválida."
**Esboço de tela:** "Meu perfil" com avatar, campos editáveis e botão Salvar.

**Critérios de aceite**
- CA-27.1 — Usuário salva os três campos e eles reaparecem ao entrar de novo.
- CA-27.2 — Um usuário não consegue editar o perfil de outro (403).
- CA-27.3 — Foto fora do formato é recusada.

---

### S2-28 — Grupos de permissão configuráveis (rank 28) ✅ / ❓
> Como administrador, quero criar e editar grupos de permissão com controles por módulo e ação, para adaptar os perfis internos à estrutura real da empresa.

**Regras de negócio**
- ✅ Decisão já tomada: os grupos devem ser **totalmente configuráveis**, e não papéis fixos no código; o cliente tem perfis granulares (ex.: "Fatura de venda: criar / alterar status / eliminar").
- ❓ D-12: o README do repositório adia esta story para "evolução posterior", mantendo os perfis fixos da S2-21. Decidir se entra nesta sprint ou passa para a Sprint 3 — e comunicar.
- Cada grupo tem permissões por módulo e ação (ver, criar, editar, inativar).
- Um usuário pertence a um grupo; alterar o grupo muda o acesso na hora.
- Grupos em uso não são excluídos. O grupo Administrador não pode ficar sem nenhuma permissão.
- ✅ Ativar um freelancer **não** é troca de grupo (é mudança de status).

**Dados**
- Nome do grupo — texto, obrigatório, único, máx. 60 caracteres
- Permissões — por módulo, marcação de ações
- Descrição — texto, opcional

**Mensagens:** "Grupo [nome] salvo com sucesso." · erro "Já existe um grupo com este nome." · aviso "Este grupo possui usuários e não pode ser excluído."
**Esboço de tela:** lista de grupos e uma matriz módulo × ação com caixas de seleção.

**Critérios de aceite**
- CA-28.1 — Admin cria o grupo "Financeiro" só com acesso a faturas; o usuário desse grupo vê só esses menus.
- CA-28.2 — Remover uma permissão do grupo tem efeito no próximo acesso.
- CA-28.3 — Grupo com usuários não pode ser excluído.
