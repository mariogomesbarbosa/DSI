---
name: Figma Selection Parser
description: Especialista na leitura, análise profunda e parser de nós do Figma (Componentes, Conjuntos, etc) e seus tokens via boundVariables.
---

# Figma Selection Parser

Esta skill ajuda você a lidar EXCLUSIVAMENTE com o fluxo `Figma Selection -> JSON`. Ela orienta como ler e transformar as seleções do Figma antes de serem passadas para a IA.

## Quando Usar
Sempre que precisar modificar como:
- Descobrimos se algo é um "Estado" ou "Variação" analisando `componentPropertyDefinitions`.
- Extraímos tokens locais ou da biblioteca a partir de `node.boundVariables` (seja padding, backgroundColor ou borderRadius).
- Navegamos pelos `children` para compor a árvore de Anatomia do componente.

## Entradas e Saídas
- **Entrada Esperada:** Uma função da Figma Plugin API (ex: `figma.currentPage.selection`), ou um `ComponentNode | ComponentSetNode`.
- **Saída Desejada:** Normalmente uma alteração na função `extractComponentData(node)` ou `resolveTokens(...)`. Deve resultar num objeto manipulável (`ComponentData`).

## Regras
1. Não confunda Variant Properties com Node Properties. `figma.variables` são usados para pegar hex de variáveis.
2. Identificação de Status: Usamos palavras-chave ("state", "hover", "active") no parser para agrupar Variantes em uma lista de "Estados".
3. Consultar Dependências: O parser requer a API assíncrona do Figma (várias chamadas `.getVariableByIdAsync` ou coisas parecidas). Trate Promessas!

*Para regras mais específicas (como quais são os keywords de 'Size' ou como os Aliases funcionam), leia `references/parsing-rules.md`.*
