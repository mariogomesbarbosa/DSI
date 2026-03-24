# Document Rendering Standards

Ao utilizar a habilidade de renderizar e alterar layouts visuais, respeite severamente a "Tabela de Cores" base e as réguas padronizadas de layout.

## The Colors (`COLORS` Constant)
- `bg`: Background da placa geral (cinza super claro). #F6F5F8
- `white`: #FFFFFF
- `blue`, `accent`, `dark`, `darkGray`, `mediumGray`, `lightGray`, `border`, etc.

## Anatomia UI 
- Os cards individuais de secções (`createSectionFrame`) possuem: `gap: 24, padding: 28, radius: 12, fill: WHITE`.
- Tipografia: Sempre usar Família: `Figtree` (obrigatório já ser carregada `await loadFonts()`).
- Cores de Fonte padrão para explicações: `COLORS.darkGray`, size `16`, line height `160%`.
- Para títulos de quadros pequenos: Headers Bold de `size: 15` até `18` e a fonte color `COLORS.dark`.

## Layout Engine & Gaps
NUNCA modifique nodes manualmente injetando layoutMode se isso pode ser feito via Helper de criação:
- `createFrame('nome', { direction: 'VERTICAL', padding: [4, 12, 4, 12] ... })` 
- Alinhamentos (Fill, Hug, Fixed): Para forçar o FILL horizontal em frames aninhados, adicione `layoutAlign: 'STRETCH'` neles próprios, E marque o pai com layoutMode apropriado.
- Importante: Se adicionar frames a auto-layouts de `direction: HORIZONTAL`, lembre que preenchimentos (`layoutGrow`) variam. Mantenha consistência.

## Fallback de Pins de Anatomia
Se houver sub-children perdidos, renderizamos um pin "Badge" por cima com a posição estática calculada matematicamente `pinX = base.x + width/2...`. 
Nunca tente agrupar os pins diretamente Numa `Variant` clonada usando Auto Layout (isso quebraria tudo). O "InnerFrame" tem `layoutMode: 'NONE'` para pinos voarem livremente em cima das coordenadas de (x,y) absolutas desse container.
