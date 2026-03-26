# Walkthrough — Hug Height nos frames Item-Padrão
## 1. Implementação do Hug Height

Foi alterada a forma como os frames `Item-Padrão` são gerados para garantir que a altura seja dinâmica ("Hug content").

- **Remoção de Resize Fixo**: Foi removida a chamada `itemFrame.resize(cardWidth, cardHeight + 110)`, que forçava uma altura fixa de `cardHeight + 110px`.
- **Uso de fixedWidth**: Agora o helper `createFrame` recebe o parâmetro `fixedWidth: cardWidth`, permitindo altura como **Hug**.

## 2. Padrão Item-Padrão e Card-Padrão

Itens nas seções Variantes e Specs seguem:

- **Item-Padrão** → `gap: 16px`. Altura como **Hug content**.
- **Card-Padrão** (interno) → Largura como **Fill** (`layoutAlign: STRETCH`).

## 3. Locais Alterados

As alterações foram aplicadas em dois pontos da função `renderVariants` no arquivo `code.ts`:
1. No loop que gera itens baseados em propriedades de variantes encontradas.
2. No caso de fallback (else).

---
*DSI - Documentation Plugin — 26/03/2026*
