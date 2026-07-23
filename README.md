# Lunário — Educação e Cultura

Portal editorial, educacional e cultural do Lunário. O projeto usa Next.js App
Router com React e é compilado pelo vinext/Vite como exportação estática para o
Cloudflare Pages.

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

O Cloudflare Pages também fornece `CF_PAGES_URL` automaticamente. O projeto não
usa banco de dados, chaves privadas ou segredos de aplicação.

## Comandos

```bash
npm run dev          # ambiente local
npm run typecheck    # validação de tipos
npm run lint         # análise estática
npm run build        # build de produção
npm test             # testa a saída já gerada
npm run check        # executa toda a validação, incluindo o build
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

## Cloudflare Pages

Crie o projeto no painel com estes valores:

| Campo | Valor |
| --- | --- |
| Framework preset | `None` |
| Production branch | `main` |
| Root directory | `/` ou vazio |
| Build command | `npm run build` |
| Build output directory | `dist/client` |
| Variável de build | `NODE_VERSION=22.16.0` |
| Variável opcional | `NEXT_PUBLIC_SITE_URL=https://lunario-educacao-cultura.pages.dev` |

O arquivo `wrangler.toml` contém a mesma pasta de saída. Para uma publicação
direta:

```bash
npx wrangler login
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
- `public/sitemap.xml`: índice das 31 rotas públicas
- `app/not-found.tsx`: página 404
- `public/_headers`: cabeçalhos de segurança e cache
- `public/favicon.ico`, `public/favicon-32.png` e
  `public/apple-touch-icon.png`: ícones
- `public/lunario-social-2026.jpg`: imagem Open Graph
- `.env.example`: exemplo sem segredos
