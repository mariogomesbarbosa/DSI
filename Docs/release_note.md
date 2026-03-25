# 🚀 Release Notes — v1.3 (fix-hierarquia-informacao)

Esta release marca uma grande evolução na organização visual e técnica do plugin DSI - Documentation, introduzindo uma nova hierarquia de componentes e a funcionalidade de medições automáticas.

## ✨ Novidades e Melhorias

### 📐 Nova Hierarquia de Informação
Refatoramos toda a estrutura de renderização das seções para um layout mais limpo e profissional:
- **Estrutura de Seção**: Agora todas as seções seguem o padrão `Frame Principal (gap 24px)` → `Header (gap 12px)` → `Content (gap 24px)`.
- **Item-Padrão**: Itens em grids (Variantes e Specs) agora possuem seu próprio `Header (gap 8px)` interno, separando claramente o título/descrição do preview visual.
- **Seção "Quando usar"**: Layout simplificado que remove frames vazios de conteúdo, unindo título e texto de apoio no mesmo cabeçalho.

### 📏 Seção de Specs (Medidas)
Introduzimos a geração automática de especificações técnicas:
- **Cotas Automáticas**: Uso da *Measurement API* nativa do Figma para exibir largura, altura e espaçamentos internos nos previews.
- **Detecção de Layout**: Identificação automática de padding e gaps para componentes com Auto Layout.
- **Grids Adaptativos**: Exibição das especificações para diferentes tamanhos/variações do componente.

### 🍱 Identidade e Branding
- **Título Dinâmico**: O título do card principal agora é formatado como `Documentação - [Nome do Componente]`.
- **Tokens Organizados**: Melhoria no espaçamento e agrupamento de variáveis de cor, tamanho e tipografia.
- **Status Badges**: Refinamento visual na criação do componente `Doc-Status-Badge`.

## 🛠️ Correções e Estabilidade
- **SVG Rendering**: Desabilitado o recorte de conteúdo (`clipsContent = false`) em ícones SVG para evitar o corte acidental de ilustrações.
- **LifeCycle de Renderização**: Ajuste na ordem de anexação dos frames no documento Figma, garantindo que as medições sejam calculadas corretamente.
- **Gaps Consistentes**: Padronização dos espaços entre grupos de tokens (24px) para melhor leitura.

---
*DSI - Documentation Plugin — A ponte de documentação entre Designer e Desenvolvedor.*
