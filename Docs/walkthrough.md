# Walkthrough — Refatoração da Estrutura de Documentação

## 1. Padrão Header/Content em Seções

Todas as seções seguem:

- **Frame principal** (`Seção — NOME`) → `gap: 24px`
  - **Header** → `gap: 12px` (título + descrição)
  - **Content** → `gap: 24px` (conteúdo específico)

Seções adaptadas: *Quando usar, Anatomia, Variantes, Estados, Specs, Tokens, Hierarquia, Regras de aplicação*.

## 2. Padrão Item-Padrão

Itens nas seções Variantes e Specs seguem:

- **Item-Padrão** → `gap: 16px`
  - **Header** → `gap: 8px` (título + descrição do item)
  - **Content** → Card-Padrão com preview

## 3. Merge da Seção Specs

A função `renderSpecs` vinda da branch `main` foi adaptada ao novo padrão:
- `createSectionFrame` retorna `{ section, header, content }` (não mais `FrameNode`)
- Descrição é passada como parâmetro `descriptionText`
- Grid adicionado no frame `content`
- Itens seguem `Item-Padrão` → `Header (gap 8)` + `Content`

---
*DSI - Documentation Plugin — 25/03/2026*
