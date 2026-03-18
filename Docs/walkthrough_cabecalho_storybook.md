# Walkthrough: Alteração no Cabeçalho e Integração com Storybook

Este documento descreve as alterações realizadas no plugin AutoDocs para reestruturar o `Cabeçalho-Card` e permitir a inserção de um link do Storybook via interface.

## Mudanças Realizadas

### 1. Interface do Plugin (`ui.html`)
- **Novo Campo**: Adicionado um campo de input para o usuário inserir o link da documentação do Storybook do componente selecionado.
- **Envio de Dados**: O script de geração foi atualizado para capturar esse link e enviá-lo ao backend do plugin (`code.ts`).

### 2. Estrutura do Cabeçalho (`code.ts`)
O `Cabeçalho-Card` foi reestruturado para seguir o layout solicitado:
- **Cabeçalho-Card**: Agora utiliza Auto Layout **Vertical** com gap de 16px e padding de 40px.
- **Title (Superior)**: Frame horizontal contendo:
    - **Cabeçalho-Esq**: Nome do componente e descrição curta.
    - **Logo**: Logotipo DSI reposicionado à direita.
- **Bottom (Inferior)**: Frame horizontal com gap automático (Space Between) contendo:
    - **Status-Badge**: Indicador de status do componente.
    - **Button Storybook**: Novo botão estilizado com o ícone oficial e o link fornecido. O texto "Storybook" agora possui um **hyperlink nativo** do Figma, permitindo que o usuário clique diretamente para abrir a documentação.

### 3. Botão Storybook
- **Ícone**: Implementado utilizando o SVG oficial (`src/icon-storybook.svg`).
- **Ação**: O botão recebe o link da UI. Embora o Figma não suporte links externos nativos em nós do canvas da mesma forma que a web, o link é armazenado nos dados do plugin (`PluginData`) e configurado como `RelaunchData` para facilitar o acesso.

### 4. Correções Técnicas (Bugfix)
- **Erro de Layout**: Corrigido o erro `in set_layoutSizingHorizontal: FILL can only be set on children of auto-layout frames`. A correção garantiu que todos os elementos sejam anexados a um container pai com Auto Layout antes de definir suas propriedades de redimensionamento `FILL`.

## Como Verificar
1. Selecione um componente no Figma.
2. No plugin, preencha a descrição e o novo campo **Link do Storybook**.
3. Clique em **Gerar Documentação**.
4. O novo `Cabeçalho-Card` será gerado com a estrutura vertical e o botão do Storybook no canto inferior direito.

---
*Alteração realizada seguindo as especificações de design e estrutura fornecidas.*
