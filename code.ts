async function generateDocumentation() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Por favor, selecione um Componente, Conjunto de Componentes ou Instância.");
    figma.closePlugin();
    return;
  }

  const node = selection[0];

  if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET' && node.type !== 'INSTANCE') {
    figma.notify("O item selecionado não é um Componente ou Instância.");
    figma.closePlugin();
    return;
  }

  // Carregar fontes necessárias
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });

  // Criar Frame Principal (Container da Documentação)
  const docFrame = figma.createFrame();
  docFrame.name = `Docs - ${node.name}`;
  docFrame.layoutMode = "VERTICAL";
  docFrame.primaryAxisSizingMode = "AUTO";
  docFrame.counterAxisSizingMode = "FIXED";
  docFrame.resize(1000, 100); // 1000px de largura fixa, altura auto
  docFrame.fills = [figma.util.solidPaint("#F5F5F5")]; // Fundo cinza claro
  docFrame.paddingTop = 60;
  docFrame.paddingBottom = 60;
  docFrame.paddingLeft = 60;
  docFrame.paddingRight = 60;
  docFrame.itemSpacing = 40;

  // Adicionar Título Principal
  const title = figma.createText();
  title.characters = node.name;
  title.fontSize = 32;
  title.fontName = { family: "Inter", style: "Bold" };
  title.fills = [figma.util.solidPaint("#1A1A1A")];
  docFrame.appendChild(title);

  // Adicionar Seção "Sobre"
  const sectionSobre = createSectionFrame("Sobre");
  const descriptionText = (node as any).description
    ? (node as any).description
    : "Descrição não fornecida no componente Figma. Use o painel direito do Figma para adicionar uma descrição ao componente principal.";

  const textSobre = figma.createText();
  textSobre.characters = descriptionText;
  textSobre.fontSize = 16;
  textSobre.fontName = { family: "Inter", style: "Regular" };
  textSobre.fills = [figma.util.solidPaint("#333333")];
  textSobre.layoutAlign = "STRETCH"; // Ocupar largura pai

  sectionSobre.appendChild(textSobre);
  docFrame.appendChild(sectionSobre);

  // Adicionar Seção "Estrutura"
  const sectionEstrutura = createSectionFrame("Estrutura");

  // Container horizontal para Propriedades e Preview
  const estruturaContent = figma.createFrame();
  estruturaContent.name = "Conteúdo";
  estruturaContent.fills = [];
  estruturaContent.layoutMode = "HORIZONTAL";
  estruturaContent.layoutAlign = "STRETCH";
  (estruturaContent as FrameNode).primaryAxisSizingMode = "FIXED";
  (estruturaContent as FrameNode).counterAxisSizingMode = "AUTO";
  estruturaContent.itemSpacing = 20;

  // Lado Esquerdo - Propriedades (Card Branco)
  const propsFrame = figma.createFrame();
  propsFrame.name = "Propriedades";
  propsFrame.fills = [figma.util.solidPaint("#FFFFFF")];
  propsFrame.cornerRadius = 8;
  propsFrame.layoutMode = "VERTICAL";
  propsFrame.layoutGrow = 1; // Divide espaço com o preview
  propsFrame.paddingTop = 40;
  propsFrame.paddingBottom = 40;
  propsFrame.paddingLeft = 40;
  propsFrame.paddingRight = 40;
  propsFrame.itemSpacing = 24;

  // 1. Lado Esquerdo - Extração Hierárquica (Estrutura, Icons, Labels)
  let badgeIndex = 1;
  const targetForSpecs = node.type === 'COMPONENT_SET' ? node.defaultVariant : node;

  await appendSpecGroup(propsFrame, badgeIndex, "Estrutura", targetForSpecs);
  const mainBadge = badgeIndex++;

  let leftBadge = -1;
  let rightBadge = -1;

  if ('children' in targetForSpecs) {
    for (const child of targetForSpecs.children) {
      if (child.type === 'TEXT') {
        leftBadge = leftBadge === -1 ? badgeIndex : leftBadge;
        await appendSpecGroup(propsFrame, badgeIndex++, "Label", child);
      } else if (child.type === 'INSTANCE' || child.type === 'VECTOR' || child.type === 'BOOLEAN_OPERATION') {
        rightBadge = rightBadge === -1 ? badgeIndex : rightBadge;
        await appendSpecGroup(propsFrame, badgeIndex++, "Icon", child);
      }
    }
  }

  // Lado Direito - Preview (Card Branco)
  const previewFrame = figma.createFrame();
  previewFrame.name = "Preview";
  previewFrame.fills = [figma.util.solidPaint("#FFFFFF")];
  previewFrame.cornerRadius = 8;
  previewFrame.layoutMode = "VERTICAL";
  previewFrame.layoutGrow = 1;
  previewFrame.primaryAxisAlignItems = "CENTER";
  previewFrame.counterAxisAlignItems = "CENTER";
  previewFrame.paddingTop = 60;
  previewFrame.paddingBottom = 60;
  previewFrame.paddingLeft = 60;
  previewFrame.paddingRight = 60;

  // Clonar Componente para o Preview
  let clone;
  if (node.type === 'COMPONENT_SET') {
    clone = node.defaultVariant.createInstance();
  } else if (node.type === 'COMPONENT') {
    clone = node.createInstance();
  } else {
    clone = node.clone();
  }

  // Criar Canvas absoluto para permitir sobreposição de Pinos Livres
  const canvasFrame = figma.createFrame();
  canvasFrame.name = "Canvas";
  canvasFrame.fills = [];

  const pad = 60;
  clone.x = pad;
  clone.y = pad;
  canvasFrame.appendChild(clone);
  canvasFrame.resize(clone.width + pad * 2, clone.height + pad * 2);

  // Lógica de Pintar Pinos (Specs) nas laterais do Componente Isolado
  const drawPin = (num: number, position: 'top' | 'left' | 'right') => {
    const pinFrame = figma.createFrame();
    pinFrame.resize(24, 24);
    pinFrame.cornerRadius = 12;
    pinFrame.fills = [figma.util.solidPaint("#1A1A1A")];
    pinFrame.layoutMode = "VERTICAL";
    pinFrame.primaryAxisAlignItems = "CENTER";
    pinFrame.counterAxisAlignItems = "CENTER";

    const pinText = figma.createText();
    pinText.characters = num.toString();
    pinText.fontSize = 12;
    pinText.fontName = { family: "Inter", style: "Bold" };
    pinText.fills = [figma.util.solidPaint("#FFFFFF")];
    pinFrame.appendChild(pinText);

    const line = figma.createLine();
    line.strokes = [figma.util.solidPaint("#1A1A1A")];
    line.strokeWeight = 1;

    if (position === 'top') {
      pinFrame.x = pad + clone.width / 2 - 12;
      pinFrame.y = pad - 40;
      line.x = pad + clone.width / 2;
      line.y = pad - 16;
      line.resize(16, 0);
      line.rotation = -90;
    } else if (position === 'left') {
      pinFrame.x = pad - 40;
      pinFrame.y = pad + clone.height / 2 - 12;
      line.x = pad - 16;
      line.y = pad + clone.height / 2;
      line.resize(16, 0);
    } else if (position === 'right') {
      pinFrame.x = pad + clone.width + 16;
      pinFrame.y = pad + clone.height / 2 - 12;
      line.x = pad + clone.width;
      line.y = pad + clone.height / 2;
      line.resize(16, 0);
    }

    canvasFrame.appendChild(line);
    canvasFrame.appendChild(pinFrame);
  };

  // Instanciar Pinos Baseados na árvore percorrida
  drawPin(mainBadge, 'top');
  if (leftBadge !== -1) drawPin(leftBadge, 'left');
  if (rightBadge !== -1) drawPin(rightBadge, 'right');

  previewFrame.appendChild(canvasFrame);

  // Adicionar lados ao container "Estrutura"
  estruturaContent.appendChild(propsFrame);
  estruturaContent.appendChild(previewFrame);

  sectionEstrutura.appendChild(estruturaContent);
  docFrame.appendChild(sectionEstrutura);

  // NOVIDADE: GERAR "ESTADOS" E "VARIANTES"
  if (node.type === 'COMPONENT_SET') {
    const compSet = node as ComponentSetNode;
    const propriedades = compSet.componentPropertyDefinitions;

    // Arrays para guardar as propriedades classificadas
    const propsEstado: string[] = [];
    const propsVariante: string[] = [];

    // Palavras-chave que inferem um estado (adicionar em PT e EN)
    const keywordsEstado = ['state', 'estado', 'hover', 'pressed', 'active', 'disabled', 'focus'];

    for (const key in propriedades) {
      if (propriedades[key].type === 'VARIANT') {
        const cleanKey = key.split('#')[0].toLowerCase();
        // Verificar se é Estado ou Variante
        const isEstado = keywordsEstado.some(keyword => cleanKey.includes(keyword));
        if (isEstado) {
          propsEstado.push(key);
        } else {
          propsVariante.push(key);
        }
      }
    }

    // Função auxiliar para renderizar uma seção de variantes (Seja Estado ou não)
    const renderVariantesSection = async (title: string, propKeys: string[]) => {
      const section = createSectionFrame(title);
      let adicionouConteudo = false;

      for (const propKey of propKeys) {
        const cleanKey = propKey.split('#')[0];
        const defaultValue = propriedades[propKey].defaultValue;
        // As opções válidas para esta propriedade
        const options = propriedades[propKey].variantOptions || [];

        for (const optionStr of options) {
          // Só desenhar variações que não sejam o padrão/default (Pois a default já está na 'Estrutura')
          if (optionStr !== defaultValue && optionStr.toLowerCase() !== 'default') {
            adicionouConteudo = true;

            // Subtítulo (Nome da opção. ex: "Hover" ou "Small")
            const titleRow = figma.createText();
            titleRow.characters = optionStr;
            titleRow.fontSize = 14;
            titleRow.fontName = { family: "Inter", style: "Bold" };
            titleRow.fills = [figma.util.solidPaint("#1A1A1A")];

            section.appendChild(titleRow);

            // Container Horizontal de conteúdo (idêntico ao de Estrutura)
            const rowContent = figma.createFrame();
            rowContent.name = `Conteudo-${optionStr}`;
            rowContent.fills = [];
            rowContent.layoutMode = "HORIZONTAL";
            rowContent.layoutAlign = "STRETCH";
            (rowContent as FrameNode).primaryAxisSizingMode = "FIXED";
            (rowContent as FrameNode).counterAxisSizingMode = "AUTO";
            rowContent.itemSpacing = 20;

            // Encontrar o componente filho (variante) dentro do Set que corresponda
            // a ter esta propriedade === optionStr
            const varianteTarget = compSet.children.find(child => {
              if (child.type === 'COMPONENT') {
                const childProps = (child as any).componentPropertyReferences || {};
                return child.name.includes(`${cleanKey}=${optionStr}`);
              }
              return false;
            });

            // Card Esquerdo (Props)
            const paramFrame = figma.createFrame();
            paramFrame.name = "Propriedades";
            paramFrame.fills = [figma.util.solidPaint("#FFFFFF")];
            paramFrame.cornerRadius = 8;
            paramFrame.layoutMode = "VERTICAL";
            paramFrame.layoutGrow = 1;
            paramFrame.paddingTop = 24;
            paramFrame.paddingBottom = 24;
            paramFrame.paddingLeft = 24;
            paramFrame.paddingRight = 24;

            const paramText = figma.createText();
            // Se encontrou a variante específica, extraimos dados dela
            paramText.characters = varianteTarget
              ? await extrairPropriedadesBasicas(varianteTarget)
              : `${cleanKey}: ${optionStr}`;
            paramText.fontSize = 12;
            paramText.fontName = { family: "Inter", style: "Regular" };
            paramText.fills = [figma.util.solidPaint("#333333")];
            // Configurando para preencher horizontalmente
            paramText.layoutAlign = "STRETCH";
            paramText.textAutoResize = "HEIGHT";
            renderHighlightText(paramText, paramText.characters);
            paramFrame.appendChild(paramText);

            // Card Direito (Preview)
            const prevFrame = figma.createFrame();
            prevFrame.name = "Preview";
            prevFrame.fills = [figma.util.solidPaint("#FFFFFF")];
            prevFrame.cornerRadius = 8;
            prevFrame.layoutMode = "VERTICAL";
            prevFrame.layoutGrow = 1;
            prevFrame.primaryAxisAlignItems = "CENTER";
            prevFrame.counterAxisAlignItems = "CENTER";
            prevFrame.paddingTop = 40;
            prevFrame.paddingBottom = 40;
            prevFrame.paddingLeft = 40;
            prevFrame.paddingRight = 40;

            if (varianteTarget && varianteTarget.type === 'COMPONENT') {
              prevFrame.appendChild(varianteTarget.createInstance());
            } else {
              const fallbackText = figma.createText();
              fallbackText.characters = "Pré-visualização não encontrada.";
              fallbackText.fontSize = 12;
              prevFrame.appendChild(fallbackText);
            }

            rowContent.appendChild(paramFrame);
            rowContent.appendChild(prevFrame);

            section.appendChild(rowContent);

            if ('layoutSizingHorizontal' in rowContent) {
              (rowContent as any).layoutSizingHorizontal = "FILL";
            }
          }
        }
      }

      if (adicionouConteudo) {
        docFrame.appendChild(section);
      }
    };

    // Renderizar Estados
    if (propsEstado.length > 0) {
      await renderVariantesSection("Estados", propsEstado);
    }

    // Renderizar Outras Variantes
    if (propsVariante.length > 0) {
      await renderVariantesSection("Variantes", propsVariante);
    }
  }

  // Posicionar ao lado do nó selecionado
  docFrame.x = node.x + node.width + 100;
  docFrame.y = node.y;

  if ('layoutSizingHorizontal' in estruturaContent) {
    (estruturaContent as any).layoutSizingHorizontal = "FILL";
  }

  figma.currentPage.appendChild(docFrame);
  figma.currentPage.selection = [docFrame];
  figma.viewport.scrollAndZoomIntoView([docFrame]);

  figma.closePlugin();
}

/**
 * Cria um frame comum de seção com título e linha divisória
 */
function createSectionFrame(titleText: string): FrameNode {
  const section = figma.createFrame();
  section.name = `Seção - ${titleText}`;
  section.layoutMode = "VERTICAL";
  section.layoutAlign = "STRETCH"; // Ocupa largura do pai
  section.primaryAxisSizingMode = "AUTO";
  section.counterAxisSizingMode = "AUTO";
  section.fills = []; // Transparente
  section.itemSpacing = 20;

  // Título da Seção
  const title = figma.createText();
  title.characters = titleText;
  title.fontSize = 20;
  title.fontName = { family: "Inter", style: "Bold" };
  title.fills = [figma.util.solidPaint("#1A1A1A")];
  section.appendChild(title);

  // Linha divisória
  const divider = figma.createLine();
  divider.layoutAlign = "STRETCH";
  divider.strokes = [figma.util.solidPaint("#D9D9D9")];
  divider.strokeWeight = 1;
  section.appendChild(divider);

  return section;
}

/**
 * Extrai propriedades básicas de um nó para exibir como texto.
 * Utiliza variáveis (tokens) vinculadas às propriedades quando disponíveis.
 */
async function getTokenName(node: SceneNode, propertyName: string, fallbackValue: any): Promise<string> {
  if ('boundVariables' in node && node.boundVariables) {
    const boundVars = (node.boundVariables as any);
    if (boundVars[propertyName] && boundVars[propertyName].type === 'VARIABLE_ALIAS') {
      const variable = await figma.variables.getVariableByIdAsync(boundVars[propertyName].id);
      if (variable) {
        return variable.name;
      }
    }
  }
  return `${fallbackValue}px`;
}

async function extrairPropriedadesBasicas(node: SceneNode): Promise<string> {
  let props = ``;

  const wToken = await getTokenName(node, 'width', node.width);
  const hToken = await getTokenName(node, 'height', node.height);

  props += `width: ${wToken}\n`;
  props += `height: ${hToken}\n`;

  if ('layoutMode' in node && node.layoutMode !== "NONE") {
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

  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    const radius = await getTokenName(node, 'cornerRadius', node.cornerRadius);
    if (radius !== '0px') props += `border-radius: ${radius}\n`;
  } else if ('cornerRadius' in node && node.cornerRadius === figma.mixed) {
    props += `border-radius: Variado (Mixed)\n`;
  }

  // Fills background aproximado
  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    // Tentar ler a variável de fill primário
    if ('boundVariables' in node && node.boundVariables && (node.boundVariables as any).fills) {
      const fillsVars = (node.boundVariables as any).fills;
      if (fillsVars.length > 0) {
        const varId = fillsVars[0].id;
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (variable) {
          props += `background-color: ${variable.name}\n`;
        }
      }
    }
  }

  // Propriedades nativas do componente removidas conforme solicitado

  return props.trim() + '\n';
}

/**
 * Pinta dinamicamente trechos de um nó de texto Baseado se são "px" (Azul) ou "Tokens" (Rosa).
 */
function renderHighlightText(textNode: TextNode, fullText: string) {
  let currentIndex = 0;
  const lines = fullText.split('\n');

  for (const line of lines) {
    const lineLength = line.length;
    // Captura "propriedade: valor"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const prefix = match[1] + ':';
      const value = match[2];

      const valIndex = line.indexOf(value, prefix.length);
      const absStart = currentIndex + valIndex;
      const absEnd = absStart + value.length;

      if (value.endsWith('px')) {
        // Azul para números absolutos
        textNode.setRangeFills(absStart, absEnd, [figma.util.solidPaint("#2F54EB")]);
      } else if (value !== 'Variado (Mixed)') {
        // Rosa para variáveis/tokens
        textNode.setRangeFills(absStart, absEnd, [figma.util.solidPaint("#8B77FF")]);
      }
    }
    currentIndex += lineLength + 1; // +1 pelo caractere de quebra de linha (\n)
  }
}

function rgbToHex(rgb: RGB) {
  const r = Math.round(rgb.r * 255).toString(16);
  const g = Math.round(rgb.g * 255).toString(16);
  const b = Math.round(rgb.b * 255).toString(16);
  return `#${r.length === 1 ? '0' + r : r}${g.length === 1 ? '0' + g : g}${b.length === 1 ? '0' + b : b}`.toUpperCase();
}

async function extrairPropriedadesTexto(node: TextNode): Promise<string> {
  let props = "";

  if (node.fontName && typeof node.fontName !== "symbol") {
    props += `font-family: ${node.fontName.family}\n`;
    props += `font-weight: ${node.fontName.style}\n`;
  }

  if (typeof node.fontSize === 'number') {
    const sizeToken = await getTokenName(node, 'fontSize', node.fontSize);
    props += `font-size: ${sizeToken}\n`;
  }

  if (node.lineHeight && typeof node.lineHeight !== "symbol" && node.lineHeight.unit !== "AUTO") {
    const lhToken = await getTokenName(node, 'lineHeight', Math.round(node.lineHeight.value));
    props += `line-height: ${lhToken}\n`;
  }

  if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
    if ('boundVariables' in node && node.boundVariables && (node.boundVariables as any).fills) {
      const fillsVars = (node.boundVariables as any).fills;
      if (fillsVars.length > 0) {
        const varId = fillsVars[0].id;
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (variable) {
          props += `color: ${variable.name}\n`;
        }
      }
    } else {
      const paint = node.fills[0];
      if (paint.type === "SOLID") {
        const hex = rgbToHex(paint.color);
        props += `color: ${hex}\n`;
      }
    }
  }

  return props;
}

async function appendSpecGroup(parentFrame: FrameNode, index: number, title: string, targetNode: SceneNode) {
  const groupFrame = figma.createFrame();
  groupFrame.name = `SpecGroup-${index}`;
  groupFrame.layoutMode = "VERTICAL";
  groupFrame.layoutAlign = "STRETCH";
  groupFrame.itemSpacing = 16;
  groupFrame.fills = [];

  // Title Row
  const titleRow = figma.createFrame();
  titleRow.layoutMode = "HORIZONTAL";
  titleRow.itemSpacing = 8;
  titleRow.counterAxisAlignItems = "CENTER";
  titleRow.primaryAxisSizingMode = "AUTO";
  titleRow.counterAxisSizingMode = "AUTO";
  titleRow.fills = [];

  // Circle Pin Frame
  const pinFrame = figma.createFrame();
  pinFrame.resize(24, 24);
  pinFrame.cornerRadius = 12;
  pinFrame.fills = [figma.util.solidPaint("#2C2C2E")];
  pinFrame.layoutMode = "VERTICAL";
  pinFrame.primaryAxisAlignItems = "CENTER";
  pinFrame.counterAxisAlignItems = "CENTER";

  const pinText = figma.createText();
  pinText.characters = index.toString();
  pinText.fontSize = 12;
  pinText.fontName = { family: "Inter", style: "Bold" };
  pinText.fills = [figma.util.solidPaint("#FFFFFF")];
  pinFrame.appendChild(pinText);

  const titleText = figma.createText();
  titleText.characters = title;
  titleText.fontSize = 16;
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fills = [figma.util.solidPaint("#1A1A1A")];

  titleRow.appendChild(pinFrame);
  titleRow.appendChild(titleText);
  groupFrame.appendChild(titleRow);

  // Properties Text
  const propsText = figma.createText();

  let propsString = await extrairPropriedadesBasicas(targetNode);
  if (targetNode.type === "TEXT") {
    propsString += await extrairPropriedadesTexto(targetNode as TextNode);
  }

  if (propsString.trim().length === 0) {
    propsString = "Nenhuma propriedade encontrada.";
  }

  propsText.characters = propsString;
  propsText.fontSize = 14;
  propsText.fontName = { family: "Inter", style: "Regular" };
  propsText.lineHeight = { value: 150, unit: "PERCENT" };
  propsText.fills = [figma.util.solidPaint("#333333")];
  propsText.layoutAlign = "STRETCH";
  propsText.textAutoResize = "HEIGHT";

  renderHighlightText(propsText, propsText.characters);
  groupFrame.appendChild(propsText);

  parentFrame.appendChild(groupFrame);
}

generateDocumentation();
