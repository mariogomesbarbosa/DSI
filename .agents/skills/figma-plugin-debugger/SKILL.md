---
name: Figma Plugin Debugger
description: Resolve erros obscuros da Figma Plugin API (falhas de UI vs Main thread, cross-origin, restrições locais e instâncias de clone).
---

# Figma Plugin Debugger

O Figma possui diversas idiossincrasias que geram "erros silenciosos" ou falsos positivos em Node Environments. Use esta skill para identificar e solucionar falhas difíceis e gargalos.

## Principais Dores e Regras Rápidas:
- Fontes não carregam? Você precisa chamar `figma.loadFontAsync(fontName)` ANTES de atribuí-las. No AutoDocs usamos o `loadFonts` helper. Se houver falha de "font não está carregada", certifique-se de que `await` foi acionado na cadeia correta.
- Componente sumindo / instanciando torto? ComponentSets possuem `.defaultVariant`. Instâncias dependem de `createInstance()` de componentes. Quando clonamos nós de "Anatomy" evite `.clone()` direto no Componente Pai, instancie antes as partes ou leia só via read-only.
- Comunicação de UI (`figma.ui.postMessage`) precisa ser via `postMessage()`. Cuidado para não cruzar objetos com funções do console pro UI. JSON-serializable apenas.
- API Rate Limits do Gemini Flash ou erro JSON Parse (Exceção comum do `callGemini`). Certifique-se de encapsular Try/Catches para erros passarem de volta pro `postMessage(type: "error")`.

*Para regras detalhadas sobre restrições e limites da API, pesquise `references/figma-api-quirks.md`. Você está livre para adicionar testes lá caso depare com algo esquisito e novo.*
