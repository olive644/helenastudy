# Identidade visual oficial HelenaStudy

O padrão aprovado para a Helena, mundos, trilhas, ícones, botões e novos elementos visuais é **papel recortado**. Preservar silhuetas reconhecíveis, facetas geométricas, camadas de cores sólidas e pequenas sombras de sobreposição. Não substituir por ícones de contorno genéricos, plástico 3D, glassmorphism ou gradientes.

- Tipografia: Manrope.
- Marca: Helena em preto/grafite, Study em roxo.
- Paleta: creme #FFF9EF, roxo #7C3AED, amarelo #FACC15 e grafite #292432. Facetas usam #51465D, #51259B, #A779EF e #FFE88D.
- Mascote: gata compacta, olhos amarelos, pupilas verticais, estrela amarela na orelha. Manter anatomia clara e consistência entre poses.
- Ícones: usar os SVGs de public/navigation-icons/paper como referência. Criar símbolos semanticamente adequados, sem reutilizar desenhos aleatórios. Bandeiras conservam suas cores reconhecíveis em facetas de papel.
- Botões: camadas e facetas discretas, foco visível, área de toque mínima de 44px. Não depender só de sombra para comunicar o material.
- O acabamento compartilhado está em src/paper-buttons.css: cantos assimétricos, facetas sólidas e base deslocada. Botões primários usam roxo e secundários usam creme. As transições do menu lateral e Mais usam três tiras de papel que formam um X, com movimento reduzido e estado acessível. A animação foi adaptada do exemplo de Ali-Tahmazi99 no Uiverse.io.

## Tela de login

Login usa página creme, balão de papel e cartão branco com sombra em camadas. Helena espia por cima do cartão, com as patinhas apoiadas na borda, acima de Bem-vindo ao seu espaço. A placa incorporada na arte fica ocultada pelo recorte CSS. Preservar proporções compactas, Manrope, marca Helena preta e Study roxa, botão roxo facetado e seta de papel. Preview direto: /?onboarding=1&login=1.

## Componente de espera

Usar o componente HelenaLoading, com label contextual e compact quando necessário. O lápis animado é uma adaptação do SVG e CSS de gustavofusco no Uiverse.io, fornecidos pelo proprietário. Manter essa atribuição. Movimento de 3 segundos, cores e ponta/borracha no padrão de papel recortado. O status é anunciado uma vez pelo texto; o SVG é decorativo. Movimento reduzido apresenta desenho estático. Classes exclusivas evitam regras globais de ícones. Não há IDs de clipPath compartilhados entre instâncias.

O arquivo helena-loading.svg antigo também é usado como personagem de navegação nos mundos: não substituí-lo pelo lápis. Novos estados de espera devem usar o componente compartilhado, nunca reutilizar o personagem como spinner nem criar animações independentes.
