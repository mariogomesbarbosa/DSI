// ============================================================
// DSI Plugin v2.0 — code.ts
// Gera documentação estruturada de componentes Figma via ChatGPT
// ============================================================

// --- Tipos auxiliares ---

interface ComponentData {
  name: string;
  nodeType: string;
  description: string;
  variantProperties: VariantProperty[];
  states: StateInfo[];
  anatomy: AnatomyPart[];
  sizingVariants: string[];
  tokens: ComponentTokens;
  variants: VariantInfo[]; // Mantido para compatibilidade se necessário, mas usaremos variantProperties
}

interface VariantProperty {
  name: string;
  values: string[];
}

interface ComponentTokens {
  typography: { name: string; value: string; isAlias?: boolean; resolvedValue?: string }[];
  size: { name: string; value: string; isAlias?: boolean; resolvedValue?: string }[];
  color: { name: string; value: string; isAlias?: boolean; hexValue?: string; resolvedValue?: string }[];
}

interface VariantInfo {
  name: string;
  propKey: string;
  value: string;
}

interface StateInfo {
  variantName: string;
  states: string[];
}

interface AnatomyPart {
  index: number;
  layerName: string;
  layerType: string;
}

interface AIDocumentation {
  shortDescription: string;
  whenToUse: string;
  anatomy: { index: number; part: string; description: string }[];
  variants: { name: string; description: string }[];
  states: { variant: string; description: string }[];
  hierarchy: {
    explanation: string;
    sizeContext: { size: string; context: string }[];
  };
  applicationRules: {
    do: string[];
    dont: string[];
  };
}

// --- Constantes de estilo ---
const COLORS = {
  bg: '#F6F5F8',
  white: '#FFFFFF',
  blue: '#155DFC',
  dark: '#111111',
  darkGray: '#333333',
  mediumGray: '#6B6B6B',
  lightGray: '#E5E5E5',
  border: '#EBEBEB',
  accent: '#7C6DFF',
  success: '#059669',
  warning: '#C05917',
  token: '#7C6DFF',
  value: '#1D4ED8',
};

// ============================================================
// HELPERS UTILITÁRIOS
// ============================================================

function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(rgb.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(rgb.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

async function getTokenName(node: SceneNode, propertyName: string, fallbackValue: any): Promise<string> {
  if ('boundVariables' in node && node.boundVariables) {
    const boundVars = (node.boundVariables as any);
    if (boundVars[propertyName] && boundVars[propertyName].type === 'VARIABLE_ALIAS') {
      const variable = await figma.variables.getVariableByIdAsync(boundVars[propertyName].id);
      if (variable) {
        const cleanTokenName = variable.name.split('/').pop() || variable.name;
        return `${cleanTokenName} (${fallbackValue}px)`;
      }
    }
  }
  return `${fallbackValue}px`;
}

async function extrairPropriedadesBasicas(node: SceneNode): Promise<string> {
  let props = '';

  const wToken = await getTokenName(node, 'width', Math.round(node.width));
  const hToken = await getTokenName(node, 'height', Math.round(node.height));
  props += `width: ${wToken}\n`;
  props += `height: ${hToken}\n`;

  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    if ('paddingTop' in node) {
      const pt = await getTokenName(node, 'paddingTop', node.paddingTop);
      const pb = await getTokenName(node, 'paddingBottom', node.paddingBottom);
      const pl = await getTokenName(node, 'paddingLeft', node.paddingLeft);
      const pr = await getTokenName(node, 'paddingRight', node.paddingRight);
      if (pt !== '0px') props += `padding-top: ${pt}\n`;
      if (pb !== '0px') props += `padding-bottom: ${pb}\n`;
      if (pl !== '0px') props += `padding-left: ${pl}\n`;
      if (pr !== '0px') props += `padding-right: ${pr}\n`;
    }
    if ('itemSpacing' in node) {
      const gap = await getTokenName(node, 'itemSpacing', node.itemSpacing);
      if (gap !== '0px') props += `gap: ${gap}\n`;
    }
  }

  if ('cornerRadius' in node) {
    if (typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
      const radius = await getTokenName(node, 'cornerRadius', node.cornerRadius);
      props += `border-radius: ${radius}\n`;
    }
  }

  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    if ('boundVariables' in node && node.boundVariables && (node.boundVariables as any).fills) {
      const fillsVars = (node.boundVariables as any).fills;
      if (fillsVars.length > 0) {
        const variable = await figma.variables.getVariableByIdAsync(fillsVars[0].id);
        if (variable) {
          const cleanName = variable.name.split('/').pop() || variable.name;
          const paint = node.fills[0];
          const fallbackColor = (paint && paint.type === 'SOLID') ? rgbToHex(paint.color) : '';
          props += `background-color: ${cleanName} (${fallbackColor})\n`;
        }
      }
    } else {
      const paint = node.fills[0];
      if (paint && paint.type === 'SOLID') {
        props += `background-color: ${rgbToHex(paint.color)}\n`;
      }
    }
  }

  return props.trim();
}

async function extrairPropriedadesTexto(node: TextNode): Promise<string> {
  let props = '';

  if (node.fontName && typeof node.fontName !== 'symbol') {
    props += `font-family: ${node.fontName.family}\n`;
    props += `font-style: ${node.fontName.style}\n`;
  }
  if (typeof node.fontSize === 'number') {
    const sizeToken = await getTokenName(node, 'fontSize', node.fontSize);
    props += `font-size: ${sizeToken}\n`;
  }
  if (node.lineHeight && typeof node.lineHeight !== 'symbol' && node.lineHeight.unit !== 'AUTO') {
    const lhToken = await getTokenName(node, 'lineHeight', Math.round(node.lineHeight.value));
    props += `line-height: ${lhToken}\n`;
  }
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    if ('boundVariables' in node && node.boundVariables && (node.boundVariables as any).fills) {
      const fillsVars = (node.boundVariables as any).fills;
      if (fillsVars.length > 0) {
        const variable = await figma.variables.getVariableByIdAsync(fillsVars[0].id);
        if (variable) {
          const cleanName = variable.name.split('/').pop() || variable.name;
          const paint = node.fills[0];
          const fallback = (paint && paint.type === 'SOLID') ? rgbToHex(paint.color) : '';
          props += `color: ${cleanName} (${fallback})\n`;
        }
      }
    } else {
      const paint = node.fills[0];
      if (paint && paint.type === 'SOLID') {
        props += `color: ${rgbToHex(paint.color)}\n`;
      }
    }
  }
  return props;
}

function renderHighlightText(textNode: TextNode, fullText: string) {
  let currentIndex = 0;
  const lines = fullText.split('\n');

  for (const line of lines) {
    const matchLine = line.match(/^([^:]+):\s*(.+)$/);
    if (matchLine) {
      const prefix = matchLine[1] + ':';
      const value = matchLine[2];
      const matchToken = value.match(/^(.+?)\s*\((.+?)\)$/);
      const valIndex = line.indexOf(value, prefix.length);
      const absStart = currentIndex + valIndex;

      if (matchToken) {
        const tokenName = matchToken[1];
        const innerValue = matchToken[2];
        const tokenEnd = absStart + tokenName.length;
        const parensOffset = line.indexOf('(', valIndex);
        const parensEndOffset = line.indexOf(')', parensOffset);
        textNode.setRangeFills(absStart, tokenEnd, [figma.util.solidPaint(COLORS.token)]);
        textNode.setRangeTextDecoration(absStart, tokenEnd, 'UNDERLINE');
        const fallbackStart = currentIndex + parensOffset + 1;
        const fallbackEnd = currentIndex + parensEndOffset;
        if (innerValue.endsWith('px') || innerValue.startsWith('#')) {
          textNode.setRangeFills(fallbackStart, fallbackEnd, [figma.util.solidPaint(COLORS.value)]);
        }
      } else {
        const absEnd = absStart + value.length;
        if (value.endsWith('px') || value.startsWith('#')) {
          textNode.setRangeFills(absStart, absEnd, [figma.util.solidPaint(COLORS.value)]);
        }
      }
    }
    currentIndex += line.length + 1;
  }
}

// ============================================================
// HELPERS DE RENDERIZAÇÃO
// ============================================================

async function loadFonts() {
  await figma.loadFontAsync({ family: 'Figtree', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Figtree', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Figtree', style: 'Bold' });
  // Fallback para o default do Figma
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
}

function createText(
  characters: string,
  size: number,
  style: 'Regular' | 'Medium' | 'Bold',
  color: string = COLORS.dark,
  options?: { align?: TextNode['textAlignHorizontal']; layoutAlign?: 'INHERIT' | 'STRETCH' }
): TextNode {
  const t = figma.createText();
  t.fontName = { family: 'Figtree', style };
  t.characters = characters;
  t.fontSize = size;
  t.fills = [figma.util.solidPaint(color)];
  if (options?.align) t.textAlignHorizontal = options.align;
  if (options?.layoutAlign) t.layoutAlign = options.layoutAlign;
  return t;
}

function createFrame(name: string, options?: {
  direction?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  padding?: number | [number, number, number, number]; // top, right, bottom, left
  gap?: number;
  fill?: string;
  radius?: number;
  layoutAlign?: 'INHERIT' | 'STRETCH';
  layoutGrow?: number;
  primaryAlign?: FrameNode['primaryAxisAlignItems'];
  counterAlign?: FrameNode['counterAxisAlignItems'];
  fixedWidth?: number;
  fixedHeight?: number;
  autoWidth?: boolean;
  autoHeight?: boolean;
}): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.clipsContent = false; // Desabilitar clip content por padrão

  const dir = options?.direction ?? 'VERTICAL';
  if (dir === 'NONE') {
    // absolute positioning
    f.layoutMode = 'NONE';
  } else {
    f.layoutMode = dir;
  }

  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';

  if (options?.fixedWidth !== undefined) {
    f.counterAxisSizingMode = 'FIXED';
    f.resize(options.fixedWidth, f.height || 1);
  }
  if (options?.fixedHeight !== undefined) {
    f.primaryAxisSizingMode = 'FIXED';
    f.resize(f.width || 1, options.fixedHeight);
  }

  if (options?.padding !== undefined) {
    if (typeof options.padding === 'number') {
      f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = options.padding;
    } else {
      const [t, r, b, l] = options.padding;
      f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l;
    }
  }

  if (options?.gap !== undefined) f.itemSpacing = options.gap;

  f.fills = options?.fill ? [figma.util.solidPaint(options.fill)] : [];
  if (options?.radius !== undefined) f.cornerRadius = options.radius;
  if (options?.layoutAlign !== undefined) f.layoutAlign = options.layoutAlign;
  if (options?.layoutGrow !== undefined) f.layoutGrow = options.layoutGrow;
  if (options?.primaryAlign !== undefined) f.primaryAxisAlignItems = options.primaryAlign;
  if (options?.counterAlign !== undefined) f.counterAxisAlignItems = options.counterAlign;

  return f;
}

function createBadge(num: number): FrameNode {
  const badge = createFrame(`Badge-${num}`, {
    direction: 'VERTICAL',
    fill: COLORS.dark,
    primaryAlign: 'CENTER',
    counterAlign: 'CENTER',
  });
  badge.resize(22, 22);
  badge.cornerRadius = 11;

  const t = createText(num.toString(), 11, 'Bold', COLORS.white);
  badge.appendChild(t);
  return badge;
}

function createSectionFrame(titleText: string): FrameNode {
  const section = createFrame(`Seção — ${titleText}`, {
    direction: 'VERTICAL',
    gap: 24,
    padding: 28,
    radius: 12,
    fill: '#FFFFFF',
    layoutAlign: 'STRETCH',
  });

  const title = createText(titleText, 22, 'Bold', COLORS.blue);
  section.appendChild(title);

  return section;
}

function createPreviewCard(componentNode: ComponentNode | InstanceNode): FrameNode {
  const card = createFrame('Preview', {
    direction: 'VERTICAL',
    fill: COLORS.white,
    radius: 12,
    padding: 32,
    primaryAlign: 'CENTER',
    counterAlign: 'CENTER',
    layoutAlign: 'STRETCH',
    layoutGrow: 1,
  });

  let clone: InstanceNode;
  if (componentNode.type === 'COMPONENT') {
    clone = (componentNode as ComponentNode).createInstance();
  } else {
    clone = (componentNode as InstanceNode).clone();
  }

  if ('clipsContent' in clone) (clone as any).clipsContent = false;

  const MAX = 280;
  if (clone.width > MAX || clone.height > MAX) {
    const factor = Math.min(MAX / clone.width, MAX / clone.height);
    if ('rescale' in clone) clone.rescale(factor);
  }

  card.appendChild(clone);
  return card;
}

function createDocFrame(componentName: string): FrameNode {
  const doc = createFrame(`Docs — ${componentName}`, {
    direction: 'VERTICAL',
    padding: 0,
    gap: 0,
    fill: COLORS.bg,
  });
  doc.counterAxisSizingMode = 'FIXED';
  doc.resize(1080, 100);
  doc.primaryAxisSizingMode = 'AUTO'; // Garante o comportamento 'Hug content' na altura

  return doc;
}

// ============================================================
// EXTRAÇÃO DE DADOS DO COMPONENTE
// ============================================================

async function extractComponentData(node: ComponentNode | ComponentSetNode | InstanceNode): Promise<ComponentData> {
  const data: ComponentData = {
    name: node.name.split('=').pop()?.trim() || node.name,
    nodeType: node.type,
    description: ('description' in node && node.description) ? node.description : '',
    variantProperties: [],
    states: [],
    anatomy: [],
    sizingVariants: [],
    tokens: { typography: [], size: [], color: [] },
    variants: [],
  };

  // Extrair anatomia (camadas de nível 1 do componente principal)
  const targetNode = node.type === 'COMPONENT_SET' ? node.defaultVariant : node;
  if ('children' in targetNode) {
    let idx = 1;
    for (const child of (targetNode as any).children as SceneNode[]) {
      data.anatomy.push({
        index: idx++,
        layerName: child.name,
        layerType: child.type,
      });
    }
  }

  // Extrair variantes e estados (apenas COMPONENT_SET)
  if (node.type === 'COMPONENT_SET') {
    const compSet = node as ComponentSetNode;
    const propDefs = compSet.componentPropertyDefinitions;
    const STATE_KEYWORDS = ['state', 'estado', 'status', 'hover', 'pressed', 'active', 'disabled', 'focus', 'loading'];
    const SIZE_KEYWORDS = ['size', 'tamanho', 'sizing', 'lg', 'md', 'sm', 'xl', 'xs'];

    for (const key in propDefs) {
      if (propDefs[key].type !== 'VARIANT') continue;
      const cleanKey = key.split('#')[0];
      const keyLower = cleanKey.toLowerCase();
      const options: string[] = propDefs[key].variantOptions || [];

      const isState = STATE_KEYWORDS.some(kw => keyLower.includes(kw));
      const isSize = SIZE_KEYWORDS.some(kw => keyLower.includes(kw));

      if (isState) {
        data.states.push({
          variantName: cleanKey,
          states: options,
        });
      } else if (isSize) {
        data.sizingVariants = options;
      } else {
        data.variantProperties.push({
          name: cleanKey,
          values: options,
        });
        // Mantém data.variants para retrocompatibilidade se algum outro lugar usar
        for (const opt of options) {
          data.variants.push({ name: opt, propKey: cleanKey, value: opt });
        }
      }
    }
  }

  // --- Mapeamento de Tokens do Componente ---
  const tokenIds = {
    typographyStyles: new Set<string>(),
    size: new Set<string>(),
    color: new Set<string>(),
  };

  function collectVariables(currentNode: SceneNode) {
    if ('boundVariables' in currentNode && currentNode.boundVariables) {
      const bv = currentNode.boundVariables as any;

      if (currentNode.type === 'TEXT' && typeof (currentNode as TextNode).textStyleId === 'string') {
        tokenIds.typographyStyles.add((currentNode as TextNode).textStyleId as string);
      }

      ['width', 'height', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'itemSpacing', 'cornerRadius', 'topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius'].forEach(prop => {
        if (bv[prop]) tokenIds.size.add(bv[prop].id);
      });

      if (bv.fills) {
        if (Array.isArray(bv.fills)) bv.fills.forEach((v: any) => v && tokenIds.color.add(v.id));
        else tokenIds.color.add(bv.fills.id);
      }
      if (bv.strokes) {
        if (Array.isArray(bv.strokes)) bv.strokes.forEach((v: any) => v && tokenIds.color.add(v.id));
        else tokenIds.color.add(bv.strokes.id);
      }
    }

    if ('children' in currentNode) {
      for (const child of (currentNode as any).children) {
        collectVariables(child as SceneNode);
      }
    }
  }

  if (node.type === 'COMPONENT_SET') {
    for (const child of (node as ComponentSetNode).children) {
      collectVariables(child as SceneNode);
    }
  } else {
    collectVariables(node as SceneNode);
  }

  async function resolveTokens(ids: Set<string>): Promise<{ name: string, value: string, isAlias?: boolean, hexValue?: string, resolvedValue?: string }[]> {
    const result: { name: string, value: string, isAlias?: boolean, hexValue?: string, resolvedValue?: string }[] = [];
    for (const id of Array.from(ids)) {
      try {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v) {
          const name = v.name.split('/').pop() || v.name;
          let valStr = '';
          const rawValues = Object.values(v.valuesByMode);
          let rawVal = rawValues.length > 0 ? rawValues[0] : null;

          let isAlias = false;
          let aliasName = '';
          let hexValue = '';
          let resolvedValue = '';

          // Resolução recursiva de aliases
          while (rawVal && typeof rawVal === 'object' && 'type' in rawVal && (rawVal as any).type === 'VARIABLE_ALIAS') {
            const aliasVar = await figma.variables.getVariableByIdAsync((rawVal as VariableAlias).id);
            if (aliasVar) {
              isAlias = true;
              aliasName = aliasVar.name.split('/').pop() || aliasVar.name;
              rawVal = Object.values(aliasVar.valuesByMode)[0];
            } else {
              break;
            }
          }

          if (v.resolvedType === 'COLOR' && rawVal && typeof rawVal === 'object' && 'r' in rawVal) {
            const color = rawVal as RGBA;
            hexValue = rgbToHex(color);
            if (color.a !== undefined && color.a < 1) {
              hexValue += ` (${Math.round(color.a * 100)}%)`;
            }
          } else if (v.resolvedType === 'FLOAT') {
            resolvedValue = `${rawVal}px`;
          } else if (v.resolvedType === 'STRING') {
            resolvedValue = rawVal as string;
          }

          if (isAlias) {
            valStr = aliasName;
          } else {
            if (hexValue) {
              valStr = hexValue;
            } else if (resolvedValue) {
              valStr = resolvedValue;
            } else {
              valStr = String(rawVal);
            }
          }

          result.push({ name, value: valStr, isAlias, hexValue, resolvedValue });
        }
      } catch (e) {
        // ignora token se der falha
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async function resolveTextStyles(ids: Set<string>): Promise<{ name: string, value: string, isAlias?: boolean }[]> {
    const result: { name: string, value: string, isAlias?: boolean }[] = [];
    for (const id of Array.from(ids)) {
      if (!id) continue;
      try {
        const style = await figma.getStyleByIdAsync(id) as TextStyle;
        if (style) {
          const name = style.name.split('/').pop() || style.name;
          const size = style.fontSize;
          let lhStr = 'Auto';
          if (style.lineHeight && style.lineHeight.unit !== 'AUTO') {
            lhStr = style.lineHeight.unit === 'PIXELS'
              ? `${Math.round(style.lineHeight.value)}px`
              : `${Math.round(style.lineHeight.value)}%`;
          }
          result.push({ name, value: `${size} / ${lhStr}` });
        }
      } catch (e) {
        // ignora erro silenciosamente
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  data.tokens.typography = await resolveTextStyles(tokenIds.typographyStyles);
  data.tokens.size = await resolveTokens(tokenIds.size);
  data.tokens.color = await resolveTokens(tokenIds.color);

  return data;
}

// ============================================================
// CHAMADA AO GEMINI
// ============================================================

async function callGemini(apiKey: string, componentData: ComponentData, userDescription: string): Promise<AIDocumentation> {
  // Limitar listas para evitar prompts muito grandes
  const MAX_ANATOMY = 8;
  const MAX_VARIANTS = 10;
  const MAX_STATES = 5;

  const anatomyList = componentData.anatomy.slice(0, MAX_ANATOMY);
  const variantList = componentData.variants.slice(0, MAX_VARIANTS);
  const stateList = componentData.states.slice(0, MAX_STATES);

  const anatomyText = anatomyList.length > 0
    ? anatomyList.map(p => `- Parte ${p.index}: ${p.layerName} (${p.layerType})`).join('\n')
    : 'Não identificado.';

  const variantsText = componentData.variantProperties.length > 0
    ? componentData.variantProperties.map(p => `- ${p.name}: ${p.values.join(', ')}`).join('\n')
    : 'Nenhuma variante.';

  const statesText = stateList.length > 0
    ? stateList.map(s => `- ${s.variantName}: ${s.states.slice(0, 6).join(', ')}`).join('\n')
    : 'Nenhum estado.';

  const sizingText = componentData.sizingVariants.length > 0
    ? componentData.sizingVariants.join(', ')
    : 'Nenhum.';

  const prompt = `Você é um especialista em Design Systems. Gere documentação para o componente abaixo.
A documentação deve ser lida de forma RÁPIDA e OBJETIVA. Use frases curtas e tópicos. Evite textos longos ou redundantes.

Nome: ${componentData.name}
Contexto: ${userDescription}
Anatômia: ${anatomyText}
Variantes: ${variantsText}
Estados: ${statesText}
Tamanhos: ${sizingText}

Retorne APENAS JSON válido com esta estrutura:
{
  "shortDescription": "Resumo em até 2 frases sobre o objetivo e uso do componente",
  "whenToUse": "1 parágrafo curto e direto (máx 3 linhas)",
  "anatomy": [{"index":1,"part":"nome","description":"frase curta sobre a função"}],
  "variants": [{"name":"nome","description":"frase curta sobre quando usar"}],
  "states": [{"variant":"grupo","description":"explicação objetiva dos estados"}],
  "hierarchy": {
    "explanation": "1 parágrafo curto e objetivo sobre o uso",
    "sizeContext": [{"size":"LG — 56px","context":"frase curta: onde usar"}]
  },
  "applicationRules": {
    "do": ["regra curta 1","regra curta 2","regra curta 3"],
    "dont": ["regra curta 1","regra curta 2","regra curta 3"]
  }
}

Escreva em português brasileiro. Seja extremamente conciso.`;

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 1,
        maxOutputTokens: 2000,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMsg = (err as any)?.error?.message || '';
    const errCode = (err as any)?.error?.code || response.status;

    if (response.status === 429) {
      throw new Error('Limite de requisições atingido (rate limit).\n\nAguarde alguns segundos e tente novamente.');
    }
    if (response.status === 400 && errMsg.includes('API_KEY')) {
      throw new Error('Chave de API do Gemini inválida.\n\nObtena sua chave em aistudio.google.com/apikey.');
    }
    if (response.status === 403) {
      throw new Error('Acesso negado.\n\nVerifique se sua chave do Gemini tem permissão para usar a API.');
    }

    throw new Error(`Erro na API Gemini (${errCode}): ${errMsg || response.statusText}`);
  }

  const data = await response.json();
  const parts: any[] = data?.candidates?.[0]?.content?.parts || [];

  // Gemini 2.5 é um modelo de "thinking" — pode retornar múltiplos parts.
  // Partes com thought:true são o raciocínio interno; precisamos do último part sem thought.
  const contentPart = parts.filter((p: any) => !p.thought).pop();
  const content: string = contentPart?.text || '';

  if (!content) {
    const finishReason = data?.candidates?.[0]?.finishReason || 'UNKNOWN';
    throw new Error(`Gemini retornou resposta vazia (motivo: ${finishReason}). Tente novamente.`);
  }

  function extractJSON(raw: string): string {
    // 1. Tentar extrair de bloco ```json ... ```
    const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    // 2. Tentar extrair objeto JSON solto
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0].trim();
    // 3. Retornar o raw (vai falhar no parse e lançar erro)
    return raw.trim();
  }

  try {
    return JSON.parse(extractJSON(content)) as AIDocumentation;
  } catch {
    throw new Error('A resposta do Gemini não estava em formato JSON válido. Tente novamente.');
  }
}


// ===================================
// Componente Customizado: Status Badge
// ===================================
// Cria um Component Set para o status na página de assets, se não existir
async function getOrCreateDocStatusBadge(): Promise<ComponentSetNode> {
  await figma.loadAllPagesAsync();
  const COMP_NAME = 'Doc-Status-Badge';
  const existing = figma.root.findOne(n => n.name === COMP_NAME && n.type === 'COMPONENT_SET') as ComponentSetNode;
  if (existing) {
    existing.children.forEach(child => {
      if (child.type === 'COMPONENT') {
        child.primaryAxisSizingMode = 'AUTO';
        child.counterAxisSizingMode = 'AUTO';
      }
    });
    return existing;
  }

  const statuses = [
    { status: 'Em design', bg: '#EFF6FF', color: '#1D4ED8' },        // Info
    { status: 'Em desenvolvimento', bg: '#FEF3C7', color: '#B45309' }, // Warning
    { status: 'Em validação', bg: '#F3E8FF', color: '#7E22CE' },     // Purple
    { status: 'Publicado', bg: '#ECFDF5', color: '#047857' },        // Success
  ];

  const components: ComponentNode[] = [];
  let x = 0;

  for (const s of statuses) {
    const comp = figma.createComponent();
    comp.name = `Status=${s.status}`;
    comp.clipsContent = false;
    comp.layoutMode = 'HORIZONTAL';
    comp.primaryAxisAlignItems = 'CENTER';
    comp.counterAxisAlignItems = 'CENTER';
    comp.primaryAxisSizingMode = 'AUTO';
    comp.counterAxisSizingMode = 'AUTO';
    comp.paddingLeft = 12;
    comp.paddingRight = 12;
    comp.paddingTop = 6;
    comp.paddingBottom = 6;
    comp.itemSpacing = 0;
    comp.cornerRadius = 100;

    comp.fills = [figma.util.solidPaint(s.bg)];
    const t = createText(s.status, 13, 'Medium', s.color);
    comp.appendChild(t);

    comp.x = x;
    components.push(comp);
    x += comp.width + 16;
  }

  const compSet = figma.combineAsVariants(components, figma.currentPage);
  compSet.name = COMP_NAME;

  // Move para uma página de Assets para não sujar o design do usuário
  let assetsPage = figma.root.children.find(p => p.name === '⚙️ DSI Assets');
  if (!assetsPage) {
    assetsPage = figma.createPage();
    assetsPage.name = '⚙️ DSI Assets';
  }
  assetsPage.appendChild(compSet);

  return compSet;
}

// ===================================
// Componente Customizado: Storybook Button
// ===================================

function createStorybookButton(link: string): FrameNode {
  const btn = createFrame('Button Storybook', {
    direction: 'HORIZONTAL',
    padding: [8, 16, 8, 16],
    gap: 8,
    radius: 6,
    fill: '#FFFFFF',
    counterAlign: 'CENTER',
  });
  btn.strokes = [figma.util.solidPaint('#FF4081')];
  btn.strokeWeight = 1;

  // Icon
  const iconSvg = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.7401 15.9992L2.19618 15.422C2.0317 15.4138 1.8767 15.3426 1.76328 15.2232C1.64986 15.1038 1.58671 14.9454 1.58691 14.7807V1.86307C1.58691 1.70408 1.64597 1.55076 1.75262 1.43285C1.85927 1.31494 2.00592 1.24084 2.16411 1.22494L13.708 0.0032148C13.7971 -0.00574283 13.8872 0.00406946 13.9723 0.0320196C14.0574 0.0599697 14.1357 0.105437 14.2021 0.165494C14.2686 0.22555 14.3217 0.298864 14.3581 0.38071C14.3945 0.462556 14.4134 0.551119 14.4135 0.640695V15.3585C14.4134 15.4454 14.3957 15.5314 14.3614 15.6112C14.3271 15.691 14.277 15.7631 14.214 15.8229C14.151 15.8828 14.0765 15.9292 13.9951 15.9594C13.9136 15.9896 13.8269 16.0036 13.7401 15.9992Z" fill="#FF4081"/>
<path d="M10.5655 2.89817L10.6874 0.177656L13.0276 0.00129051L13.1302 2.8039C13.1307 2.85141 13.1124 2.89719 13.0792 2.93121C13.046 2.96523 13.0007 2.98471 13.1302 2.8039C13.1307 2.85141 13.1124 2.89719 13.0792 2.93121L12.9532 2.98539C12.9096 2.98598 12.8671 2.97173 12.8326 2.94499L11.9271 2.25684L10.8573 3.04568C10.8184 3.07389 10.7702 3.08598 10.7226 3.0794C10.675 3.07283 10.6318 3.0481 10.6021 3.0104C10.5771 2.97843 10.5642 2.93871 10.5655 2.89817ZM9.20076 7.16108C9.20076 7.47341 11.4121 7.32141 11.7096 7.10079C11.7096 4.96902 10.5104 3.84734 8.31188 3.84734C6.1179 3.84734 4.88398 4.98505 4.88398 6.69227C4.88398 9.66931 9.09174 9.72896 9.09174 11.3522C9.10344 11.4521 9.09199 11.5533 9.05827 11.6481C9.02456 11.7429 8.96947 11.8286 8.8973 11.8987C8.82512 11.9688 8.73778 12.0213 8.64205 12.0522C8.54631 12.0831 8.44475 12.0915 8.34523 12.0769C7.67376 12.0769 7.40953 11.7485 7.43903 10.639C7.43903 10.3985 4.88398 10.3222 4.80895 10.639C4.61142 13.3313 6.36481 14.1086 8.37473 14.1086C10.3212 14.1086 11.8482 13.1145 11.8482 11.3239C11.8482 8.13462 7.58141 8.21863 7.58141 6.63583C7.57542 6.53272 7.59256 6.42957 7.63159 6.33394C7.67062 6.23831 7.73054 6.15262 7.80696 6.08314C7.88339 6.01366 7.97438 5.96216 8.07329 5.9324C8.17219 5.90263 8.2765 5.89537 8.37858 5.91113C8.68514 5.91113 9.24694 5.96244 9.20076 7.16108Z" fill="#FAFAFA"/>
</svg>`;
  const icon = figma.createNodeFromSvg(iconSvg);
  icon.clipsContent = false;
  btn.appendChild(icon);

  const label = createText('Storybook', 14, 'Medium', '#FF4081');
  btn.appendChild(label);

  if (link) {
    btn.setRelaunchData({ open: 'Acessar documentação no Storybook' });
    btn.setPluginData('storybookLink', link);

    // Aplicar link nativo ao texto (Hyperlink)
    try {
      label.setRangeHyperlink(0, label.characters.length, { type: 'URL', value: link });
    } catch (e) {
      console.error("Erro ao aplicar hyperlink:", e);
    }
  }

  return btn;
}

async function renderHeader(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation, storybookLink?: string) {
  const headerCard = createFrame('Cabeçalho-Card', {
    direction: 'VERTICAL',
    fill: COLORS.white,
    gap: 16,
    radius: 12,
    padding: 40,
    layoutAlign: 'STRETCH',
  });
  parentFrame.appendChild(headerCard);
  (headerCard as any).layoutSizingHorizontal = 'FILL';

  // --- Linha Superior: Title (Esq + Logo) ---
  const titleRow = createFrame('Title', {
    direction: 'HORIZONTAL',
    gap: 32,
    padding: 0,
    layoutAlign: 'STRETCH',
    counterAlign: 'MIN',
  });
  headerCard.appendChild(titleRow);
  (titleRow as any).layoutSizingHorizontal = 'FILL';

  const leftContent = createFrame('Cabeçalho-Esq', {
    direction: 'VERTICAL',
    gap: 24,
    layoutAlign: 'STRETCH',
  });
  leftContent.layoutGrow = 1;

  const textGroup = createFrame('Text-Group', {
    direction: 'VERTICAL',
    gap: 12,
    layoutAlign: 'STRETCH',
  });

  const title = createText(componentData.name, 40, 'Bold', COLORS.dark);
  title.layoutAlign = 'STRETCH';
  textGroup.appendChild(title);

  const descText = aiDocs.shortDescription || componentData.description;
  if (descText) {
    const desc = createText(descText, 16, 'Regular', COLORS.mediumGray);
    desc.layoutAlign = 'STRETCH';
    desc.textAutoResize = 'HEIGHT';
    desc.lineHeight = { value: 150, unit: 'PERCENT' };
    textGroup.appendChild(desc);
  }

  leftContent.appendChild(textGroup);
  titleRow.appendChild(leftContent);

  // Logo DSI
  const logoFrame = createFrame('Logo', {
    direction: 'NONE',
    fixedWidth: 46,
    fixedHeight: 46,
  });

  const dsiSvg = figma.createNodeFromSvg(`<svg width="46" height="46" viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_7379_28921)">
<rect width="46" height="46" rx="4" fill="white"/>
<g clip-path="url(#clip1_7379_28921)">
<path d="M40.7126 5.28736H5.28736V40.7126H40.7126V5.28736ZM46 46H0V0H46V46Z" fill="#51A2FF"/>
<path d="M14.4063 18.2666C15.6559 18.2667 16.7078 18.4748 17.5621 18.891C18.4163 19.2946 19.0666 19.9505 19.5128 20.8586C19.9591 21.7541 20.1822 22.946 20.1822 24.4343C20.1822 25.7392 19.9915 26.8236 19.6102 27.6876H28.5454C29.1625 27.6876 29.6659 27.1896 29.6659 26.5792C29.6659 25.9687 29.1625 25.4707 28.5454 25.4707H23.5113C21.6438 25.31 20.1822 23.7678 20.1822 21.8883C20.1822 19.9124 21.8061 18.306 23.8198 18.306H33.5796V21.0691C33.5796 21.0691 23.8259 21.069 23.8198 21.053C23.3489 21.053 22.9753 21.4385 22.9753 21.8883C22.9753 22.3381 23.3651 22.7076 23.8198 22.7076H28.5616C30.7052 22.7076 32.4591 24.4426 32.4591 26.5792C32.4591 28.7157 30.7052 30.4507 28.5454 30.4507H15.0965L15.132 30.4255C14.8982 30.4421 14.6563 30.4507 14.4063 30.4507H9.07031V18.2666H14.4063ZM36.9295 30.4507H33.5842V21.0691H36.9295V30.4507ZM12.1495 28.1047H13.9855C14.6486 28.1047 15.2032 28.0101 15.6494 27.8209C16.1085 27.6191 16.4528 27.2533 16.6823 26.7236C16.9245 26.1939 17.0457 25.4307 17.0457 24.4343C17.0457 23.4253 16.9372 22.6496 16.7205 22.1073C16.5165 21.5524 16.185 21.1677 15.726 20.9532C15.2797 20.7262 14.6996 20.6127 13.9855 20.6127H12.1495V28.1047ZM36.9284 18.3123H33.5831V15.5493H36.9284V18.3123Z" fill="#51A2FF"/>
</g>
</g>
<defs>
<clipPath id="clip0_7379_28921">
<rect width="46" height="46" rx="4" fill="white"/>
</clipPath>
<clipPath id="clip1_7379_28921">
<rect width="46" height="46" fill="white"/>
</clipPath>
</defs>
</svg>`);
  dsiSvg.clipsContent = false;
  logoFrame.appendChild(dsiSvg);
  titleRow.appendChild(logoFrame);

  headerCard.appendChild(titleRow);

  // --- Linha Inferior: Bottom (Status + Button Storybook) ---
  const bottomRow = createFrame('Bottom', {
    direction: 'HORIZONTAL',
    padding: 0,
    layoutAlign: 'STRETCH',
    primaryAlign: 'SPACE_BETWEEN',
    counterAlign: 'CENTER',
  });
  headerCard.appendChild(bottomRow);
  (bottomRow as any).layoutSizingHorizontal = 'FILL';

  // Badge Status
  let badgeFrame: SceneNode;
  try {
    const badgeSet = await getOrCreateDocStatusBadge();
    const inst = badgeSet.defaultVariant.createInstance();
    inst.name = 'Status-Badge';
    badgeFrame = inst;
  } catch (error) {
    console.error("Erro ao instanciar Doc-Status-Badge:", error);
    const fallbackFrame = createFrame('Status-Badge', {
      direction: 'HORIZONTAL',
      fill: '#EFF6FF',
      radius: 100,
      padding: [6, 12, 6, 12],
      gap: 0,
      counterAlign: 'CENTER',
    });
    fallbackFrame.primaryAxisSizingMode = 'AUTO';
    (fallbackFrame as any).counterAxisAlignItems = 'CENTER';
    const badgeText = createText('Em design', 13, 'Medium', '#1D4ED8');
    fallbackFrame.appendChild(badgeText);
    badgeFrame = fallbackFrame;
  }
  bottomRow.appendChild(badgeFrame);

  // Storybook Button
  const storybookBtn = createStorybookButton(storybookLink || '');
  bottomRow.appendChild(storybookBtn);
}

// ============================================================
// SEÇÃO: QUANDO USAR
// ============================================================

function renderWhenToUse(parentFrame: FrameNode, aiDocs: AIDocumentation) {
  const section = createSectionFrame('Quando usar');
  section.layoutAlign = 'STRETCH';

  const text = createText(aiDocs.whenToUse, 16, 'Regular', COLORS.darkGray);
  text.layoutAlign = 'STRETCH';
  text.textAutoResize = 'HEIGHT';
  text.lineHeight = { value: 160, unit: 'PERCENT' };
  section.appendChild(text);

  parentFrame.appendChild(section);
}

// ============================================================
// SEÇÃO: ANATOMIA
// ============================================================

async function renderAnatomy(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation, originNode: SceneNode) {
  const section = createSectionFrame('Anatomia');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section);

  const targetNode = componentData.nodeType === 'COMPONENT_SET'
    ? (originNode as ComponentSetNode).defaultVariant
    : originNode as ComponentNode | InstanceNode;

  // Row: Preview + Lista
  const row = createFrame('Anatomia-Row', {
    direction: 'HORIZONTAL',
    gap: 24,
  });
  section.appendChild(row); // Anexar PRIMEIRO para propriedades de AL funcionarem
  row.layoutAlign = 'STRETCH';
  (row as any).layoutSizingHorizontal = 'FILL';

  // Preview com pinos
  const previewCard = createFrame('Anatomia-Preview', {
    direction: 'VERTICAL',
    fill: '#E9E9E9',
    radius: 12,
    layoutGrow: 1,
    layoutAlign: 'STRETCH',
    primaryAlign: 'CENTER',
    counterAlign: 'CENTER',
  });
  row.appendChild(previewCard); // Anexar PRIMEIRO
  previewCard.resize(480, 340);
  (previewCard as any).layoutSizingVertical = 'FIXED';
  (previewCard as any).layoutSizingHorizontal = 'FILL';

  // Clonar e centralizar
  let clone: InstanceNode | SceneNode;
  if (targetNode.type === 'COMPONENT') {
    clone = (targetNode as ComponentNode).createInstance();
  } else {
    clone = (targetNode as InstanceNode).clone();
  }

  if ('clipsContent' in clone) (clone as any).clipsContent = false;

  const MAX = 240;
  const origW = clone.width;
  const origH = clone.height;
  let scale = 1;
  if (origW > MAX || origH > MAX) {
    scale = Math.min(MAX / origW, MAX / origH);
    if ('rescale' in clone) (clone as any).rescale(scale);
  }

  // Wrap clone + pins num frame do tamanho exato do clone
  const innerFrame = createFrame('Anatomia-Inner', {
    direction: 'NONE',
  });
  innerFrame.resize(clone.width, clone.height);
  innerFrame.clipsContent = false;
  innerFrame.fills = []; // transparente

  clone.x = 0;
  clone.y = 0;
  innerFrame.appendChild(clone);

  // Desenhar pinos sobre partes da anatomia
  const PIN_SIZE = 22;

  for (const part of componentData.anatomy) {
    // Tentar achar o nó filho correspondente dentro do clone escalado
    let childNode: SceneNode | null = null;
    if ('children' in clone) {
      childNode = ((clone as any).children as SceneNode[]).find((c: any) => c.name === part.layerName) || null;
    }

    let pinX: number, pinY: number;
    if (childNode) {
      // Posição relativa ao innerFrame, próxima ao filho exato
      const cx = childNode.x;
      const cy = childNode.y;
      const cw = childNode.width;
      const ch = childNode.height;

      pinX = Math.round(cx + cw / 2 - PIN_SIZE / 2);
      pinY = Math.round(cy - PIN_SIZE - 4);

      // Se passar muito do limite superior, posicionar abaixo do elemento
      if (pinY < -10) pinY = Math.round(cy + ch + 4);
    } else {
      // Fallback: posição escalonada no topo
      pinX = 12 + (part.index - 1) * 36;
      pinY = -PIN_SIZE - 4;
    }

    const pin = createBadge(part.index);
    pin.x = pinX;
    pin.y = pinY;
    innerFrame.appendChild(pin);
  }

  previewCard.appendChild(innerFrame);

  // Lista de partes
  const listCard = createFrame('Anatomia-Lista', {
    direction: 'VERTICAL',
    fill: 'rgba(255, 255, 255, 0)', // Transparente já que a seção agora é o card branco
    radius: 12,
    padding: 28,
    gap: 20,
    layoutGrow: 1,
    layoutAlign: 'STRETCH',
  });
  row.appendChild(listCard); // Anexar PRIMEIRO

  const listTitle = createText('Partes do componente', 14, 'Bold', COLORS.mediumGray);
  listCard.appendChild(listTitle);

  for (const aiPart of aiDocs.anatomy) {
    const partRow = createFrame(`Parte-${aiPart.index}`, {
      direction: 'HORIZONTAL',
      gap: 12,
      layoutAlign: 'STRETCH',
    });
    listCard.appendChild(partRow); // Anexar PRIMEIRO
    (partRow as any).counterAxisAlignItems = 'MIN';

    const badge = createBadge(aiPart.index);
    partRow.appendChild(badge);

    const textCol = createFrame(`Parte-${aiPart.index}-Text`, {
      direction: 'VERTICAL',
      gap: 2,
      layoutGrow: 1,
      layoutAlign: 'STRETCH',
    });
    partRow.appendChild(textCol); // Anexar PRIMEIRO

    const partName = createText(aiPart.part, 14, 'Bold', COLORS.dark);
    partName.layoutAlign = 'STRETCH';
    textCol.appendChild(partName);

    const partDesc = createText(aiPart.description, 13, 'Regular', COLORS.mediumGray);
    partDesc.layoutAlign = 'STRETCH';
    partDesc.textAutoResize = 'HEIGHT';
    partDesc.lineHeight = { value: 150, unit: 'PERCENT' };
    textCol.appendChild(partDesc);

    // Ajuste "Fill" após os nós terem um pai auto-layout
    (partRow as any).layoutSizingHorizontal = 'FILL';
    (partRow as any).layoutAlign = 'STRETCH';

    (textCol as any).layoutSizingHorizontal = 'FILL';
    (textCol as any).layoutGrow = 1;
  }
}

// ============================================================
// SEÇÃO: VARIANTES
// ============================================================

// Auxiliar para encontrar uma instância de variante que melhor corresponda ao nome dado pela IA
function findVariantInstance(compSet: ComponentSetNode, aiName: string, componentData: ComponentData): ComponentNode | null {
  const nameLower = aiName.toLowerCase();
  const parts = nameLower.split(/[\/\s,]+/).map(p => p.trim()).filter(p => p.length > 0);

  // 1. Tentar encontrar pelo nome exato ou parte do nome (como já era feito)
  let found = compSet.children.find(c =>
    c.type === 'COMPONENT' && c.name.toLowerCase().includes(nameLower)
  ) as ComponentNode | undefined;
  if (found) return found;

  // 2. Se não achou, tentar ver se aiName corresponde a uma CHAVE de propriedade (ex: "Tipo", "Color")
  const prop = componentData.variantProperties.find(p =>
    nameLower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(nameLower)
  );
  if (prop) {
    // Escolhe a primeira variante que tem essa propriedade definida (Figma usa Property=Value)
    found = compSet.children.find(c =>
      c.type === 'COMPONENT' && c.name.toLowerCase().includes(`${prop.name.toLowerCase()}=`)
    ) as ComponentNode | undefined;
    if (found) return found;
  }

  // 3. Tentar encontrar por qualquer uma das partes (para nomes agrupados como "Primary / Secondary")
  for (const part of parts) {
    if (part.length < 3) continue; // evita falsos positivos com strings curtas
    found = compSet.children.find(c =>
      c.type === 'COMPONENT' && c.name.toLowerCase().includes(part)
    ) as ComponentNode | undefined;
    if (found) return found;
  }

  // 4. Fallback: procurar nos valores das propriedades
  for (const prop of componentData.variantProperties) {
    for (const val of prop.values) {
      if (nameLower.includes(val.toLowerCase())) {
        found = compSet.children.find(c =>
          c.type === 'COMPONENT' && c.name.toLowerCase().includes(`${prop.name.toLowerCase()}=${val.toLowerCase()}`)
        ) as ComponentNode | undefined;
        if (found) return found;
      }
    }
  }

  return null;
}

// Auxiliar para encontrar uma variante exata por par Property=Value
function findVariantInstanceByProp(compSet: ComponentSetNode, propName: string, valueName: string): ComponentNode | null {
  const nameToSearch = `${propName.toLowerCase()}=${valueName.toLowerCase()}`;
  return compSet.children.find(c =>
    c.type === 'COMPONENT' && c.name.toLowerCase().includes(nameToSearch)
  ) as ComponentNode | null;
}

function findVariantWithOverrides(
  compSet: ComponentSetNode,
  baseNode: SceneNode,
  overrides: { [key: string]: string }
): ComponentNode | null {
  let baseProperties: { [key: string]: string } = {};
  if (baseNode.type === 'INSTANCE' || baseNode.type === 'COMPONENT') {
    baseProperties = { ...(baseNode.variantProperties || {}) };
  } else if (baseNode.type === 'COMPONENT_SET') {
    baseProperties = { ...((baseNode as ComponentSetNode).defaultVariant.variantProperties || {}) };
  }

  const targetProperties = { ...baseProperties, ...overrides };
  let bestMatch: ComponentNode | null = null;
  let maxScore = -1;

  for (const child of compSet.children) {
    if (child.type !== 'COMPONENT') continue;

    const cProps = (child as ComponentNode).variantProperties || {};

    // 1. O estado (ou propriedades em 'overrides') DEVE bater obrigatoriamente
    let matchesRequired = true;
    for (const [oKey, oVal] of Object.entries(overrides)) {
      const actualPropKey = Object.keys(cProps).find(k => k.toLowerCase() === oKey.toLowerCase());
      const actualVal = actualPropKey ? cProps[actualPropKey] : null;

      if (!actualVal || actualVal.toLowerCase() !== oVal.toLowerCase()) {
        matchesRequired = false;
        break;
      }
    }

    if (!matchesRequired) continue;

    // 2. Calcular pontuação para as outras propriedades (ex: Semantic)
    let currentScore = 0;
    for (const [targetKey, targetVal] of Object.entries(targetProperties)) {
      const actualPropKey = Object.keys(cProps).find(k => k.toLowerCase() === targetKey.toLowerCase());
      const actualVal = actualPropKey ? cProps[actualPropKey] : null;

      if (actualVal && actualVal.toLowerCase() === targetVal.toLowerCase()) {
        currentScore++;
      }
    }

    if (currentScore > maxScore) {
      maxScore = currentScore;
      bestMatch = child as ComponentNode;

      // Se tivermos um score perfeito (todas as props bateram), podemos parar
      if (currentScore === Object.keys(targetProperties).length) {
        return bestMatch;
      }
    }
  }

  return bestMatch;
}

async function renderVariants(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation, originNode: SceneNode) {
  if (aiDocs.variants.length === 0) return;

  const section = createSectionFrame('Variantes');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section);

  const intro = createText(
    'Cada variante tem uma função específica e deve ser usada de forma consistente em todos os produtos.',
    15,
    'Regular',
    COLORS.darkGray
  );
  intro.layoutAlign = 'STRETCH';
  intro.textAutoResize = 'HEIGHT';
  section.appendChild(intro);

  // Grid unificado que conterá todas as variantes/estados
  const mainGrid = figma.createFrame();
  mainGrid.name = 'Variantes-Grid';
  mainGrid.clipsContent = false;
  mainGrid.layoutMode = 'HORIZONTAL';
  mainGrid.layoutWrap = 'WRAP';
  mainGrid.itemSpacing = 24;
  mainGrid.counterAxisSpacing = 24;
  mainGrid.layoutAlign = 'STRETCH';
  mainGrid.primaryAxisSizingMode = 'FIXED'; // Necessário para WRAP e Fill funcionarem juntos
  mainGrid.counterAxisSizingMode = 'AUTO';
  section.appendChild(mainGrid);

  const compSet = originNode as ComponentSetNode;
  const targetNode = componentData.nodeType === 'COMPONENT_SET'
    ? (originNode as ComponentSetNode).defaultVariant
    : originNode as ComponentNode | InstanceNode;

  // Determinar tamanho do layout: Small (4/linha), Medium (2/linha), Large (1/linha)
  const maxDim = Math.max(targetNode.width, targetNode.height);
  const isSmall = maxDim < 150;
  const isLarge = targetNode.width >= 500;

  let cardWidth = 214;
  let cardHeight = 180;
  let gridGap = 16;

  if (isLarge) {
    cardWidth = 904;
    cardHeight = 480;
    gridGap = 24;
  } else if (!isSmall) {
    cardWidth = 440;
    cardHeight = 340;
    gridGap = 24;
  }
  mainGrid.itemSpacing = gridGap;

  for (const varInfo of aiDocs.variants) {
    const prop = componentData.variantProperties.find(p =>
      varInfo.name.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(varInfo.name.toLowerCase())
    );

    if (prop) {
      for (const valName of prop.values) {
        const itemFrame = createFrame(`Item-${valName}`, {
          direction: 'VERTICAL',
          gap: 12,
        });
        itemFrame.resize(cardWidth, cardHeight + 100); // Espaço extra para título e descrição
        itemFrame.layoutGrow = 0;
        mainGrid.appendChild(itemFrame);

        const title = createText(valName, 18, 'Bold', COLORS.dark);
        itemFrame.appendChild(title);

        const desc = createText(varInfo.description, 14, 'Regular', COLORS.mediumGray);
        desc.layoutAlign = 'STRETCH';
        desc.textAutoResize = 'HEIGHT';
        itemFrame.appendChild(desc);

        const card = createFrame(`Card-${valName}`, {
          direction: 'VERTICAL',
          fill: '#FFFFFF',
          radius: 8,
          padding: 12,
          gap: 10,
          counterAlign: 'CENTER',
          primaryAlign: 'CENTER',
          fixedWidth: cardWidth,
          fixedHeight: cardHeight,
        });
        card.strokes = [figma.util.solidPaint('#EBEBEB')];
        card.strokeWeight = 1;
        itemFrame.appendChild(card);

        const previewBackground = createFrame('Preview-BG', {
          direction: 'VERTICAL',
          fill: '#F5F5F7',
          radius: 4,
          padding: 16,
          primaryAlign: 'CENTER',
          counterAlign: 'CENTER',
          layoutAlign: 'STRETCH',
        });
        previewBackground.layoutGrow = 1;
        card.appendChild(previewBackground);

        const variantNode = findVariantInstanceByProp(compSet, prop.name, valName);
        if (variantNode) {
          const inst = variantNode.createInstance();
          const MAXW = cardWidth - 40;
          const MAXH = cardHeight - 80;
          if (inst.width > MAXW || inst.height > MAXH) {
            const f = Math.min(MAXW / inst.width, MAXH / inst.height);
            if ('rescale' in inst) inst.rescale(f);
          }
          previewBackground.appendChild(inst);
        }
      }
    } else {
      const itemFrame = createFrame(`Item-${varInfo.name}`, {
        direction: 'VERTICAL',
        gap: 12,
      });
      itemFrame.resize(cardWidth, cardHeight + 100);
      itemFrame.layoutGrow = 0;
      mainGrid.appendChild(itemFrame);

      const title = createText(varInfo.name, 18, 'Bold', COLORS.dark);
      itemFrame.appendChild(title);

      const desc = createText(varInfo.description, 14, 'Regular', COLORS.mediumGray);
      desc.layoutAlign = 'STRETCH';
      desc.textAutoResize = 'HEIGHT';
      itemFrame.appendChild(desc);

      const card = createFrame(`Card-${varInfo.name}`, {
        direction: 'VERTICAL',
        fill: '#FFFFFF',
        radius: 8,
        padding: 12,
        gap: 10,
        counterAlign: 'CENTER',
        primaryAlign: 'CENTER',
        fixedWidth: cardWidth,
        fixedHeight: cardHeight,
      });
      card.strokes = [figma.util.solidPaint('#EBEBEB')];
      card.strokeWeight = 1;
      itemFrame.appendChild(card);

      const previewBackground = createFrame('Preview-BG', {
        direction: 'VERTICAL',
        fill: '#F5F5F7',
        radius: 4,
        padding: 16,
        primaryAlign: 'CENTER',
        counterAlign: 'CENTER',
        layoutAlign: 'STRETCH',
      });
      previewBackground.layoutGrow = 1;
      card.appendChild(previewBackground);

      const variantNode = findVariantInstance(compSet, varInfo.name, componentData);
      if (variantNode) {
        const inst = variantNode.createInstance();
        const MAXW = cardWidth - 40;
        const MAXH = cardHeight - 80;
        if (inst.width > MAXW || inst.height > MAXH) {
          const f = Math.min(MAXW / inst.width, MAXH / inst.height);
          if ('rescale' in inst) inst.rescale(f);
        }
        previewBackground.appendChild(inst);
      }
    }
  }
}

// ============================================================
// SEÇÃO: ESTADOS
// ============================================================

async function renderStates(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation, originNode: SceneNode) {
  if (componentData.states.length === 0) return;

  const section = createSectionFrame('Estados');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section);

  const compSet = originNode as ComponentSetNode;

  for (const stateGroup of componentData.states) {
    // Card englobando o grupo (agora transparente com padding 0)
    const groupCard = createFrame(`Estados-${stateGroup.variantName}`, {
      direction: 'VERTICAL',
      fill: 'rgba(255, 255, 255, 0)',
      radius: 0,
      padding: 0,
      gap: 20,
    });
    section.appendChild(groupCard); // ANEXA PRIMEIRO
    groupCard.layoutAlign = 'STRETCH';

    // Título do grupo
    const groupTitle = createText(stateGroup.variantName, 15, 'Bold', COLORS.dark);
    groupCard.appendChild(groupTitle);

    // Linha horizontal com os estados
    const statesRow = createFrame(`Estados-Row-${stateGroup.variantName}`, {
      direction: 'HORIZONTAL',
      gap: 24,
      layoutAlign: 'STRETCH',
    });

    for (const stateName of stateGroup.states) {
      const stateCol = createFrame(`Estado-${stateName}`, {
        direction: 'VERTICAL',
        gap: 10,
        counterAlign: 'CENTER',
      });

      const stateLabel = createText(stateName, 12, 'Medium', COLORS.mediumGray);
      stateCol.appendChild(stateLabel);

      // Preview do estado
      if (compSet?.type === 'COMPONENT_SET') {
        const overrides = { [stateGroup.variantName]: stateName };
        const stateNode = findVariantWithOverrides(compSet, originNode, overrides);

        if (stateNode) {
          const inst = stateNode.createInstance();
          const MAX = 120;
          if (inst.width > MAX || inst.height > MAX) {
            const f = Math.min(MAX / inst.width, MAX / inst.height);
            if ('rescale' in inst) inst.rescale(f);
          }
          stateCol.appendChild(inst);
        } else {
          const fb = createText(stateName, 11, 'Regular', COLORS.mediumGray);
          stateCol.appendChild(fb);
        }
      }

      statesRow.appendChild(stateCol);
    }

    groupCard.appendChild(statesRow);

    // Descrição do grupo (da IA)
    const aiStateInfo = aiDocs.states.find(s =>
      s.variant.toLowerCase().includes(stateGroup.variantName.toLowerCase()) ||
      stateGroup.variantName.toLowerCase().includes(s.variant.toLowerCase())
    );
    if (aiStateInfo) {
      const desc = createText(aiStateInfo.description, 13, 'Regular', COLORS.mediumGray);
      desc.layoutAlign = 'STRETCH';
      desc.textAutoResize = 'HEIGHT';
      desc.lineHeight = { value: 150, unit: 'PERCENT' };
      groupCard.appendChild(desc);
    }

    section.appendChild(groupCard);
  }
}

// ============================================================
// SEÇÃO: HIERARQUIA
// ============================================================

async function renderHierarchy(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation) {
  const section = createSectionFrame('Hierarquia');
  section.layoutAlign = 'STRETCH';

  // Explicação geral
  const explanation = createText(aiDocs.hierarchy.explanation, 16, 'Regular', COLORS.darkGray);
  explanation.layoutAlign = 'STRETCH';
  explanation.textAutoResize = 'HEIGHT';
  explanation.lineHeight = { value: 160, unit: 'PERCENT' };
  section.appendChild(explanation);

  // Tamanho vs. Contexto (apenas se houver)
  if (aiDocs.hierarchy.sizeContext && aiDocs.hierarchy.sizeContext.length > 0) {
    const subCard = createFrame('Tamanho-Contexto', {
      direction: 'VERTICAL',
      fill: 'rgba(255, 255, 255, 0)',
      radius: 0,
      padding: 0,
      gap: 16,
    });
    section.appendChild(subCard); // ANEXA PRIMEIRO
    subCard.layoutAlign = 'STRETCH';

    const subTitle = createText('Tamanho vs. Contexto', 16, 'Bold', COLORS.dark);
    subCard.appendChild(subTitle);

    // Header da tabela
    const tableHeader = createFrame('Table-Header', {
      direction: 'HORIZONTAL',
      gap: 0,
      layoutAlign: 'STRETCH',
    });
    (tableHeader as FrameNode).primaryAxisSizingMode = 'FIXED';
    tableHeader.layoutAlign = 'STRETCH';

    const colSize = createText('Tamanho', 13, 'Bold', COLORS.dark, { layoutAlign: 'STRETCH' });
    colSize.layoutGrow = 1;
    const colCtx = createText('Contexto', 13, 'Bold', COLORS.dark, { layoutAlign: 'STRETCH' });
    colCtx.layoutGrow = 1;
    tableHeader.appendChild(colSize);
    tableHeader.appendChild(colCtx);
    subCard.appendChild(tableHeader);

    const headerDiv = figma.createLine();
    headerDiv.layoutAlign = 'STRETCH';
    headerDiv.strokes = [figma.util.solidPaint(COLORS.lightGray)];
    headerDiv.strokeWeight = 1;
    subCard.appendChild(headerDiv);

    // Linhas da tabela
    for (const row of aiDocs.hierarchy.sizeContext) {
      const tableRow = createFrame(`Row-${row.size}`, {
        direction: 'HORIZONTAL',
        gap: 0,
        layoutAlign: 'STRETCH',
      });
      (tableRow as FrameNode).primaryAxisSizingMode = 'FIXED';
      tableRow.layoutAlign = 'STRETCH';

      const sizeCell = createText(row.size, 14, 'Medium', COLORS.dark);
      sizeCell.layoutGrow = 1;
      sizeCell.layoutAlign = 'STRETCH';

      const ctxCell = createText(row.context, 14, 'Regular', COLORS.mediumGray);
      ctxCell.layoutGrow = 1;
      ctxCell.layoutAlign = 'STRETCH';
      ctxCell.textAutoResize = 'HEIGHT';

      tableRow.appendChild(sizeCell);
      tableRow.appendChild(ctxCell);
      subCard.appendChild(tableRow);

      const rowDiv = figma.createLine();
      rowDiv.layoutAlign = 'STRETCH';
      rowDiv.strokes = [figma.util.solidPaint('#F0F0F2')];
      rowDiv.strokeWeight = 1;
      subCard.appendChild(rowDiv);
    }

    section.appendChild(subCard);
  }

  parentFrame.appendChild(section);
}

// ============================================================
// SEÇÃO: REGRAS DE APLICAÇÃO
// ============================================================

function renderApplicationRules(parentFrame: FrameNode, aiDocs: AIDocumentation) {
  const section = createSectionFrame('Regras de aplicação');
  section.layoutAlign = 'STRETCH';

  const row = createFrame('Regras-Row', {
    direction: 'HORIZONTAL',
    gap: 20,
    layoutAlign: 'STRETCH',
  });
  (row as FrameNode).primaryAxisSizingMode = 'FIXED';
  row.layoutAlign = 'STRETCH';
  row.counterAxisAlignItems = 'MIN';

  // Card "Use assim"
  const doCard = createFrame('Regras-Do', {
    direction: 'VERTICAL',
    fill: '#F0FDF4',
    radius: 12,
    padding: 28,
    gap: 16,
    layoutGrow: 1,
  });
  row.appendChild(doCard); // ANEXA PRIMEIRO
  doCard.layoutAlign = 'STRETCH';
  doCard.strokes = [figma.util.solidPaint('#BBF7D0')];
  doCard.strokeWeight = 1;

  const doTitle = createText('✅  Use assim', 15, 'Bold', '#065F46');
  doCard.appendChild(doTitle);

  for (const rule of aiDocs.applicationRules.do) {
    const ruleText = createText(`• ${rule}`, 14, 'Regular', '#065F46');
    ruleText.layoutAlign = 'STRETCH';
    ruleText.textAutoResize = 'HEIGHT';
    ruleText.lineHeight = { value: 150, unit: 'PERCENT' };
    doCard.appendChild(ruleText);
  }

  // Card "Não use assim"
  const dontCard = createFrame('Regras-Dont', {
    direction: 'VERTICAL',
    fill: '#FFF1F2',
    radius: 12,
    padding: 28,
    gap: 16,
    layoutGrow: 1,
  });
  row.appendChild(dontCard); // ANEXA PRIMEIRO
  dontCard.layoutAlign = 'STRETCH';
  dontCard.strokes = [figma.util.solidPaint('#FECDD3')];
  dontCard.strokeWeight = 1;

  const dontTitle = createText('❌  Não use assim', 15, 'Bold', '#9F1239');
  dontCard.appendChild(dontTitle);

  for (const rule of aiDocs.applicationRules.dont) {
    const ruleText = createText(`• ${rule}`, 14, 'Regular', '#9F1239');
    ruleText.layoutAlign = 'STRETCH';
    ruleText.textAutoResize = 'HEIGHT';
    ruleText.lineHeight = { value: 150, unit: 'PERCENT' };
    dontCard.appendChild(ruleText);
  }

  row.appendChild(doCard);
  row.appendChild(dontCard);
  section.appendChild(row);
  parentFrame.appendChild(section);
}

// ============================================================
// SEÇÃO: SPECS
// ============================================================

async function renderSpecs(parentFrame: FrameNode, componentData: ComponentData, originNode: SceneNode) {
  const section = createSectionFrame('Specs');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section); // Anexa primeiro para permitir Measurements na página

  const intro = createText(
    'Especificações do componente, como medidas e espaçamentos.',
    15,
    'Regular',
    COLORS.darkGray
  );
  intro.layoutAlign = 'STRETCH';
  intro.textAutoResize = 'HEIGHT';
  section.appendChild(intro);

  const mainGrid = createFrame('Specs-Grid', {
    direction: 'HORIZONTAL',
    gap: 24,
    layoutAlign: 'STRETCH',
  });
  mainGrid.layoutWrap = 'WRAP';
  mainGrid.counterAxisSpacing = 24;
  mainGrid.primaryAxisSizingMode = 'FIXED';
  section.appendChild(mainGrid);

  const compSet = originNode as ComponentSetNode;
  const targetNode = componentData.nodeType === 'COMPONENT_SET'
    ? (originNode as ComponentSetNode).defaultVariant
    : originNode as ComponentNode | InstanceNode;

  const maxDim = Math.max(targetNode.width, targetNode.height);
  const isSmall = maxDim < 150;
  const isLarge = targetNode.width >= 500;

  let cardWidth = isLarge ? 904 : (isSmall ? 214 : 440);
  let cardHeight = isLarge ? 480 : (isSmall ? 180 : 340);
  mainGrid.itemSpacing = isLarge ? 24 : 16;

  const sizesToShow = componentData.sizingVariants && componentData.sizingVariants.length > 0
    ? componentData.sizingVariants
    : ['Default'];

  for (const sizeName of sizesToShow) {
    const itemFrame = createFrame(`Item-${sizeName}`, {
      direction: 'VERTICAL',
      gap: 12,
    });
    itemFrame.resize(cardWidth, cardHeight + 100);
    itemFrame.layoutGrow = 0;
    mainGrid.appendChild(itemFrame);

    const titleStr = sizesToShow.length === 1 && sizeName === 'Default' ? 'Default' : sizeName;
    const title = createText(titleStr, 18, 'Bold', COLORS.dark);
    itemFrame.appendChild(title);

    const desc = createText(`Medidas e espaçamentos do botão "${titleStr}".`, 14, 'Regular', COLORS.mediumGray);
    desc.layoutAlign = 'STRETCH';
    desc.textAutoResize = 'HEIGHT';
    itemFrame.appendChild(desc);

    const card = createFrame(`Card-${sizeName}`, {
      direction: 'VERTICAL',
      fill: '#FFFFFF',
      radius: 8,
      padding: 12,
      gap: 10,
      counterAlign: 'CENTER',
      primaryAlign: 'CENTER',
      fixedWidth: cardWidth,
      fixedHeight: cardHeight,
    });
    card.strokes = [figma.util.solidPaint('#EBEBEB')];
    card.strokeWeight = 1;
    itemFrame.appendChild(card);

    const previewBackground = createFrame('Preview-BG', {
      direction: 'VERTICAL',
      fill: '#F5F5F7',
      radius: 4,
      padding: 32,
      primaryAlign: 'CENTER',
      counterAlign: 'CENTER',
      layoutAlign: 'STRETCH',
    });
    previewBackground.layoutGrow = 1;
    card.appendChild(previewBackground);

    let variantNode: ComponentNode | null = null;
    if (componentData.nodeType === 'COMPONENT_SET') {
      let sizePropName = '';
      for (const prop of componentData.variantProperties) {
        if (prop.values.map(v => v.toLowerCase()).includes(sizeName.toLowerCase())) {
           sizePropName = prop.name; break;
        }
      }
      if (sizePropName) {
         variantNode = findVariantInstanceByProp(compSet, sizePropName, sizeName);
      }
      if (!variantNode) {
         variantNode = findVariantInstance(compSet, sizeName, componentData);
      }
      if (!variantNode && compSet.children.length > 0) {
         variantNode = compSet.defaultVariant as ComponentNode;
      }
    } else {
      variantNode = originNode as ComponentNode;
    }

    if (variantNode) {
      const inst = variantNode.createInstance();
      const MAXW = cardWidth - 80;
      const MAXH = cardHeight - 120;
      if (inst.width > MAXW || inst.height > MAXH) {
         const f = Math.min(MAXW / inst.width, MAXH / inst.height);
         if ('rescale' in inst) inst.rescale(f);
      }
      
      // Anexa o inst à árvore do documento (necessário para a Measurement API)
      previewBackground.appendChild(inst);
      
      try {
        if ('addMeasurement' in figma.currentPage) {
           // Altura: Colado à ESQUERDA (offset OUTER negativo pode representar eixo X invertido, ou vice-versa)
           (figma.currentPage as any).addMeasurement(
             { node: inst, side: 'TOP' }, 
             { node: inst, side: 'BOTTOM' },
             { offset: { type: 'OUTER', fixed: -30 } }
           );
           
           // Largura: Colado ABAIXO (offset OUTER positivo normalmente é eixo Y para baixo)
           (figma.currentPage as any).addMeasurement(
             { node: inst, side: 'LEFT' }, 
             { node: inst, side: 'RIGHT' },
             { offset: { type: 'OUTER', fixed: 30 } }
           );
           
           if (inst.layoutMode !== 'NONE' && 'children' in inst && inst.children.length > 0) {
              const firstChild = inst.children[0] as SceneNode;
              const lastChild = inst.children[inst.children.length - 1] as SceneNode;
              if (inst.paddingTop > 0) (figma.currentPage as any).addMeasurement({ node: inst, side: 'TOP' }, { node: firstChild, side: 'TOP' });
              if (inst.paddingBottom > 0) (figma.currentPage as any).addMeasurement({ node: inst, side: 'BOTTOM' }, { node: lastChild, side: 'BOTTOM' });
              if (inst.paddingLeft > 0) (figma.currentPage as any).addMeasurement({ node: inst, side: 'LEFT' }, { node: firstChild, side: 'LEFT' });
              if (inst.paddingRight > 0) (figma.currentPage as any).addMeasurement({ node: inst, side: 'RIGHT' }, { node: lastChild, side: 'RIGHT' });
              
              if (inst.itemSpacing > 0 && inst.children.length > 1) {
                 const c1 = inst.children[0] as SceneNode;
                 const c2 = inst.children[1] as SceneNode;
                 if (inst.layoutMode === 'HORIZONTAL') {
                    (figma.currentPage as any).addMeasurement({ node: c1, side: 'RIGHT' }, { node: c2, side: 'LEFT' });
                 } else {
                    (figma.currentPage as any).addMeasurement({ node: c1, side: 'BOTTOM' }, { node: c2, side: 'TOP' });
                 }
              }
           }
        }
      } catch (e) {
        console.warn('Measurement API falhou:', e);
      }
    }
  }
}

// ============================================================
// SEÇÃO: TOKENS
// ============================================================

async function renderTokens(parentFrame: FrameNode, componentData: ComponentData) {
  const { tokens } = componentData;
  const hasTokens = tokens && (tokens.typography.length > 0 || tokens.size.length > 0 || tokens.color.length > 0);

  if (!hasTokens) return;

  const section = createSectionFrame('Tokens');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section);

  const intro = createText(
    'Variáveis e tokens de design aplicados na construção deste componente e suas variantes.',
    15,
    'Regular',
    COLORS.darkGray
  );
  intro.layoutAlign = 'STRETCH';
  intro.textAutoResize = 'HEIGHT';
  section.appendChild(intro);

  const createTokenList = (title: string, list: { name: string, value: string, isAlias?: boolean, hexValue?: string, resolvedValue?: string }[]) => {
    // ... logic remains same inside ...
    if (!list || list.length === 0) return null;

    // Container externo para as sub-sessões
    const container = createFrame(`Tokens-${title}-Group`, {
      direction: 'VERTICAL',
      layoutAlign: 'STRETCH'
    });

    // O Card Branco (agora transparente pois a section já é branca)
    const card = createFrame(`Tokens-${title}-Card`, {
      direction: 'VERTICAL',
      fill: 'rgba(255, 255, 255, 0)',
      radius: 0,
      padding: 0,
      gap: 20, // Espaço entre o título e a lista de chips
      layoutAlign: 'STRETCH'
    });

    // Título da categoria (dentro do card agora)
    const categoryTitle = createText(title, 16, 'Bold', COLORS.dark);
    card.appendChild(categoryTitle);

    const listFrame = createFrame('List', {
      direction: 'HORIZONTAL',
      gap: 8,
      layoutAlign: 'STRETCH'
    });
    listFrame.primaryAxisSizingMode = 'FIXED';
    listFrame.layoutWrap = 'WRAP';
    listFrame.counterAxisSpacing = 8; // Espaçamento entre linhas no wrap

    for (const token of list) {
      // Token Chip Wrapper
      const chip = createFrame('Token-Chip', {
        direction: 'HORIZONTAL',
        fill: '#F5F5F7',
        radius: 6,
        padding: [6, 12, 6, 12],
        gap: 10,
        counterAlign: 'CENTER'
      });
      chip.strokes = [figma.util.solidPaint('#EBEBEB')];
      chip.strokeWeight = 1;

      // Color Preview para category Color
      if (token.hexValue) {
        const colorSwatch = figma.createEllipse();
        colorSwatch.resize(14, 14);
        colorSwatch.fills = [figma.util.solidPaint(token.hexValue.split(' ')[0])];
        colorSwatch.strokes = [figma.util.solidPaint('rgba(0,0,0,0.1)')];
        colorSwatch.strokeWeight = 1;
        chip.appendChild(colorSwatch);
      }

      // Content: Name + Value
      const chipText = figma.createText();
      const separator = token.isAlias ? '/' : ' — ';

      let displayValueStr = token.value;
      let extraSeparator = '';
      let extraValue = '';
      if (title === 'Tamanhos' && token.isAlias && token.resolvedValue) {
        extraSeparator = ' — ';
        extraValue = token.resolvedValue;
      }

      chipText.fontName = { family: 'Figtree', style: 'Medium' };
      chipText.characters = `${token.name}${separator}${displayValueStr}${extraSeparator}${extraValue}`;
      chipText.fontSize = 13;

      const namePart = token.name;
      chipText.setRangeFills(0, namePart.length, [figma.util.solidPaint(COLORS.token)]);
      chipText.setRangeFills(namePart.length, namePart.length + separator.length, [figma.util.solidPaint(COLORS.mediumGray)]);

      const valEnd = namePart.length + separator.length + displayValueStr.length;
      chipText.setRangeFills(namePart.length + separator.length, valEnd, [figma.util.solidPaint(token.isAlias ? COLORS.token : COLORS.value)]);

      if (extraValue) {
        chipText.setRangeFills(valEnd, valEnd + extraSeparator.length, [figma.util.solidPaint(COLORS.mediumGray)]);
        chipText.setRangeFills(valEnd + extraSeparator.length, chipText.characters.length, [figma.util.solidPaint(COLORS.value)]);
      }

      chip.appendChild(chipText);
      listFrame.appendChild(chip);
    }

    card.appendChild(listFrame);
    container.appendChild(card);
    return container;
  };

  const grids = createFrame('Tokens-Stack', {
    direction: 'VERTICAL',
    gap: 16,
  });
  section.appendChild(grids); // ANEXA PRIMEIRO
  grids.layoutAlign = 'STRETCH';
  grids.primaryAxisSizingMode = 'AUTO';

  const sizeCard = createTokenList('Tamanhos', tokens.size);
  const colorCard = createTokenList('Cores', tokens.color);
  const typeCard = createTokenList('Tipografia', tokens.typography);

  // Anexa na ordem desejada
  if (sizeCard) grids.appendChild(sizeCard);
  if (colorCard) grids.appendChild(colorCard);
  if (typeCard) grids.appendChild(typeCard);

  section.appendChild(grids);
}

// ============================================================
// FUNÇÃO PRINCIPAL
// ============================================================

async function generateDocumentation(apiKey: string, userDescription: string, storybookLink?: string) {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({ type: 'error', message: 'Selecione um componente no Figma antes de gerar a documentação.' });
    return;
  }

  const node = selection[0];
  if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET' && node.type !== 'INSTANCE') {
    figma.ui.postMessage({ type: 'error', message: 'O item selecionado não é um Componente ou Conjunto de Componentes.' });
    return;
  }

  try {
    figma.ui.postMessage({ type: 'loading-step', step: 'Carregando fontes...' });
    await loadFonts();

    figma.ui.postMessage({ type: 'loading-step', step: 'Analisando componente...' });
    const componentData = await extractComponentData(node as ComponentNode | ComponentSetNode | InstanceNode);

    figma.ui.postMessage({ type: 'loading-step', step: 'Gerando textos com Gemini...' });
    const aiDocs = await callGemini(apiKey, componentData, userDescription);

    figma.ui.postMessage({ type: 'loading-step', step: 'Criando documentação no Figma...' });

    // Criar frame principal
    const docFrame = createDocFrame(componentData.name);

    // Posicionar ao lado do componente selecionado e anexar precocemente 
    // Isso garante que os nós clondos já estão no Documento, vital para a Measurement API
    docFrame.x = node.x + node.width + 120;
    docFrame.y = node.y;
    figma.currentPage.appendChild(docFrame);

    // Renderizar todas as seções, protegendo cada uma em try/catch para não quebrar a documentação inteira se uma parte falhar
    await renderHeader(docFrame, componentData, aiDocs, storybookLink);

    const sectionsFrame = createFrame('Seções', {
      direction: 'VERTICAL',
      gap: 32,
      padding: 60,
      layoutAlign: 'STRETCH',
    });
    docFrame.appendChild(sectionsFrame); // Anecxar cedo!

    try { renderWhenToUse(sectionsFrame, aiDocs); } catch (e) { console.error('Erro ao renderizar Quando Usar', e); }
    try { await renderAnatomy(sectionsFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Anatomia', e); }
    try { await renderVariants(sectionsFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Variantes', e); }
    try { await renderStates(sectionsFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Estados', e); }
    try { await renderSpecs(sectionsFrame, componentData, node); } catch (e) { console.error('Erro ao renderizar Specs', e); }
    try { await renderTokens(sectionsFrame, componentData); } catch (e) { console.error('Erro ao renderizar Tokens', e); }
    try { await renderHierarchy(sectionsFrame, componentData, aiDocs); } catch (e) { console.error('Erro ao renderizar Hierarquia', e); }
    try { renderApplicationRules(sectionsFrame, aiDocs); } catch (e) { console.error('Erro ao renderizar Regras', e); }

    // Aplicar FILL horizontal em todas as seções do frame principal
    for (const child of docFrame.children) {
      if ('layoutAlign' in child) (child as any).layoutAlign = 'STRETCH';
      if ('layoutSizingHorizontal' in child) (child as any).layoutSizingHorizontal = 'FILL';
    }

    figma.currentPage.selection = [docFrame];
    figma.viewport.scrollAndZoomIntoView([docFrame]);

    figma.ui.postMessage({ type: 'done' });
    figma.notify('✅ Documentação gerada com sucesso!');
    figma.closePlugin();

  } catch (error: any) {
    figma.ui.postMessage({ type: 'error', message: error?.message || 'Ocorreu um erro inesperado.' });
  }
}

// ============================================================
// INICIALIZAÇÃO DO PLUGIN
// ============================================================

figma.showUI(__html__, { width: 320, height: 560 });

// Carregar API Key salva e enviar para UI
figma.clientStorage.getAsync('gemini-api-key').then(key => {
  if (key) {
    figma.ui.postMessage({ type: 'init-api-key', key });
  }
});

// Verificar seleção atual ao abrir
const currentSelection = figma.currentPage.selection;
if (currentSelection.length > 0) {
  const n = currentSelection[0];
  if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET' || n.type === 'INSTANCE') {
    figma.ui.postMessage({
      type: 'selection-info',
      name: n.name,
      nodeType: n.type,
    });
  }
}

// Escutar mudanças de seleção
figma.on('selectionchange', () => {
  const sel = figma.currentPage.selection;
  if (sel.length > 0) {
    const n = sel[0];
    if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET' || n.type === 'INSTANCE') {
      figma.ui.postMessage({
        type: 'selection-info',
        name: n.name,
        nodeType: n.type,
      });
      return;
    }
  }
  figma.ui.postMessage({ type: 'selection-info', name: null, nodeType: null });
});

// Receber mensagens da UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate') {
    await generateDocumentation(msg.apiKey, msg.description, msg.storybookLink);
  } else if (msg.type === 'save-api-key') {
    // Salvar API Key de forma segura no clientStorage do Figma
    await figma.clientStorage.setAsync('gemini-api-key', msg.key);
    figma.notify('✅ Chave da API salva localmente.');
  }
};
