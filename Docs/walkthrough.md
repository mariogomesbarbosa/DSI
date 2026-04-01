# Walkthrough — Hug Height nos frames Card-Padrão e Preview-BG

## 1. Implementação do Hug Height

Foi alterada a forma como os frames `Item-Padrão`, `Card-Padrão` e `Preview-BG` são gerados para garantir que a altura seja dinâmica ("Hug content"), acompanhando o conteúdo.

- **Item-Padrão**: Na seção Specs, foi removida a chamada de `resize` que forçava uma altura fixa, agora utilizando `fixedWidth: cardWidth` para permitir a altura como **Hug**.
- **Card-Padrão**: Foi removida a propriedade `fixedHeight: cardHeight` na criação do frame. Sem uma altura fixa definida, o helper `createFrame` aplica por padrão `primaryAxisSizingMode = 'AUTO'`, que no Auto Layout de direção VERTICAL corresponde ao comportamento "Hug".
- **Preview-BG**: Foi removida a linha `previewBackground.layoutGrow = 1`. O `layoutGrow = 1` forçava o frame a preencher o espaço disponível (Fill) no eixo principal da `Card-Padrão`. Com a remoção, o frame passa a ter altura automática ("Hug"), ajustando-se ao tamanho da instância do componente que contém.

## 2. Locais Alterados

As alterações foram aplicadas nas funções **`renderVariants`** e **`renderSpecs`** do arquivo `code.ts`. Isso unifica o comportamento de altura dinâmica em todas as seções de visualização de componentes do plugin.

---
*DSI - Documentation Plugin — 01/04/2026*
