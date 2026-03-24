# Figma API Quirks & Limits

## Restrições Comuns e Gotchas.

### 1. The Font Error
> "A font must be loaded before it can be used"
Regra clássica: antes de qualquer modificação de texto (`.characters` ou setar styles), o `Figtree` / `Inter` deve ser resolvida na Promessa `figma.loadFontAsync({family, style})`.
Sempre certifique que sua modificação UI chama `loadFonts()` primário em `generateDocumentation`.

### 2. O `clipsContent`
Nós instanciados copiam a propriedade de clipar. Componentes do AutoDocs preferem "sangrar" pra fora para pins voarem fora da caixa do layout (ex: Badge com o id da anatomia daquele botão sobrepondo a margem). Por isso, ativamente forçamos `.clipsContent = false` via código em certos wrappers.

### 3. Read-Only Properties
Não modifique diretamente `node.children` fazendo manipulação direta de array (ex: loop `.push`). Anexar sempre ocorre com `.appendChild()`.
`.variantProperties` é read-only; use overloads ou clone em `ComponentSet` com instâncias apropriadas e verifique propriedades para setar variants `overrides`.

### 4. Instance vs Component Rescalers
Um `ComponentNode` e `InstanceNode` nem sempre aceitam `.resize()` amigavelmente sem desconfigurar as Constraints. Preferimos o uso metodológico de proporções ao clonar previews: calculamos e aplicamos `node.rescale(fator)`. E se propriedades faltam: lembre do Wrap do TSType! `if ('rescale' in inst) inst.rescale(...)`.

*(Se cruzar com um problema novo de API não listado que trave a thread, venha atualizar isso)*.
