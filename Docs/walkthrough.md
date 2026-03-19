# Walkthrough — Busca Resiliente de Estados (v2.5)

A seção de "Estados" agora é muito mais inteligente e resiliente, garantindo que nenhum estado fique sem um preview visual na sua documentação.

## O Que Foi Implementado

### 1. Sistema de Melhor Correspondência (Scoring)
Implementamos um algoritmo de pontuação para localizar variantes:
- **Prioridade 1**: O estado solicitado (ex: Hover, Disabled) deve bater obrigatoriamente.
- **Prioridade 2**: O plugin tenta encontrar a variante que tenha a mesma cor (Semantic) e outras propriedades que você selecionou.
- **Resultado**: Se a cor selecionada (ex: Success) não tiver o estado "Pressed" definido no Figma, o plugin buscará a versão "Pressed" de outra cor disponível (ex: Info), garantindo que o usuário veja o comportamento visual em vez de apenas um texto.

### 2. Correção do Fallback de Texto
Anteriormente, se um match exato não era encontrado, o plugin mostrava apenas o nome do estado em texto. Agora, com a busca por pontuação, sempre teremos um componente visual para exemplificar a interação, tornando a documentação mais rica e profissional.

### 3. Case-Insensitive e Robustez
A busca agora é imune a diferenças de maiúsculas/minúsculas nos nomes das propriedades e valores, o que evita falhas de renderização causadas por inconsistências de nomenclatura no arquivo Figma.

## Resultados Visuais
- **Previews Completos**: Todas as linhas de estados agora possuem componentes visuais de ponta a ponta.
- **Inteligência Contextual**: O plugin sempre tentará manter a cor que você escolheu, só mudando se for estritamente necessário para mostrar o estado.

---
*Documentação gerada automaticamente pelo plugin AutoDocs.*
