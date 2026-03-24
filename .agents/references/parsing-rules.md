# Parsing Rules Data Extraction

A extração de dados do Node selecionado pelo usuário passa por `extractComponentData()`.
Se não for `COMPONENT` ou `COMPONENT_SET`, o fluxo é abortado.

## Extração de Dados 

### 1. Variants vs. States:
Um Component Set no Figma possui strings de definição ex: `Type=Primary, State=Hover, Size=LG`.
Analisamos a Key:
- `STATE_KEYWORDS`: `['state', 'estado', 'status', 'hover', 'pressed', 'active', 'disabled', 'focus', 'loading']` se a key contiver algo dessa lista, agrupa em uma matriz de `states`.
- `SIZE_KEYWORDS`: `['size', 'tamanho', 'sizing', 'lg', 'md', 'sm', 'xl', 'xs']` -> se tiver algo assim, vai pro pool de Sizing.
- Se não for nem state/size: é tratado como variant normal (ex: Type, Icon=True).

### 2. Anatomia (Children):
Como lemos os nós? `const targetNode = node.type === 'COMPONENT_SET' ? node.defaultVariant : node;`.
E listamos as camadas do Nível 1 apenas (filhos diretos), criando uma prop `anatomy.index`, `anatomy.layerName` e `layerType`. 

### 3. Tokens (`boundVariables`):
No Figma moderno, propriedades conectadas via sistema local de variáveis ficam em `node.boundVariables[property]`. Nós extraímos IDs do Set.
Tornou-se complexo lidar com aliases do Figma, pois variáveis muitas vezes têm Alias recursivos, (ex: token base `color-blue-500` e semantic `primary-color`).
Temos um loop recursivo em `resolveTokens()` no qual rastreamos aliases originais ou convertemos para HEX literal se for Float ou Raw Color.

Se precisar alterar essas lógicas de conversão, sempre inspecione profundamente as keywords listadas e use Fallbacks para RGB (pois se não houver alias / token acoplado, recorremos à matriz de fills nativa!).
