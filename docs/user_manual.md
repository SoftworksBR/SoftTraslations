# Manual do Usuário — SoftTranslations

Este manual descreve como usar as funções atualmente disponíveis no
SoftTranslations. As telas são responsivas e podem ser abertas em um navegador;
os menus e as ações disponíveis dependem do perfil da conta. Este guia não usa
capturas de tela: os nomes e os passos abaixo descrevem as áreas e os fluxos
diretamente.

## Sumário

- [O que o sistema faz](#o-que-o-sistema-faz)
- [Solicitar um serviço](#solicitar-um-servico)
- [Entrar e navegar](#entrar-e-navegar)
- [Administrador](#administrador)
- [Atendimento](#atendimento)
- [Gestor de projetos](#gestor-de-projetos)
- [Tradutor freelancer](#tradutor-freelancer)
- [Situações e regras do fluxo](#situacoes-e-regras-do-fluxo)
- [Problemas comuns](#problemas-comuns)
- [Recursos ainda não disponíveis na interface](#recursos-ainda-nao-disponiveis-na-interface)

## O que o sistema faz

O SoftTranslations reúne o recebimento de solicitações de tradução e o
trabalho interno da equipe. O fluxo principal é:

1. O cliente envia uma solicitação com seus dados, idiomas e serviço desejado.
2. O atendimento analisa a solicitação e prepara um orçamento.
3. O atendimento registra a aprovação ou a recusa do orçamento, após a decisão
   do cliente.
4. Com um orçamento aprovado, o gestor cria um projeto e escolhe uma ou mais
   trilhas de trabalho.
5. As etapas criadas para o projeto podem ser acompanhadas e atribuídas a
   tradutores.
6. O tradutor consulta as etapas vinculadas à sua conta.

| Perfil | Responsabilidade principal |
| --- | --- |
| Cliente sem conta | Enviar uma solicitação pública pelo formulário inicial. |
| Administrador | Gerenciar contas da equipe e consultar o painel administrativo. |
| Atendimento | Consultar solicitações, criar orçamentos e registrar decisões. |
| Gestor de projetos | Organizar projetos, trilhas, etapas e tradutores. |
| Tradutor freelancer | Completar o perfil pendente e consultar etapas atribuídas. |

## Solicitar um serviço

Não é necessário entrar na plataforma para enviar uma solicitação.

1. Abra a página inicial e selecione **Fazer uma solicitação**.
2. Na etapa **Dados da solicitação**, informe nome completo, e-mail e telefone.
   A empresa é opcional.
3. Escolha o idioma de origem, o idioma de destino e, se disponível, o serviço.
   Os idiomas e serviços são carregados das opções ativas no sistema.
4. Escreva uma descrição ou observação que ajude a equipe a entender o pedido.
5. Se necessário, anexe arquivos de referência. São aceitos PDF, DOC, DOCX,
   ODT, TXT, RTF, XLS, XLSX, PNG, JPG e JPEG. O limite é de 10 MB por arquivo e
   10 arquivos por solicitação.
6. Avance para **Revisão**, confira as informações e envie.
7. Aguarde a confirmação de envio. A equipe usará os dados de contato informados
   para dar continuidade ao atendimento.

Se um anexo falhar, a confirmação informa quais arquivos não foram enviados.
Envie novamente os arquivos que faltaram ou informe o problema ao atendimento.

## Entrar e navegar

1. Na página inicial, selecione **Acessar plataforma**.
2. Informe o e-mail e a senha fornecidos pela equipe e selecione **Entrar**.
3. Após a autenticação, o sistema abre a área adequada ao perfil.
4. Use o menu de navegação para acessar as áreas disponíveis. Para sair,
   selecione **Sair** no menu.

Os nomes e as opções de navegação podem mudar conforme o perfil e as permissões
da conta. Se a opção necessária não aparecer, peça ao administrador para
verificar seu perfil. Não compartilhe sua senha.

## Administrador

### Painel administrativo

O painel apresenta indicadores e uma visão da equipe retornada pela API. Se
alguma seção não tiver dados, confirme se os registros foram cadastrados e se a
API está acessível.

### Gerenciar funcionários

Na área **Funcionários**, o administrador pode consultar, filtrar, cadastrar,
editar e excluir contas de equipe. A busca localiza registros por nome ou
e-mail; os filtros permitem separar por perfil e situação.

Os perfis internos disponíveis para cadastro nessa área são **Administrador**,
**Atendimento** e **Projetos**. Freelancers são pré-cadastrados pelo gestor de
projetos. Confira o perfil escolhido antes de salvar, pois ele determina as
áreas às quais a conta terá acesso. A exclusão exige confirmação e pode ser
irreversível.

### Configurações

A área **Configurações** apresenta as seções **Idiomas**, **Serviços** e
**Preços**. No estado atual da interface, a integração dessas configurações
ainda está indisponível; não use essa área como confirmação de que uma alteração
foi salva.

## Atendimento

### Consultar solicitações

1. Abra **Requisições**.
2. Consulte os dados de contato, a empresa (quando informada), o par de idiomas,
   o serviço e as observações.
3. Abra os anexos associados para conferir os arquivos enviados, se houver.
4. Para iniciar o orçamento, use **Abrir orçamento** na solicitação
   correspondente.
5. Só exclua uma solicitação depois de confirmar que ela não deve continuar no
   fluxo. A interface pede confirmação antes de excluir.

Uma lista vazia significa que não há solicitações retornadas para a conta ou
que nenhum pedido foi enviado. Se uma falha aparecer, use **Tentar novamente**;
se persistir, confira a conexão com a API.

### Criar um orçamento

1. Abra a solicitação e selecione **Abrir orçamento**.
2. Confira os dados do cliente, o serviço e os idiomas antes de preencher.
3. Se houver uma tabela de preço aplicável, o formulário mostra uma sugestão
   calculada pelo preço por palavra e pela quantidade de palavras. A sugestão é
   apenas uma referência; revise ou informe manualmente o valor final.
4. Informe um valor maior que zero e o prazo no formato **DD/MM/AAAA**.
5. Adicione observações se forem importantes para a proposta e selecione
   **Criar orçamento**.

O orçamento recém-criado fica em análise. Há apenas um orçamento por
solicitação. Para acompanhar a proposta, abra **Orçamentos**.

### Registrar a decisão do cliente

Na lista de orçamentos, confira cliente, serviço, idiomas, valor, prazo,
observações e situação. Para um orçamento **Em análise**, use **Aprovar** ou
**Recusar** depois de obter a decisão do cliente:

- **Aprovar** libera o orçamento para que o gestor crie um projeto.
- **Recusar** também marca a solicitação relacionada como recusada.

Essas ações registram uma decisão no sistema; o envio de uma proposta ou a
coleta da resposta do cliente não é feito automaticamente por essa tela.

## Gestor de projetos

### Consultar orçamentos aprovados

Abra **Solicitações disponíveis** (área de orçamentos) para consultar as
propostas. Um orçamento aprovado e ainda não utilizado em projeto apresenta a
ação **Criar projeto**.

### Criar um projeto

1. Na proposta aprovada que será executada, selecione **Criar projeto**.
2. Confira os dados do orçamento que aparecem na tela.
3. Informe o nome do projeto.
4. Selecione pelo menos uma trilha. As etapas definidas nessa trilha serão
   criadas para o projeto.
5. Selecione **Criar projeto**.

Um orçamento aprovado só pode ser vinculado a um projeto e todo projeto precisa
de ao menos uma trilha.

### Consultar projetos

Em **Projetos**, pesquise pelo nome ou pela situação. Cada registro mostra o
nome, a situação e a quantidade de trilhas associadas. As situações apresentadas
são **Pronto**, **Em andamento**, **Em revisão** e **Concluído**.

### Organizar workflows e etapas

Abra **Workflow** para trabalhar com quadros/etapas e trilhas:

- **Etapas reutilizáveis** são modelos que podem compor trilhas.
- **Trilhas** agrupam etapas em uma sequência reutilizável. Para criar uma
  trilha, informe um nome e selecione pelo menos uma etapa cadastrada.
- As etapas instanciadas nos projetos podem ser consultadas e filtradas por
  nome, situação ou tradutor. Quando houver tradutores cadastrados, selecione
  um para atribuí-lo à etapa.

Antes de criar um projeto, confira se as etapas e a trilha necessárias já
existem. Uma tela sem etapas de projeto pode simplesmente indicar que ainda
não há projetos usando uma trilha.

### Gerenciar tradutores

Em **Tradutores**, pesquise por nome ou e-mail e filtre por situação. Use
**Pré-cadastrar tradutor** para criar o acesso inicial de um freelancer. O
tradutor deve completar o perfil para avançar no sistema; acompanhe as
informações retornadas e a situação do cadastro nessa lista.

## Tradutor freelancer

### Completar o perfil

Se a conta estiver pendente, o sistema direciona para **Completar perfil**.
Informe a data de nascimento no formato **AAAA-MM-DD** e o telefone. A
especialização, o valor por hora e a apresentação pessoal são opcionais.
Selecione **Salvar perfil** ao terminar.

### Consultar etapas atribuídas

Abra **Serviços disponíveis** para consultar as etapas vinculadas à sua conta e
a situação atual de cada uma:

- **Pronta**
- **Em andamento**
- **Em revisão**
- **Concluída**

Se a lista estiver vazia, ainda não há etapas associadas à sua conta. Confirme
com o gestor responsável se a etapa deveria ter sido atribuída. A tela atual é
de consulta das etapas; ações de aceite e envio de arquivo não estão disponíveis
nesta área da interface.

## Situações e regras do fluxo

| Registro | Situações | Significado |
| --- | --- | --- |
| Solicitação | Pendente, Orçada, Recusada | Recebida, vinculada a orçamento ou encerrada após recusa. |
| Orçamento | Em análise, Aprovado, Recusado | Aguardando decisão, liberado para projeto ou recusado. |
| Projeto/etapa | Pronto, Em andamento, Em revisão, Concluído | Situação do trabalho ou da etapa exibida na área correspondente. |
| Freelancer | Pendente, Disponível, Ocupado | Situação do cadastro/disponibilidade apresentada à equipe. |

As opções para editar ou excluir um registro dependem de sua situação e do
perfil autenticado. Por exemplo, uma solicitação com orçamento não pode ser
alterada pelo cliente; orçamentos podem ser decididos enquanto estão em análise.

## Problemas comuns

- **Não consigo entrar:** confira o e-mail e a senha. Se o acesso continuar
  falhando, peça ao administrador que confirme se a conta existe e está ativa.
- **Não vejo uma área no menu:** seu perfil pode não ter acesso a ela; consulte
  o administrador.
- **Uma lista está vazia:** confirme se existem registros e se foram atribuídos
  ao seu perfil. Uma lista vazia não indica, por si só, falha do sistema.
- **A API não responde:** atualize a tela e tente novamente. Se persistir,
  informe à equipe responsável qual área estava usando e a mensagem exibida.
- **A solicitação foi enviada, mas um anexo não:** consulte a mensagem de falha,
  verifique o tamanho e o formato e tente enviar o arquivo novamente.
- **A tela de configurações não salva:** a integração de idiomas, serviços e
  preços ainda não está disponível na interface atual.

## Recursos ainda não disponíveis na interface

O backlog do produto descreve funcionalidades futuras que não devem ser
confundidas com as ações disponíveis nas telas atuais. Entre elas estão o
acompanhamento de solicitações pelo próprio cliente, a decisão de orçamento
diretamente pelo cliente, o aceite de trabalhos e a entrega de arquivos pelo
tradutor, notificações automáticas e configurações administrativas funcionais
para idiomas, serviços e preços.
