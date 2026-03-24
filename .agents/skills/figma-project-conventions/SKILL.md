---
name: Figma Project Conventions
description: Regras de linguagem, dependências do pacote, e código estilo do AutoDocs.
---

# Figma Project Conventions

## Quando Usar
Esta skill engloba como nosso repositório é gerenciado, as ferramentas e como evoluir o código da base. Acione-a quando você for alterar dependências, refatorar extensivamente ou revisar o "jeito de programar" local.

## Regras
- **Linguagem**: TypeScript Puro, rigorosamente tipado (`interface ComponentData`, `interface AnatomyPart`). Não adicione React ou Vue para UI.
- **CSS Vanilla**: A UI é implementada estilo `<style>` tag no arquivo único do HTML. Nada de Tailwind para não onerar build e manter a velocidade.
- **Componentização Canvas**: Tudo que é pintado no canvas usa funções helpers puras (NÃO crie classes pesadas). Helpers ficam agrupados em categorias no arquivo com comentários largos `// ==========================`.
- **Constantes**: Cores (`COLORS.xxx`), chaves de keywords padrão (`['state', 'hover']`), e fontes devem ser referenciadas globalmente em vez de reescritas no meio da lógica.
- **Evitar Npm**: Evite dependências sempre que o Figma nativamente provê o meio (ex: usar cores com figma.util.solidPaint, e não bibliotecas de cores, ou usar parse nativo em vez de Lodash).

*Para informações sobre dimensões de auto layout, veja `references/doc-rendering-standards.md`.*
