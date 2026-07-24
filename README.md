# Lunário — Educação e Cultura

Portal editorial, educacional e cultural do Lunário. O projeto usa Next.js App
Router com React e é compilado pelo vinext/Vite como exportação estática para o
Cloudflare Pages. O build também gera um Worker em modo avançado para as APIs,
autenticação e entrega controlada das páginas administrativas.

## Requisitos

- Node.js `22.16.0`
- npm `10` ou superior

O projeto fixa a versão recomendada em `.node-version` e `.nvmrc`.

## Instalação e desenvolvimento

```bash
npm ci
cp .env.example .env.local
npm run dev
```

No Windows PowerShell, copie o ambiente com:

```powershell
Copy-Item .env.example .env.local
```

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Não | URL pública usada em metadados, sitemap e robots. O valor padrão é `https://lunario-educacao-cultura.pages.dev`. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Sim | E-mail da conta de serviço autorizada na planilha privada. |
| `GOOGLE_PRIVATE_KEY` | Sim | Chave privada da conta de serviço, somente como segredo do Cloudflare. |
| `GOOGLE_SPREADSHEET_ID` | Sim | Identificador da planilha privada de respostas. |
| `ADMIN_EMAIL` | Sim | E-mail aceito no login administrativo. |
| `ADMIN_PASSWORD_HASH` | Sim | Hash PBKDF2 gerado por `npm run admin:hash`; nunca a senha em texto simples. |
| `ADMIN_SESSION_SECRET` | Sim | Segredo aleatório para cookies e proteção CSRF. |
| `RATE_LIMIT_SECRET` | Sim | Segredo aleatório para anonimizar os buckets de IP. |
| `FORM_TOKEN_SECRET` | Sim | Segredo aleatório para tokens e chaves idempotentes. |

O Cloudflare Pages também fornece `CF_PAGES_URL` automaticamente. Os valores
privados devem ser cadastrados como segredos no Cloudflare Pages e nunca em
arquivos versionados ou JavaScript do navegador. Consulte
[`CONFIGURACAO_FORMULARIOS.md`](./CONFIGURACAO_FORMULARIOS.md) para o passo a
passo completo.

## Comandos

```bash
npm run dev          # ambiente local
npm run typecheck    # validação de tipos
npm run lint         # análise estática
npm run build        # build de produção
npm test             # testa a saída já gerada
npm run check:functions # compila as Pages Functions
npm run check        # executa toda a validação, incluindo o build
npm run admin:hash   # gera o hash da senha em prompt interativo
npm run deploy:pages # publicação direta com Wrangler
```

O build de produção é:

```bash
npm run build
```

A pasta publicada é:

```text
dist/client
```

## Rotas estáticas

`next.config.ts` usa `output: "export"` e `trailingSlash: true`. As rotas
dinâmicas possuem `generateStaticParams`, portanto cada página é gerada como
`<rota>/index.html` e funciona quando aberta diretamente. A página 404 é
exportada como `dist/client/404.html`; não é necessário usar fallback de SPA.

As duas telas administrativas são uma exceção deliberada: no pós-build, seus
HTMLs são incorporados ao `_worker.js` e todo o diretório
`dist/client/admin/` é removido. O Worker só entrega o painel depois de validar
a sessão; não existe um arquivo HTML administrativo acessível pelo serviço
público de assets.

## Cloudflare Pages

Crie o projeto no painel com estes valores:

| Campo | Valor |
| --- | --- |
| Framework preset | `None` |
| Production branch | `main` |
| Root directory | deixar vazio (raiz do repositório) |
| Build command | `npm run build` |
| Build output directory | `dist/client` |
| Variável de build | `NODE_VERSION=22.16.0` |
| Variável opcional | `NEXT_PUBLIC_SITE_URL=https://lunario-educacao-cultura.pages.dev` |

O arquivo `wrangler.toml` vincula o banco D1 remoto
`lunario-form-control` ao nome `FORM_DB`. Antes do primeiro deploy do backend,
aplique as migrações na ordem:

```bash
npx wrangler d1 execute lunario-form-control --remote --file .openai/drizzle/0001_form_control.sql
npx wrangler d1 execute lunario-form-control --remote --file .openai/drizzle/0002_idempotency_fencing.sql
```

No painel do Pages, mantenha **Runtime > Fail open/closed** em
**Fail closed**. Cadastre os oito valores privados da tabela acima em
**Variables and secrets** antes de habilitar envios reais.

Para uma publicação direta pelo Wrangler, crie o projeto somente na primeira
configuração. Como o projeto `lunario-educacao-cultura` já existe, nas
publicações seguintes execute apenas login, build e deploy:

```bash
npx wrangler login
# Somente se o projeto ainda não existir:
npx wrangler pages project create lunario-educacao-cultura --production-branch main
npm run build
npm run deploy:pages
```

## GitHub

Depois de criar um repositório público vazio:

```bash
git init
git branch -M main
git add .
git commit -m "Prepare Lunário for production"
git remote add origin https://github.com/SEU-USUARIO/lunario-educacao-cultura.git
git push -u origin main
```

Para vincular pelo painel do Cloudflare Pages, selecione o repositório, mantenha
a branch `main` e use a configuração da tabela acima.

## Arquivos de publicação

- `public/robots.txt`: regras para rastreadores
- `public/sitemap.xml`: índice das 32 rotas públicas
- `app/not-found.tsx`: página 404
- `public/_headers`: cabeçalhos de segurança e cache
- `public/_routes.json`: executa o Worker em `/api` + `/api/*`, `/admin` +
  `/admin/*` e `/_private` + `/_private/*`
- `worker/pages.ts`: ponto de entrada avançado do Cloudflare Pages
- `functions/`: módulos da API segura, autenticação e exportações CSV/XLSX
- `scripts/build-pages-worker.mjs`: incorpora os HTMLs privados no `_worker.js`
  e remove os assets administrativos públicos
- `.openai/drizzle/0001_form_control.sql` e
  `.openai/drizzle/0002_idempotency_fencing.sql`: tabelas técnicas,
  fencing idempotente, limite de requisições e sessões
- `CONFIGURACAO_FORMULARIOS.md`: operação da planilha e do painel privado
- `public/favicon.ico`, `public/favicon-32.png` e
  `public/apple-touch-icon.png`: ícones
- `public/lunario-social-2026.jpg`: imagem Open Graph
- `.env.example`: exemplo sem segredos
