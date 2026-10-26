# Frontend do SoftTranslations

Frontend em Expo, React Native e TypeScript, com rotas definidas pelo
Expo Router. A aplicação pode ser executada na web ou em um dispositivo de
desenvolvimento pelo Expo Go.

## Executar localmente

O guia completo de configuração do backend, PostgreSQL, variáveis de ambiente
e execução em rede está no [Manual de Instalação](../docs/instalation_manual.md).

Na pasta `Front-Geral`, instale as dependências e inicie a versão web:

```text
npm install
npm run web
```

Para iniciar o Expo no modo LAN e abrir o app com Expo Go:

```text
npx expo start --lan
```

O backend deve estar ativo na porta `8000`. No navegador do mesmo computador,
a URL padrão da API é `http://localhost:8000`. Em um dispositivo físico, use
`EXPO_PUBLIC_API_URL` em `Front-Geral/.env` para apontar ao endereço IPv4 do
computador que executa o backend. Exemplo:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
```

Reinicie o Expo depois de alterar o arquivo `.env`. Não use `localhost` como
host da API quando o app estiver rodando em um celular: nesse caso, ele se
refere ao próprio dispositivo.

## Comandos disponíveis

| Comando | Uso |
| --- | --- |
| `npm run web` | Inicia a aplicação no navegador. |
| `npx expo start --lan` | Inicia o Expo para acesso na rede local. |
| `npm run android` | Inicia o Expo com alvo Android configurado. |
| `npm run ios` | Inicia o Expo com alvo iOS configurado. |
| `npm run lint` | Executa o lint do Expo. |

## Estrutura

- `app/`: telas e rotas do Expo Router, agrupadas por perfil e fluxo.
- `components/`: componentes compartilhados e formulários.
- `context/`: contexto de autenticação.
- `services/`: integração HTTP com a API.
- `hooks/`: hooks compartilhados.
- `assets/`: recursos visuais e fontes do aplicativo.

O diretório `app/` define a navegação do app; telas e serviços devem continuar
usando as rotas e padrões já adotados no projeto.
