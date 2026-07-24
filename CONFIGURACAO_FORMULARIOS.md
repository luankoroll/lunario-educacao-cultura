# Configuração dos formulários do Lunário

Este guia configura o formulário **Avaliação do caderno de Língua Portuguesa | 6º ano 01 | 2º trimestre de 2025** com:

- um Cloudflare Pages Worker em modo avançado como camada segura de servidor;
- Google Sheets como repositório privado das respostas;
- D1, no binding `FORM_DB`, somente para idempotência, limite de requisições e sessões administrativas;
- autenticação privada do administrador, exportação CSV/XLSX e proteção contra acesso público.

As respostas dos estudantes não são enviadas diretamente do navegador ao Google. O navegador chama uma rota em `/api/`, e somente o Worker usa as credenciais da conta de serviço. Os manipuladores permanecem separados em `functions/` e são incorporados ao `_worker.js` durante o build. O D1 não armazena respostas, endereço IP completo nem informações do dispositivo.

> **Importante:** nunca coloque a chave privada, senha, hash de senha ou segredos em arquivos versionados. O sistema foi projetado para falhar de forma fechada: se uma credencial ou o binding D1 estiver ausente, as rotas protegidas devem recusar a operação, sem liberar a página administrativa nem expor dados.

## 1. Criar a planilha no Google Sheets

1. Entre no Google Drive com a conta que será proprietária dos dados.
2. Crie uma planilha com o nome:

   `Avaliação do caderno de Língua Portuguesa | 6º ano 01 | 2º trimestre de 2025`

3. Renomeie a primeira aba para `Respostas`.
4. Na linha 1, crie exatamente estes cabeçalhos, na ordem indicada:

   | Coluna | Cabeçalho |
   | --- | --- |
   | A | ID da resposta |
   | B | Data do envio |
   | C | Horário do envio |
   | D | Nome completo |
   | E | Turma |
   | F | Questão 1 |
   | G | Questão 2 |
   | H | Questão 3 |
   | I | Questão 4 |
   | J | Questão 5 |
   | K | Questão 6 |
   | L | Questão 7 |
   | M | Questão 8 |
   | N | Questão 9 |
   | O | Questão 10 |
   | P | Comentários |

5. Congele a primeira linha e mantenha a planilha como **Restrita**. Não publique na Web e não habilite acesso por link.
6. Confirme em **Arquivo > Configurações** que o fuso horário é `America/Sao_Paulo`.

Cada envio será acrescentado como uma nova linha em `Respostas!A:P`. Não altere o nome da aba, a ordem ou a grafia dos cabeçalhos sem atualizar também o código.

## 2. Criar a conta de serviço no Google Cloud

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e crie ou selecione um projeto exclusivo para a integração.
2. Em **APIs e serviços > Biblioteca**, habilite a **Google Sheets API**.
3. Acesse **IAM e administrador > Contas de serviço** e escolha **Criar conta de serviço**.
4. Dê um nome identificável, por exemplo `lunario-formularios`.
5. Não conceda papéis amplos no projeto. Para este fluxo, a permissão sobre a planilha será concedida pelo compartilhamento do próprio arquivo.
6. Abra a conta criada, acesse **Chaves > Adicionar chave > Criar nova chave > JSON** e faça o download uma única vez.
7. No JSON, identifique:

   - `client_email`: será o valor de `GOOGLE_SERVICE_ACCOUNT_EMAIL`;
   - `private_key`: será o valor de `GOOGLE_PRIVATE_KEY`.

Não habilite delegação em todo o domínio. Guarde o JSON apenas pelo tempo necessário para cadastrar os segredos, nunca o copie para o repositório e apague a cópia local de forma segura depois da configuração. Caso a chave seja exposta, revogue-a imediatamente no Google Cloud e crie outra.

Referência oficial: [OAuth 2.0 para contas de serviço](https://developers.google.com/identity/protocols/oauth2/service-account).

## 3. Compartilhar a planilha com a conta de serviço

1. Na planilha, clique em **Compartilhar**.
2. Adicione o endereço encontrado em `client_email`.
3. Conceda a função **Editor** somente nessa planilha.
4. Desative a notificação, se o Google oferecer essa opção, e confirme.
5. Verifique que o acesso geral continua como **Restrito**.

O Google Sheets não oferece uma função de compartilhamento limitada apenas a “inserir e consultar linhas”. Por isso, **Editor** é a menor função do Google Drive que permite a escrita necessária. Reduza o alcance compartilhando somente esta planilha, não uma pasta inteira, e não conceda acesso a outros arquivos do Drive.

## 4. Localizar o identificador da planilha

Abra a planilha e examine a URL:

```text
https://docs.google.com/spreadsheets/d/IDENTIFICADOR_DA_PLANILHA/edit
```

O texto entre `/d/` e `/edit` é o valor de `GOOGLE_SPREADSHEET_ID`. Copie apenas esse trecho.

Embora o identificador isolado não conceda acesso à planilha, trate-o como configuração privada: não o envie ao navegador nem o inclua no repositório público.

## 5. Configurar variáveis de ambiente, D1 e Cloudflare Pages

### Variáveis necessárias

O `.env.example` deve conter somente os nomes abaixo, sem valores reais:

```dotenv
NEXT_PUBLIC_SITE_URL=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
ADMIN_SESSION_SECRET=
RATE_LIMIT_SECRET=
FORM_TOKEN_SECRET=
```

Para desenvolvimento local, coloque valores de teste em `.dev.vars` ou em outro arquivo local ignorado pelo Git. Não use credenciais de produção no ambiente local. O `.env`, `.dev.vars`, chaves `*.pem` e o JSON da conta de serviço devem permanecer fora do repositório.

No Cloudflare Dashboard:

1. Acesse **Workers & Pages > lunario-educacao-cultura > Settings > Variables and Secrets**.
2. Cadastre cada variável nos ambientes **Production** e **Preview** apropriados.
3. Marque os valores como **Encrypt/Secret**. Para `GOOGLE_PRIVATE_KEY`, cole a chave completa, incluindo `-----BEGIN PRIVATE KEY-----`, `-----END PRIVATE KEY-----` e as quebras de linha.
4. Use credenciais e planilhas separadas para Preview e Production.

Opcionalmente, os segredos podem ser cadastrados de forma interativa, sem valor na linha de comando:

```bash
npx wrangler pages secret put GOOGLE_SERVICE_ACCOUNT_EMAIL --project-name lunario-educacao-cultura
npx wrangler pages secret put GOOGLE_PRIVATE_KEY --project-name lunario-educacao-cultura
npx wrangler pages secret put GOOGLE_SPREADSHEET_ID --project-name lunario-educacao-cultura
npx wrangler pages secret put ADMIN_EMAIL --project-name lunario-educacao-cultura
npx wrangler pages secret put ADMIN_PASSWORD_HASH --project-name lunario-educacao-cultura
npx wrangler pages secret put ADMIN_SESSION_SECRET --project-name lunario-educacao-cultura
npx wrangler pages secret put RATE_LIMIT_SECRET --project-name lunario-educacao-cultura
npx wrangler pages secret put FORM_TOKEN_SECRET --project-name lunario-educacao-cultura
```

Gere `ADMIN_SESSION_SECRET`, `RATE_LIMIT_SECRET` e `FORM_TOKEN_SECRET` separadamente, com pelo menos 32 bytes aleatórios para cada um. Nunca reutilize o mesmo valor. Um exemplo local para gerar um segredo e copiá-lo imediatamente para o gerenciador seguro é:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Não salve a saída em arquivos, histórico compartilhado, capturas de tela ou mensagens.

### Criar e preparar o D1

Na primeira configuração, autentique o Wrangler e crie o banco. Se
`lunario-form-control` já existir, não repita o comando de criação:

```bash
npx wrangler login
# Somente se o banco ainda não existir:
npx wrangler d1 create lunario-form-control
```

Execute as migrações versionadas, sempre na ordem:

```bash
npx wrangler d1 execute lunario-form-control --remote --file .openai/drizzle/0001_form_control.sql
npx wrangler d1 execute lunario-form-control --remote --file .openai/drizzle/0002_idempotency_fencing.sql
```

No Cloudflare Dashboard:

1. Acesse **Workers & Pages > lunario-educacao-cultura > Settings > Bindings**.
2. Adicione um binding do tipo **D1 database**.
3. Use exatamente `FORM_DB` como nome da variável.
4. Selecione o banco `lunario-form-control`.
5. Configure o binding em Production e Preview conforme a separação de ambientes adotada.
6. Faça um novo deploy, pois bindings e segredos só passam a valer após a republicação.

O D1 guarda somente controles técnicos: hash da chave de submissão, hash do conteúdo, estado de idempotência, identificador e contador de fencing do lease, contadores temporários de requisição e hashes de sessão. Ele não deve receber nomes, respostas dos estudantes ou IP completo.

### Publicação segura

Use a integração Git do Cloudflare Pages ou o comando de deploy já configurado no projeto:

```bash
npm ci
npm run check
npm run deploy:pages
```

No projeto Pages, abra **Settings > Runtime > Fail open / closed** e selecione **Fail closed**. Essa configuração é indispensável porque `/admin/*` depende do Worker para autenticação. O pós-build incorpora os HTMLs administrativos ao `_worker.js` e remove todo o diretório `dist/client/admin/`; portanto, não existe um arquivo HTML do painel que o serviço público de assets possa entregar sem autenticação. Acesso direto a `/_private/*` retorna 404. O arquivo `public/_routes.json` restringe a execução do Worker às rotas `/api` + `/api/*`, `/admin` + `/admin/*` e `/_private` + `/_private/*`.

Referências oficiais: [bindings e segredos no Pages](https://developers.cloudflare.com/pages/functions/bindings/), [roteamento e Fail closed](https://developers.cloudflare.com/pages/functions/routing/) e [Worker em modo avançado](https://developers.cloudflare.com/pages/functions/advanced-mode/).

## 6. Criar o usuário administrador

1. Escolha um e-mail exclusivo para o professor responsável.
2. Crie uma senha longa e única, preferencialmente gerada por um gerenciador de senhas.
3. No diretório do projeto, execute:

   ```bash
   npm run admin:hash
   ```

4. Digite a senha apenas no prompt interativo. O comando não recebe a senha como argumento e imprime somente um hash PBKDF2.
5. Cadastre:

   - o e-mail em `ADMIN_EMAIL`;
   - o resultado do comando em `ADMIN_PASSWORD_HASH`.

Nunca cadastre a senha em texto simples. O hash não deve ser colocado no `.env.example`, no GitHub ou em JavaScript do frontend.

Para trocar a senha, gere um novo hash, atualize `ADMIN_PASSWORD_HASH` e republique. Para encerrar imediatamente todas as sessões existentes, também troque `ADMIN_SESSION_SECRET` ou revogue as sessões no D1:

```bash
npx wrangler d1 execute lunario-form-control --remote --command "UPDATE admin_sessions SET revoked_at = unixepoch() WHERE revoked_at IS NULL;"
```

## 7. Testar o envio

Faça os testes primeiro em **Preview**, usando uma planilha e um D1 separados dos recursos de produção.

1. Execute as verificações do projeto:

   ```bash
   npm ci
   npm run check
   ```

2. Publique uma branch de Preview no Cloudflare Pages.
3. Abra `/formularios/avaliacao-caderno-6-01/`, preencha todos os campos e envie.
4. Confirme a mensagem de sucesso e o redirecionamento para a página final.
5. Na planilha de Preview, confirme que:

   - surgiu exatamente uma nova linha;
   - o ID é único;
   - data e horário correspondem a `America/Sao_Paulo`;
   - as dez respostas e os comentários estão nas colunas corretas;
   - nenhuma linha anterior foi apagada ou substituída.

6. Teste validação e segurança:

   - tente enviar sem um campo obrigatório;
   - tente clicar repetidamente no botão durante o envio;
   - interrompa a resposta de rede após o envio e tente novamente no mesmo navegador;
   - confirme que a mesma chave de submissão não produz uma segunda linha;
   - acesse `/admin/formularios/` sem sessão e confirme que os dados não são exibidos;
   - tente abrir as rotas de consulta e exportação sem sessão e confirme a recusa;
   - valide login incorreto, logout, busca, filtros, ordenação, paginação e download.

### Registros de teste

Não use dados fictícios na planilha de produção. Em Preview, identifique qualquer registro manual com nome iniciado por `[TESTE]` e comentário `[TESTE — APAGAR ANTES DA PUBLICAÇÃO]`.

Antes da publicação:

1. apague todas as linhas `[TESTE]` da planilha de Preview;
2. confirme que a planilha de Production não contém registros fictícios;
3. se um teste tiver sido feito por engano em Production, apague a linha pelo ID e remova somente o controle correspondente do D1:

   ```bash
   npx wrangler d1 execute lunario-form-control --remote --command "DELETE FROM form_submission_idempotency WHERE response_id = 'ID_DA_RESPOSTA_DE_TESTE';"
   ```

Não execute exclusões globais no D1 de produção. Em um banco de Preview descartável, as tabelas técnicas podem ser limpas integralmente somente depois de confirmar que não há submissões reais.

## 8. Acessar o painel

1. Abra `/admin/login/`.
2. Entre com `ADMIN_EMAIL` e a senha usada para gerar `ADMIN_PASSWORD_HASH`.
3. Após a autenticação, acesse `/admin/formularios/`.

O painel não aparece no menu público. Ele mostra o formulário disponível, turma, período, total de respostas, resposta mais recente, tabela paginada, busca por nome, filtros e ordenação.

A sessão usa cookie seguro, HTTP-only e SameSite; as consultas exigem sessão válida e proteção CSRF. Não compartilhe a sessão nem use computadores públicos. Ao terminar, clique em **Sair**.

Verifique após cada deploy:

- acesso direto sem login redireciona ou recusa antes de apresentar dados;
- `/api/admin/sessao` não autentica sem cookie válido;
- respostas administrativas incluem `Cache-Control: no-store`;
- páginas privadas enviam `X-Robots-Tag: noindex, nofollow` e possuem metadado `noindex, nofollow`;
- erros não mostram credenciais, SQL, chave privada ou detalhes internos.

## 9. Baixar CSV e XLSX

No painel, use **Baixar CSV** ou **Baixar Excel**. As rotas protegidas são:

```text
/api/admin/formularios/avaliacao-caderno-6-01/exportar?formato=csv
/api/admin/formularios/avaliacao-caderno-6-01/exportar?formato=xlsx
```

Os arquivos devem ser entregues com estes nomes:

```text
avaliacao-caderno-6ano01-2trimestre-2025.csv
avaliacao-caderno-6ano01-2trimestre-2025.xlsx
```

Ambos contêm os mesmos 16 cabeçalhos de `Respostas!A:P`. A exportação exige uma sessão administrativa válida e neutraliza valores que poderiam ser interpretados como fórmulas por planilhas.

Teste os dois formatos antes da publicação:

1. abra o CSV em um editor de texto e confirme o cabeçalho e a quantidade de linhas;
2. abra o XLSX em um aplicativo compatível e confirme as 16 colunas;
3. use um registro de Preview iniciado por `=`, `+`, `-` ou `@` e confirme que o conteúdo aparece como texto, nunca como fórmula;
4. encerre a sessão e confirme que as duas URLs deixam de fornecer os arquivos.

Os downloads contêm dados pessoais educacionais. Guarde-os somente em local autorizado, não os envie por links públicos e elimine cópias que não sejam mais necessárias.

## 10. Substituir a planilha no futuro

1. Crie uma nova planilha privada.
2. Crie a aba `Respostas` e replique exatamente os 16 cabeçalhos descritos na seção 1.
3. Configure o fuso `America/Sao_Paulo`.
4. Compartilhe somente a nova planilha com `GOOGLE_SERVICE_ACCOUNT_EMAIL` como **Editor**.
5. Localize o novo identificador e atualize `GOOGLE_SPREADSHEET_ID` no ambiente correto do Cloudflare Pages.
6. Faça um novo deploy para aplicar a configuração.
7. Realize um envio marcado como teste no ambiente de Preview, verifique leitura, painel e exportações e remova o registro de teste.
8. Só então altere Production e faça um teste final sem usar dados fictícios.
9. Remova o acesso da conta de serviço à planilha antiga quando ela não precisar mais ser consultada pela aplicação.
10. Arquive a planilha antiga de acordo com a política de retenção da escola; não a apague sem autorização do responsável pelos dados.

Não reutilize uma planilha com cabeçalhos incompatíveis. Se for necessário migrar respostas antigas, faça uma cópia controlada, preserve os IDs e mantenha os dados fora de repositórios, logs e canais públicos.
