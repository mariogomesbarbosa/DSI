# Walkthrough — Largura "Fill" na Seção Specs

## 1. Implementação da Largura "Fill"

Foi alterada a configuração de largura dos frames `Item-Padrão` e `Card-Padrão` especificamente na função `renderSpecs` para que eles ocupem o espaço disponível (comportamento "Fill").

- **Item-Padrão**: Foi removida a largura fixa (`fixedWidth: cardWidth`) e adicionada a propriedade `layoutGrow: 1`. Como o pai deste frame (`mainGrid`) utiliza `HORIZONTAL` com `WRAP`, o `layoutGrow: 1` permite que o item se expanda para preencher a largura da linha no grid.
- **Card-Padrão**: Foi removida a largura fixa (`fixedWidth: cardWidth`) e adicionada a propriedade `layoutAlign: 'STRETCH'`. Como seu pai (`itemContent`) possui direção `VERTICAL`, o `layoutAlign: 'STRETCH'` faz com que o frame preencha a largura total do seu container pai.

## 2. Locais Alterados

As alterações foram aplicadas exclusivamente na função **`renderSpecs`** do arquivo `code.ts`.

---
*DSI - Documentation Plugin — 08/04/2026*
