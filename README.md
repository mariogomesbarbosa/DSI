# 💎 DSI — Documentation System Interface

> Documentação inteligente e automática para seus componentes do Figma, alimentada por IA.

![Banner do DSI](src/readme-banner.png)

---

## 🚀 Sobre o Projeto

O **DSI** é um plugin para Figma desenvolvido para acelerar o processo de documentação de Design Systems. Ele analisa a estrutura de seus componentes, tokens de design e propriedades, utilizando a API do **Google Gemini** para gerar descrições contextuais e organizar tudo em um layout premium e pronto para uso.

### ✨ Principais Funcionalidades

*   **⚡ Documentação em Segundos:** Gera descrições e tabelas de propriedades automaticamente.
*   **🏷️ Sistema de Status Dinâmico:** Inclui um componente de Badge local com 4 estados (Design, Desenvolvimento, Validação e Publicado).
*   **🎨 Visual Anatomy:** Mapeia automaticamente a anatomia do componente no Canvas.
*   **🔗 Design Tokens:** Documenta variáveis de cor, tipografia e espaçamento vinculadas.
*   **🤖 Inteligência Artificial:** Integração com Gemini Pro/Flash para escrita técnica refinada.

---

## 🛠️ Como Instalar e Rodar

1.  **Clone este repositório:**
    ```bash
    git clone https://github.com/mariogomesbarbosa/DSI.git
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **No Figma:**
    *   Vá em `Plugins` > `Development` > `Import plugin from manifest...`.
    *   Selecione o arquivo `manifest.json` na pasta do projeto.
4.  **Compile o código:**
    ```bash
    npm run watch
    ```

---

## ⚙️ Configuração da API

Para utilizar as funções de IA, você precisará de uma chave da API do Google Gemini:
1.  Obtenha sua chave em [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  No plugin, abra as configurações e salve sua chave localmente.

---

## 📸 Demonstração

![Assista à Demonstração](src/generation-demo.gif)

## 📐 Estrutura de Pastas

*   `code.ts`: Lógica principal da API do Figma e manipulação de nós.
*   `ui.html`: Interface visual (Svelte/HTML/CSS).
*   `src/`: Assets e ícones oficiais.
*   `⚙️ DSI Assets`: (Página no Figma) Onde os componentes auxiliares são armazenados.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

Desevolvido por [Mário Barbosa](https://github.com/mariogomesbarbosa).
