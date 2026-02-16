# Fluxo para novos templates

Cada template fica em `templates/<slug>/` e precisa de um `template.json`.

## Estrutura minima

```text
templates/
  receita/
    template.json
    fundo.jpg
    app.png
    meme-generator-cinematic.svg
    preview.jpg (opcional)
```

## Passo a passo

1. Crie uma nova pasta, por exemplo: `templates/meu-template/`.
2. Coloque os assets do template nessa pasta.
3. Copie `templates/receita/template.json` como base e ajuste os campos.
4. Rode `npm run templates:build` para atualizar `templates/index.json`.
5. Inicie a aplicação (`npm start`) e selecione o template no dropdown.

## Regras importantes

- `id` deve ser unico.
- `layout` opcional: `iphone` (padrao) ou `descanse`.
- `fields[].key` deve ser unico.
- `fields[].type` aceita `text`, `textarea`, `select` e `image`.
- Campos `select` precisam de `options` com `label` e `value`.
- `notifications[].titleKey` e `notifications[].textKey` precisam apontar para chaves de `fields`.
- Assets relativos em `assets` (ex.: `fundo.jpg`) viram automaticamente `templates/<slug>/fundo.jpg`.

## Validacao

- `npm run templates:build`: gera `templates/index.json`.
- `npm run templates:check`: valida se `templates/index.json` esta atualizado.

Se algum arquivo estiver faltando ou com estrutura invalida, o script mostra erro com a causa.
