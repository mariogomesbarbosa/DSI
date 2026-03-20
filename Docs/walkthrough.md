# Walkthrough — Desabilitando Clip Content

Esta atualização garante que nenhum frame gerado pelo plugin AutoDocs tenha a propriedade **"Clip content"** habilitada. Isso evita que conteúdos (como sombras, badges ou elementos levemente fora da borda) fiquem escondidos nas seções da documentação.

## Alterações Implementadas

### 1. Helper `createFrame`
O helper principal de criação de frames já possuía a configuração `clipsContent = false` por padrão. Reerifiquei e garanti que ele cubra a maioria das seções e containers do plugin.

### 2. Badge de Status de Documentação
No gerador de componentes de status (`getOrCreateDocStatusBadge`), adicionei explicitamente `comp.clipsContent = false` para os componentes de status criados na página de assets.

### 3. Ícones e SVGs
Os frames gerados a partir de SVGs (como o ícone do Storybook e o Logo DSI) agora têm o `clipsContent` desabilitado logo após a criação via `figma.createNodeFromSvg`.

### 4. Clones de Preview
Para os previews de componentes (na seção de Anatomia e no Preview principal), adicionei uma verificação para garantir que o clone do componente também não realize o clip de conteúdo, permitindo visualizar o componente em sua totalidade.

---
*Gerado automaticamente para garantir a melhor visualização da documentação.*
