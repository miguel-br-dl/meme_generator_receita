# Meme Generator Receita

Aplicacao Angular + PrimeNG para gerar memes por templates.

## Rodar localmente

```bash
npm install
npm start
```

App local: `http://localhost:4200/`

## Deploy no GitHub Pages

Este projeto ja esta preparado para deploy automatico via GitHub Actions.

1. Suba o projeto para um repositorio no GitHub.
2. Garanta que a branch principal seja `main`.
3. Em `Settings > Pages`, selecione `Build and deployment: GitHub Actions`.
4. Faça push na `main`.
5. A action `.github/workflows/deploy-gh-pages.yml` vai publicar automaticamente.

A URL final fica no formato:

```text
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/
```

Observacao: as rotas internas usam `#` (ex.: `/#/sobre`) para evitar erro 404 no refresh do GitHub Pages.

### `ads.txt` no GitHub Pages

- Em **Project Pages** (repo comum): `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/ads.txt`
- Em **User Pages** (repo `SEU_USUARIO.github.io`): `https://SEU_USUARIO.github.io/ads.txt`

Se voce precisa obrigatoriamente do `ads.txt` na raiz (`/ads.txt`), publique como **User Pages** (repo `SEU_USUARIO.github.io`) ou use dominio proprio.

## Build para Pages (manual)

Para gerar artefato localmente com base-href relativo:

```bash
npm run build:gh-pages
npm run ghpages:prepare
```

Para gerar com base-href no nome do pacote (`meme-generator-receita`):

```bash
npm run build:gh-pages:repo
npm run ghpages:prepare
```

## Estrutura de templates

Veja `templates/README.md` para criar novos templates.
