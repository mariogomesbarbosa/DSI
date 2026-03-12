// ============================================================
// AutoDocs Plugin v2.0 — code.ts
// Gera documentação estruturada de componentes Figma via ChatGPT
// ============================================================

// --- Tipos auxiliares ---

interface ComponentData {
  name: string;
  nodeType: string;
  description: string;
  variants: VariantInfo[];
  states: StateInfo[];
  anatomy: AnatomyPart[];
  sizingVariants: string[];
  tokens: ComponentTokens;
}

interface ComponentTokens {
  typography: { name: string; value: string }[];
  size: { name: string; value: string }[];
  color: { name: string; value: string }[];
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
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
}

function createText(
  characters: string,
  size: number,
  style: 'Regular' | 'Medium' | 'Bold',
  color: string = COLORS.dark,
  options?: { align?: TextNode['textAlignHorizontal']; layoutAlign?: 'INHERIT' | 'STRETCH' }
): TextNode {
  const t = figma.createText();
  t.characters = characters;
  t.fontSize = size;
  t.fontName = { family: 'Inter', style };
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
    layoutAlign: 'STRETCH',
  });

  const title = createText(titleText, 22, 'Bold', COLORS.dark);
  section.appendChild(title);

  const divider = figma.createLine();
  divider.layoutAlign = 'STRETCH';
  divider.strokes = [figma.util.solidPaint(COLORS.lightGray)];
  divider.strokeWeight = 1;
  section.appendChild(divider);

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
    padding: [60, 60, 80, 60],
    gap: 64,
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
    variants: [],
    states: [],
    anatomy: [],
    sizingVariants: [],
    tokens: { typography: [], size: [], color: [] },
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

  async function resolveTokens(ids: Set<string>): Promise<{ name: string, value: string }[]> {
    const result: { name: string, value: string }[] = [];
    for (const id of Array.from(ids)) {
      try {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v) {
          const name = v.name;
          let valStr = '';
          const rawValues = Object.values(v.valuesByMode);
          let rawVal = rawValues.length > 0 ? rawValues[0] : null;

          // Resolução recursiva de aliases
          while (rawVal && typeof rawVal === 'object' && 'type' in rawVal && (rawVal as any).type === 'VARIABLE_ALIAS') {
            const aliasVar = await figma.variables.getVariableByIdAsync((rawVal as VariableAlias).id);
            if (aliasVar) {
              rawVal = Object.values(aliasVar.valuesByMode)[0];
            } else {
              break;
            }
          }

          if (v.resolvedType === 'COLOR' && rawVal && typeof rawVal === 'object' && 'r' in rawVal) {
            const color = rawVal as RGBA;
            valStr = rgbToHex(color);
            if (color.a !== undefined && color.a < 1) {
              valStr += ` (${Math.round(color.a * 100)}%)`;
            }
          } else if (v.resolvedType === 'FLOAT') {
            valStr = `${rawVal}px`;
          } else if (v.resolvedType === 'STRING') {
            valStr = rawVal as string;
          } else {
            valStr = String(rawVal);
          }

          result.push({ name, value: valStr });
        }
      } catch (e) {
        // ignora token se der falha
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async function resolveTextStyles(ids: Set<string>): Promise<{ name: string, value: string }[]> {
    const result: { name: string, value: string }[] = [];
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

  const variantsText = variantList.length > 0
    ? variantList.map(v => `- ${v.name}`).join('\n')
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


// ============================================================
// SEÇÃO: CABEÇALHO
// ============================================================

function renderHeader(parentFrame: FrameNode, componentData: ComponentData) {
  const header = createFrame('Cabeçalho', {
    direction: 'VERTICAL',
    gap: 8,
    layoutAlign: 'STRETCH',
  });

  const title = createText(componentData.name, 40, 'Bold', COLORS.dark);
  title.layoutAlign = 'STRETCH';
  header.appendChild(title);

  if (componentData.description) {
    const desc = createText(componentData.description, 16, 'Regular', COLORS.mediumGray);
    desc.layoutAlign = 'STRETCH';
    desc.textAutoResize = 'HEIGHT';
    header.appendChild(desc);
  }

  parentFrame.appendChild(header);
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
  section.appendChild(row); // Anexa antes de configurar layout complexo
  row.layoutAlign = 'STRETCH';
  (row as FrameNode).primaryAxisSizingMode = 'FIXED';

  // Preview com pinos
  const previewCard = createFrame('Anatomia-Preview', {
    direction: 'NONE',
    fill: COLORS.white,
    radius: 12,
    layoutGrow: 1,
    layoutAlign: 'STRETCH',
  });
  previewCard.counterAxisSizingMode = 'FIXED';
  previewCard.resize(480, 340);

  // Clonar e centralizar
  let clone: InstanceNode | SceneNode;
  if (targetNode.type === 'COMPONENT') {
    clone = (targetNode as ComponentNode).createInstance();
  } else {
    clone = (targetNode as InstanceNode).clone();
  }

  const MAX = 240;
  const origW = clone.width;
  const origH = clone.height;
  let scale = 1;
  if (origW > MAX || origH > MAX) {
    scale = Math.min(MAX / origW, MAX / origH);
    if ('rescale' in clone) (clone as any).rescale(scale);
  }

  clone.x = Math.round((480 - clone.width) / 2);
  clone.y = Math.round((340 - clone.height) / 2);
  previewCard.appendChild(clone);

  // Desenhar pinos sobre partes da anatomia
  const PIN_SIZE = 22;

  for (const part of componentData.anatomy) {
    // Tentar achar o nó filho correspondente
    let childNode: SceneNode | null = null;
    if ('children' in targetNode) {
      childNode = ((targetNode as any).children as SceneNode[]).find(c => c.name === part.layerName) || null;
    }

    let pinX: number, pinY: number;
    if (childNode) {
      // Posição relativa ao clone
      const cx = clone.x + childNode.x * scale;
      const cy = clone.y + childNode.y * scale;
      const cw = childNode.width * scale;
      const ch = childNode.height * scale;
      pinX = Math.round(cx + cw / 2 - PIN_SIZE / 2);
      pinY = Math.round(cy - PIN_SIZE - 8);
      if (pinY < 4) pinY = Math.round(cy + ch + 8);
    } else {
      // Fallback: posição escalonada
      pinX = 12 + (part.index - 1) * 36;
      pinY = 12;
    }

    const pin = createBadge(part.index);
    pin.x = Math.max(4, Math.min(pinX, 480 - PIN_SIZE - 4));
    pin.y = Math.max(4, Math.min(pinY, 340 - PIN_SIZE - 4));
    previewCard.appendChild(pin);
  }

  row.appendChild(previewCard);

  // Lista de partes
  const listCard = createFrame('Anatomia-Lista', {
    direction: 'VERTICAL',
    fill: COLORS.white,
    radius: 12,
    padding: 28,
    gap: 20,
    layoutGrow: 1,
    layoutAlign: 'STRETCH',
  });

  const listTitle = createText('Partes do componente', 14, 'Bold', COLORS.mediumGray);
  listCard.appendChild(listTitle);

  for (const aiPart of aiDocs.anatomy) {
    const partRow = createFrame(`Parte-${aiPart.index}`, {
      direction: 'HORIZONTAL',
      gap: 12,
      layoutAlign: 'STRETCH',
    });
    (partRow as any).counterAxisAlignItems = 'MIN';

    const badge = createBadge(aiPart.index);
    partRow.appendChild(badge);

    const textCol = createFrame(`Parte-${aiPart.index}-Text`, {
      direction: 'VERTICAL',
      gap: 2,
      layoutGrow: 1,
      layoutAlign: 'STRETCH',
    });

    const partName = createText(aiPart.part, 14, 'Bold', COLORS.dark);
    partName.layoutAlign = 'STRETCH';
    textCol.appendChild(partName);

    const partDesc = createText(aiPart.description, 13, 'Regular', COLORS.mediumGray);
    partDesc.layoutAlign = 'STRETCH';
    partDesc.textAutoResize = 'HEIGHT';
    partDesc.lineHeight = { value: 150, unit: 'PERCENT' };
    textCol.appendChild(partDesc);

    partRow.appendChild(textCol);
    listCard.appendChild(partRow);

    // Ajuste "Fill" após os nós terem um pai auto-layout
    (partRow as any).layoutSizingHorizontal = 'FILL';
    (partRow as any).layoutAlign = 'STRETCH';

    (textCol as any).layoutSizingHorizontal = 'FILL';
    (textCol as any).layoutGrow = 1;
  }

  row.appendChild(listCard);
  section.appendChild(row);
}

// ============================================================
// SEÇÃO: VARIANTES
// ============================================================

async function renderVariants(parentFrame: FrameNode, componentData: ComponentData, aiDocs: AIDocumentation, originNode: SceneNode) {
  if (aiDocs.variants.length === 0) return;

  const section = createSectionFrame('Variantes');
  section.layoutAlign = 'STRETCH';
  parentFrame.appendChild(section);

  // Descrição geral
  const intro = createText(
    'Cada variante tem uma função específica e deve ser usada de forma consistente em todos os produtos.',
    15,
    'Regular',
    COLORS.darkGray
  );
  intro.layoutAlign = 'STRETCH';
  intro.textAutoResize = 'HEIGHT';
  section.appendChild(intro);

  // Stack vertical de variantes (antes era um grid horizontal)
  const stack = createFrame('Variantes-Stack', {
    direction: 'VERTICAL',
    gap: 16,
    layoutAlign: 'STRETCH',
  });
  stack.primaryAxisSizingMode = 'AUTO';

  const compSet = originNode as ComponentSetNode;

  for (const varInfo of aiDocs.variants) {
    // Row da variante: Preview (L) + Texto (R)
    const variantRow = createFrame(`Variante-${varInfo.name}`, {
      direction: 'HORIZONTAL',
      gap: 16,
      counterAlign: 'MIN',
    });
    stack.appendChild(variantRow); // ANEXA PRIMEIRO
    variantRow.layoutAlign = 'STRETCH';
    variantRow.primaryAxisSizingMode = 'AUTO';
    (variantRow as any).layoutSizingHorizontal = 'FILL';

    // 1. Preview Area (Lado Esquerdo)
    const previewArea = createFrame(`Preview-${varInfo.name}`, {
      direction: 'VERTICAL',
      fill: '#E9E9E9',
      radius: 8,
      padding: 32,
      primaryAlign: 'CENTER',
      counterAlign: 'CENTER',
      layoutAlign: 'STRETCH', // Garante que estique para preencher a altura se necessário
    });
    previewArea.resize(440, 320); // Tamanho fixo para o preview side
    previewArea.counterAxisSizingMode = 'FIXED';
    previewArea.primaryAxisSizingMode = 'FIXED';

    // Encontrar e clonar componente
    if (componentData.nodeType === 'COMPONENT_SET' && compSet?.type === 'COMPONENT_SET') {
      const variantNode = compSet.children.find(c =>
        c.type === 'COMPONENT' && c.name.toLowerCase().includes(varInfo.name.toLowerCase())
      ) as ComponentNode | undefined;

      if (variantNode) {
        const inst = variantNode.createInstance();
        const MAXW = 380;
        const MAXH = 260;
        if (inst.width > MAXW || inst.height > MAXH) {
          const f = Math.min(MAXW / inst.width, MAXH / inst.height);
          if ('rescale' in inst) inst.rescale(f);
        }
        previewArea.appendChild(inst);
      } else {
        const fallback = createText(varInfo.name, 14, 'Medium', COLORS.mediumGray);
        previewArea.appendChild(fallback);
      }
    }

    // 2. Text Area (Lado Direito)
    const textArea = createFrame(`Text-${varInfo.name}`, {
      direction: 'VERTICAL',
      fill: '#FFFFFF', // Nova cor solicitada (padrão branco)
      radius: 8,       // Novo radius solicitado
      padding: 40,
      gap: 16,
      layoutGrow: 1,   // Ocupa o restante do espaço
      primaryAlign: 'CENTER',
    });
    textArea.layoutAlign = 'STRETCH';

    const varName = createText(varInfo.name, 20, 'Bold', COLORS.dark);
    varName.layoutAlign = 'STRETCH';
    textArea.appendChild(varName);

    const varDesc = createText(varInfo.description, 15, 'Regular', COLORS.mediumGray);
    varDesc.layoutAlign = 'STRETCH';
    varDesc.textAutoResize = 'HEIGHT';
    varDesc.lineHeight = { value: 160, unit: 'PERCENT' };
    textArea.appendChild(varDesc);

    variantRow.appendChild(previewArea);
    variantRow.appendChild(textArea);
    stack.appendChild(variantRow);
  }

  section.appendChild(stack);
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
    // Card branco englobando o grupo
    const groupCard = createFrame(`Estados-${stateGroup.variantName}`, {
      direction: 'VERTICAL',
      fill: COLORS.white,
      radius: 12,
      padding: 28,
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
        const stateNode = compSet.children.find(c =>
          c.type === 'COMPONENT' && c.name.toLowerCase().includes(stateName.toLowerCase())
        ) as ComponentNode | undefined;

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
      fill: COLORS.white,
      radius: 12,
      padding: 28,
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

  const createTokenList = (title: string, list: { name: string, value: string }[]) => {
    // ... logic remains same inside ...
    if (!list || list.length === 0) return null;

    // Container externo para as sub-sessões
    const container = createFrame(`Tokens-${title}-Group`, {
      direction: 'VERTICAL',
      layoutAlign: 'STRETCH'
    });

    // O Card Branco
    const card = createFrame(`Tokens-${title}-Card`, {
      direction: 'VERTICAL',
      fill: COLORS.white,
      radius: 12,
      padding: 24,
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
      if (token.value.startsWith('#')) {
        const colorSwatch = figma.createEllipse();
        colorSwatch.resize(14, 14);
        colorSwatch.fills = [figma.util.solidPaint(token.value.split(' ')[0])];
        colorSwatch.strokes = [figma.util.solidPaint('rgba(0,0,0,0.1)')];
        colorSwatch.strokeWeight = 1;
        chip.appendChild(colorSwatch);
      }

      // Content: Name + Value
      const chipText = figma.createText();
      chipText.characters = `${token.name} — ${token.value}`;
      chipText.fontSize = 13;
      chipText.fontName = { family: 'Inter', style: 'Medium' };

      const namePart = token.name;
      const separator = ' — ';
      chipText.setRangeFills(0, namePart.length, [figma.util.solidPaint(COLORS.token)]);
      chipText.setRangeFills(namePart.length, namePart.length + separator.length, [figma.util.solidPaint(COLORS.mediumGray)]);
      chipText.setRangeFills(namePart.length + separator.length, chipText.characters.length, [figma.util.solidPaint(COLORS.value)]);

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

async function generateDocumentation(apiKey: string, userDescription: string) {
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

    // Renderizar todas as seções, protegendo cada uma em try/catch para não quebrar a documentação inteira se uma parte falhar
    renderHeader(docFrame, componentData);

    try { renderWhenToUse(docFrame, aiDocs); } catch (e) { console.error('Erro ao renderizar Quando Usar', e); }
    try { await renderAnatomy(docFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Anatomia', e); }
    try { await renderVariants(docFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Variantes', e); }
    try { await renderStates(docFrame, componentData, aiDocs, node); } catch (e) { console.error('Erro ao renderizar Estados', e); }
    try { await renderTokens(docFrame, componentData); } catch (e) { console.error('Erro ao renderizar Tokens', e); }
    try { await renderHierarchy(docFrame, componentData, aiDocs); } catch (e) { console.error('Erro ao renderizar Hierarquia', e); }
    try { renderApplicationRules(docFrame, aiDocs); } catch (e) { console.error('Erro ao renderizar Regras', e); }

    // Aplicar FILL horizontal em todas as seções do frame principal
    for (const child of docFrame.children) {
      if ('layoutAlign' in child) (child as any).layoutAlign = 'STRETCH';
    }

    // Posicionar ao lado do componente selecionado
    docFrame.x = node.x + node.width + 120;
    docFrame.y = node.y;

    figma.currentPage.appendChild(docFrame);
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
    await generateDocumentation(msg.apiKey, msg.description);
  }
};
