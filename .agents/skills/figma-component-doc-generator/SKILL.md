---
name: Figma Component Doc Generator
description: Especialista na renderização Canvas do Figma (Criação de Frames com AutoLayout, Textos, Pins e Badges decorativas).
---

# Figma Component Doc Generator

Esta skill foca EXCLUSIVAMENTE nas funções de renderização (`renderAnatomy`, `renderVariants`, `createFrame`, `createText`).

## Quando Usar
Quando o objetivo for:
1. Adicionar uma nova seção à documentação (ex: "Acessibilidade").
2. Melhorar o layout dos quadros (pads, gaps, alinhamentos, stretch).
3. Desenhar elementos no canvas, adicionar textos e injetar estilos/cores do `COLORS`.

## Padrões Adotados
As funções de utilidade do `code.ts` devem ser sempre priorizadas em vez das chamadas nativas manuais repetitivas:
- `createFrame(name, options)` é o canivete suíço para AutoLayout. Use em vez de `node.layoutMode = ...` e atribuições manuais, sempre que for criar um novo frame.
- `createText(chars, size, style, color, options)` simplifica a alocação do `fontName` (obrigatoriamente usando `Figtree`).
- **NUNCA use clipContent = true por padrão.** `createFrame` já desativa clipContent.

## Regras
1. Lembre-se que elementos renderizados como lista precisam primeiro ser criados, e então adicionados com `.appendChild()` no node PAI **ANTES** de tentar aplicar `.layoutSizingHorizontal = 'FILL'` nele.
2. Acessórios visuais (Pins de anatomia) precisam calcular `x` e `y` em frames de `layoutMode = 'NONE'` encapsulados ao lado do card da imagem original.
3. Não modifique diretamente estilos do painel UI (HTML/CSS) com essa skill. Isso é estritamente de canvas do Figma.

*Para tamanhos de padding exatos ou referências da tabela de cores, leia `references/doc-rendering-standards.md`.*
