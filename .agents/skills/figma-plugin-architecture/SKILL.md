---
name: Figma Plugin Architecture
description: Informações sobre como os arquivos se relacionam e fluxo de comunicação no AutoDocs (code.ts vs ui.html).
---

# Figma Plugin Architecture

## Visão Geral
O plugin AutoDocs segue o modelo padrão de plugins do Figma, onde a lógica principal se encontra na Main Thread (`code.ts`) e interage com o Canvas, enquanto a interface do usuário reside no UI (`ui.html`). O uso de memória e rede do UI (`fetch` pro Gemini, por ex) é evitado transferindo a chamada `fetch` diretamente para o ambiente nativo, que agora suporta acesso à rede no Manifest v3, permitindo rodar tudo centralizado no `code.ts`.

## Responsabilidades
- **`code.ts`**: Entrada principal. Acessa Nós, lê propriedades, converte tokens e desenha/clona no canvas. Realiza diretamente a chamada HTTP nativa `callGemini(apiKey, ...)`.
- **`ui.html`**: Apenas exibe o formulário inicial (inserção de Prompt, Storybook URL, etc) e gerencia o loading state (escutando via `postMessage`). Mínima lógica JS presente aqui.

## Quando Usar
Quando for requisitado a:
1. Criar um novo formulário ou alterar o layout do manifest do painel inicial (CSS/HTML).
2. Compreender a comunicação `figma.ui.postMessage` <-> `window.onmessage`.
3. Adicionar uma nova dependência global (como armazenamento `figma.clientStorage`).

*Para regras detalhadas sobre o fluxo específico, leia `references/plugin-architecture.md`.*
