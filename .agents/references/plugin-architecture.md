# Plugin Architecture Reference

O AutoDocs não utiliza Webpack profundo, React ou Tailwind. Ele consiste essencialmente em separar a árvore do `code.ts` da visualização `ui.html`.

## Funcionalidades Chave:
1. **Entrada do Plugin**: `figma.showUI` e bind de variáveis locais (API Key em `clientStorage`).
2. **PostMessage Loop**:
   - `code.ts` escuta via `figma.ui.onmessage` eventos 'generate' ou 'save-api-key'.
   - Sempre que há seleção alterada (`figma.on('selectionchange')`), envia evento `selection-info` de volta para UI atualizar o nome bloqueado na tela.
3. **Fluxo do Generate**:
   - -> extrai dados de Figma Node
   - -> manda requisição HTTP assíncrona p/ Gemini Flash (`fetch()` nativo do `code.ts`).
   - -> se ok, orquestra renderizações atômicas nos Helpers (`renderAnatomy`, `renderTokens`...).
   - -> encapsula tudo num mega `createDocFrame(nome)` pai e cospe no Canvas.

## Limitações / Dicas
- É necessário usar manifest v3 nativo ou checar `networkAccess` dentro do manifesto (já ativo) para permitir o `fetch` direto do `code.ts`.
- `clientStorage.getAsync/setAsync` do Figma é lento; sempre use async/await para recuperar apiKey antes de enviar pro UI preencher input.
- Todo processamento pesado bloqueia o Figma. É por isso que dividimos em etapas que mandam `loading-step` de volta pro UI avisando onde está.
