# Auditoria do estado atual

## Modo Sala — endurecimento em revisão (12/09/2026)

Esta seção atualiza o diagnóstico histórico abaixo; código na branch não significa configuração ativa em produção.

Atualização: o CI da PR #98 passou em Chromium/WebKit. A limpeza agora percorre até
10 lotes de 100 por caminho, com orçamento global de 45 segundos e relatório
`pendingPaths`; substitui o limite inicial de um único lote citado abaixo. Permanece
pendente a ativação externa e a validação em aparelhos físicos/Firebase real.

- Concorrência: leitura ETag e gravação condicional no estado privado, repetição de conflitos e publicação pública monotônica por geração/revisão. Criação, entrada e resposta têm recibos idempotentes. Publicação e estado privado ainda são duas gravações; heartbeat/repetição repara falha intermediária.
- Identidade: token privado de participante separado do identificador público. Credenciais e respostas do quiz não entram na projeção pública.
- Presença: heartbeat de 15 segundos; tolerância de 2 minutos; inativos saem do lobby e ficam sinalizados na partida. Anfitrião ausente encerra a sala na próxima interação. Não há transferência de controle nem detecção instantânea por onDisconnect; se todos saírem, a expiração limita a vida da sala.
- Abuso: limites distribuídos por origem de rede e ação; App Check com verificação de assinatura/claims implementado, mas **não ativado**. O projeto appstudyoli não tinha aplicativo Web registrado na consulta desta execução. Falta chave pública reCAPTCHA Enterprise/domínio e configuração do app.
- Expiração: prazo absoluto de 4 horas, regras de leitura por expiresAt e limpeza autenticada agendada de projeção pública/privada/contadores. **Regras e cron ainda não publicados**. O lote atual remove até 100 itens por caminho/execução; monitorar acúmulo e ampliar frequência/capacidade antes de maior escala. Projeções legadas sem expiresAt exigem migração/remoção separada.
- Rodada: categoria, contagem por dificuldade, prévia, até 30 flashcards de matéria própria, equipes alternadas, embaralhamento e entrada tardia configuráveis. Compartilhar matéria envia frente/verso temporariamente ao servidor; aviso explícito no seletor. Material próprio usa dificuldade média.
- Bingo: cartelas e marcas validadas no servidor; primeira cartela completa encerra a partida. Entrada tardia recebe até 9 itens restantes e pode ter cartela menor; desabilitar entrada tardia quando a igualdade competitiva for importante.
- Resiliência: Error Boundary da sala, cancelamento de requisições, timeout, retomada com retry sem apagar credencial em falha transitória, validação de payloads, logs de ação/status/duração, foco de teclado contido no diálogo.
- Evidência local: concorrência de 30 entradas/respostas em armazenamento atômico de teste; ETags/412 com HTTP simulado; partidas completas de quiz e bingo com anfitrião e dois jogadores em contextos separados, incluindo reload. Transporte E2E usa handler real + adaptador em memória, **não Firebase real**. Edge instalado substituiu browsers cujo download falhou; Safari/WebKit, bloqueio físico de celular, carga real de 30 dispositivos e auditoria assistiva completa continuam pendentes.
- Dependências: firebase (App Check oficial, carregamento dinâmico) e jose (JWT/JWKS no servidor). Entrada inicial permanece abaixo de 222 KiB; orçamento total passa a 395 KiB por ~44 KiB opcionais do SDK e novos controles.

Ativação e limites operacionais: ver `ROOM_SETUP.md`.

## Sistema oficial de ícones HelenaStudy

- A navegação usa glifos preenchidos e arredondados próprios para Espaço, Agenda, Foco, Praticar, Mais, Biblioteca, Hábitos, Notas, Planos e Banco.
- A mesma geometria assume grafite sobre superfícies claras, roxo no estado ativo e creme sobre a navegação escura.
- O amarelo permanece reservado aos pequenos acentos de cada símbolo, de acordo com a identidade da HelenaStudy.
- Os mesmos componentes são reutilizados na barra lateral, na navegação móvel, no menu Mais, nos atalhos e no botão Começar prática.
- No celular, a barra é preta no tema claro e roxa no tema escuro; em ambos os casos ela reutiliza a variante branca dos ícones oficiais.
- A aba ativa recebe um pulso curto e o novo módulo entra suavemente, com as animações removidas quando `prefers-reduced-motion` está ativo.

## Dificuldade automática do vocabulário

- O quiz de escuta classifica palavras como fáceis, médias ou difíceis usando frequência Zipf.
- Uma base inglesa compacta é carregada somente ao abrir a atividade; o pacote Python completo não entra no bundle do navegador.
- Palavras ausentes consultam a Datamuse e ficam em cache local. Se a rede falhar, uma estimativa determinística mantém a atividade disponível.
- O script `scripts/generate-word-frequency.py` reproduz a base de 10 mil palavras com `wordfreq==3.1.1` em ambiente de desenvolvimento.
- O aluno pode escolher nível misto, fácil, médio ou difícil antes da rodada.

## Correção da navegação desktop

- A barra lateral desktop mantém o fundo preto definido no redesign, mesmo após as camadas legadas de CSS.
- Os ícones autorais recebem dimensões fixas e cores específicas no desktop para evitar encolhimento e deformação.
- O estado ativo usa o roxo da marca, enquanto os ícones inativos permanecem creme sobre o fundo escuro.

## Quiz de escuta e pronúncia

- A área Praticar agora oferece uma sessão de escuta baseada nos flashcards da matéria selecionada.
- Quando não há flashcards suficientes, um conjunto inicial de lugares em inglês mantém a atividade utilizável.
- Cada rodada pronuncia o termo com a Web Speech API, apresenta uma contagem regressiva, aceita respostas em inglês ou português e revela o resultado somente após a tentativa.
- Termos errados podem formar uma nova sessão de reforço, sem envio de áudio ou conteúdo a serviços externos.
- A experiência oferece feedback textual e respeita `prefers-reduced-motion`.

## Redesign visual completo

- A aplicação passa a usar uma linguagem visual de “mesa de estudos”, com base creme, navegação preta e destaques violeta e amarelo.
- A navegação reutiliza os ícones autorais já existentes e mantém a silhueta da Helena em todos os módulos.
- Foram adicionadas transições curtas para navegação, painéis, ações rápidas e abertura do menu móvel, sempre respeitando `prefers-reduced-motion`.
- O ícone de Planos de aula recebeu uma nova geometria interna para impedir o corte da letra A em tamanhos reduzidos.
- A alteração é exclusivamente visual e preserva os fluxos, dados locais e funcionalidades existentes.

## 1. Fundação inicial: 2026-08-29

O repositório nasceu contendo apenas um README. A primeira base estabelece:

- produto focado em planejamento de aulas para professores de inglês;
- React, TypeScript estrito e Vite;
- identidade HelenaStudy com assinatura Oli;
- criação determinística de um rascunho de aula no navegador;
- interface responsiva sem autenticação;
- lint, formatação, testes, build, orçamento de bundle e E2E;
- auditoria de dependências, SBOM, Gitleaks, Semgrep, CodeQL e Dependabot.

Autenticação, IA, uploads, banco e exportações foram deliberadamente adiados. A interface não deve
dar a entender que esses recursos já existem.

## 2. Primeiro contrato E2E mobile

A primeira execução da CI rodou o teste chamado “mantém o conteúdo dentro da tela no celular” nos
dois projetos do Playwright. O fluxo mobile passou, mas o mesmo teste exigiu a barra móvel no
desktop e falhou corretamente. O contrato passou a ser explicitamente restrito ao projeto
`mobile`; a verificação de overflow e a presença da navegação continuam obrigatórias no iPhone.

## 3. Redução da aparência artificial e retorno ao desenho original

A primeira interface usava gradientes de fundo, transparências, sombras grandes, muitos cartões
arredondados e uma releitura genérica da cabeça da mascote. O conjunto parecia uma demonstração
gerada, não uma ferramenta de trabalho.

A direção foi simplificada para fundo neutro, painéis planos, bordas discretas, cantos pequenos,
tipografia de sistema e textos mais diretos. A fala da mascote e os elementos decorativos foram
removidos. `public/helena.svg` agora preserva a silhueta irregular, os olhos amarelos e as pupilas
do desenho original fornecido para a marca. A navegação desktop agora usa um rail compacto com os ícones oficiais em variantes
clara, roxa e escura, nomes revelados no hover/foco e alternância de tema no canto superior direito.
O retrato de Helena usa o PNG transparente `public/helena-mark.png`, sem moldura de aplicativo. A
navegação desktop pode ser expandida pelo botão de três linhas para revelar categorias e nomes,
enquanto o cabeçalho mantém a assinatura HelenaStudy com o sufixo roxo. Os arquivos
individuais em `public/navigation-icons/` mantêm os desenhos aprovados sem reinterpretá-los e evitam
dependência de posicionamento por sprite no navegador.

## 4. Fundação da central de estudos

O escopo foi ampliado por decisão de produto: o planejador de aulas permanece, mas passa a fazer
parte de uma central pessoal de estudos e rotina. A primeira entrega adiciona:

- tela Hoje derivada de tarefas, agenda, hábitos e sessões de foco;
- criação de matérias compartilhadas pelos demais módulos;
- criação e conclusão de tarefas;
- compromissos com data e horário;
- cronômetro de 25 ou 50 minutos e registro da sessão realizada;
- hábitos diários marcáveis;
- cadernos com edição e salvamento automático;
- workspace local compartilhado, validado e versionado.

Os dados são salvos em `localStorage` e a interface informa esse limite. Não existe conta, nuvem,
IA, notificação nativa ou bloqueio real de aplicativos. O aviso do módulo Foco deixa explícito que
o modo sem distrações depende de uma futura versão mobile.

## 5. Sistema local de estudos

A segunda etapa amplia o workspace para a versão 2 e migra automaticamente dados da versão 1. A
entrega adiciona:

- Biblioteca com links e textos cadastrados manualmente;
- flashcards vinculados a matérias;
- revisão programada com opções Errei, Difícil e Fácil;
- questionários determinísticos criados a partir dos próprios cartões;
- metas relacionadas aos minutos registrados no módulo Foco;
- histórico local de resultados de questionários;
- carregamento sob demanda de Biblioteca, Aprender e planos de aula.

Não há geração por IA nem leitura automática de arquivos. Links só são abertos quando usam HTTP ou
HTTPS. O novo orçamento separa a entrada inicial de módulos assíncronos, mantendo limites de 220
KiB inicial e 300 KiB total.

## 6. Definição segura do backend de IA

A terceira etapa começa pela fronteira de segurança, sem ativar uma IA na interface. A entrega
define:

- contrato versionado para tutoria, explicação, resumo e plano de estudos;
- seleção explícita de fontes, sem serializar o workspace completo;
- consentimento obrigatório por solicitação e retenção inicial `none`;
- cliente restrito a `/api/helena` na mesma origem;
- handler portável com validação de origem, tipo, tamanho e limite de uso;
- interfaces independentes para provedor, identificação e rate limit;
- respostas e erros limitados, sem detalhes internos;
- modelo de ameaça e requisitos prévios à ativação.

Não existe provedor conectado, segredo versionado ou chamada externa. A interface continua sem
afirmar que oferece IA. A ativação depende de uma nova mudança com runtime, provedor, política de
retenção, orçamento e implantação aprovados.

## 7. Redesign de conforto e navegação

A navegação e a hierarquia visual foram reorganizadas sem alterar o domínio ou a persistência. A
entrega mantém a paleta original e o SVG da Helena, mas reduz títulos excessivos, melhora tamanhos
de toque, espaçamento, leitura de formulários e clareza dos estados ativos.

No desktop, os módulos ficam agrupados em Principal, Estudar e Organizar. No celular, a barra
inferior prioriza Hoje, Agenda, Foco e Aprender; as demais ferramentas ficam em um painel Mais com
acesso direto. A interface não usa gradientes, vidro, neon ou elementos decorativos que simulem uma
demonstração de IA.

A assinatura visível da marca secundária foi removida a pedido do proprietário. O nome exibido é
somente HelenaStudy, sem alterar a origem ou as regras de engenharia do repositório.

## 8. Fundação do Espaço do aluno

A tela inicial passa a se chamar **Espaço do aluno** no desktop e usa o rótulo curto **Espaço** na
barra móvel. O conteúdo continua derivado do mesmo workspace local, preservando tarefas, agenda,
hábitos, foco e materiais já existentes.

Um catálogo tipado separa módulos disponíveis, fundações técnicas e recursos planejados. Os atalhos
da tela inicial são gerados apenas para ferramentas funcionais. O mapa mental e o roadmap registram
vestibulares, banco de questões, documentos, OCR, mapas conectados, cultura, bingo e Helena
inteligente sem apresentá-los como recursos prontos.

Esta fase não adiciona dependências. React, TypeScript e CSS existentes atendem à mudança; futuras
bibliotecas ou linguagens exigirão justificativa, auditoria e medição na fase correspondente.

## 9. Digitalização, escrita à mão, quizzes e bingo

Os Cadernos passam a oferecer duas ferramentas locais. **Digitalizar** abre a câmera traseira em
navegadores compatíveis ou permite escolher uma imagem, girar, realçar o contraste e anexar o
resultado à anotação. **Escrever à mão** oferece uma tela sensível a mouse, caneta e toque, com cor,
espessura e limpeza antes de salvar.

As imagens são processadas no navegador, não são enviadas para serviços externos e ficam limitadas
a 1 MB por item. A digitalização atual não executa OCR; reconhecimento de texto continua planejado
para uma mudança com modelo de ameaça e estratégia de processamento próprios.

O módulo antes chamado Aprender passa a aparecer como **Quizzes e bingo** no desktop e **Praticar**
no celular. Flashcards, Quizzes e Bingo são modos explícitos da sessão. A cartela 3 por 3 combina
desafios gerais com flashcards da matéria, salva o progresso no workspace e reconhece linhas,
colunas e diagonais.

O workspace evolui para a versão 3 e migra automaticamente as versões 1 e 2. Nenhuma dependência
foi adicionada; Canvas, Pointer Events e captura de arquivo do navegador atendem à primeira versão.

## 10. Iconografia própria da HelenaStudy

A navegação desktop, a barra inferior mobile e o painel Mais passam a compartilhar uma família de
ícones SVG criada para o produto. Cada módulo mantém um símbolo reconhecível, mas usa a assimetria,
as pontas e os olhos amarelos derivados da silhueta original da Helena.

Os ícones são componentes locais, herdam a cor do estado ativo e não dependem de imagens geradas,
fontes de ícones ou novos pacotes. Os rótulos textuais continuam visíveis e responsáveis pelo nome
acessível de cada aba.

## 11. Vocabulário e voz do quiz de escuta

O quiz de escuta combina os flashcards do aluno com um conjunto local de 30 palavras e expressões
em inglês, sem duplicar termos. As respostas aceitam a palavra ou expressão ouvida, a tradução
principal e equivalentes cadastrados. Os filtros Fácil, Médio e Difícil continuam sendo calculados
pela base local de frequência, com os mesmos fallbacks já documentados.

A pronúncia neural usa o **Cloudflare Workers AI** (modelo `@cf/myshell-ai/melotts`, voz natural em
inglês), chamado direto pela função `/api/speech` da Vercel com o token em variável de ambiente
protegida — nunca exposto ao navegador. O navegador envia somente o texto da pergunta e a velocidade;
a resposta chega em MP3.

Existe um serviço próprio Kokoro+Piper (`services/tts`, container separado, Kokoro como voz principal
e Piper como reserva automática) totalmente implementado e testado, mas **fora de uso em produção no
momento**: nenhuma hospedagem grátis viável foi encontrada pra rodar os dois modelos juntos (ver
`docs/AI_BACKEND.md` para o histórico completo da investigação). O Cloudflare Workers AI resolveu isso
porque roda na infraestrutura deles mesmo, sem precisar hospedar nada.

Uma tentativa ainda mais antiga de rodar o Kokoro-82M direto no navegador (worker) também foi removida,
porque o download e a inicialização locais prejudicavam o tempo até a primeira pronúncia — problema que
nenhuma das abordagens server-side repete. O áudio é reutilizado por texto normalizado e velocidade no
cache do navegador (durante a sessão). Requisições antigas são canceladas quando a seleção muda. Se o
Cloudflare Workers AI falhar ou não estiver configurado, a melhor voz em inglês instalada no
dispositivo é acionada automaticamente, tanto no Quiz de Escuta quanto no Modo Sala.

As rodadas agora são embaralhadas sem repetição e aceitam 5, 10, 15 ou todas as palavras. O catálogo
pedagógico tipado separa as 30 palavras do componente, com dificuldade, categoria e traduções
equivalentes. O feedback correto e incorreto possui ícones, textos e ações distintos, e uma trava
impede que a mesma submissão altere a pontuação duas vezes.

## 12. Modo Sala online

O Modo Sala usa uma função same-origin como autoridade e o Firebase Realtime Database como
armazenamento temporário e transporte realtime. O professor cria um código temporário, configura a
rodada e compartilha link ou QR code. Participantes entram em outros dispositivos com nome de
exibição e recebem as mudanças por Server-Sent Events nativos do navegador.

Tokens do anfitrião e o baralho completo ficam apenas no armazenamento privado. A projeção pública
expõe somente o estado necessário à partida; o servidor valida início, respostas, cronômetro e
placar. Salas expiram após quatro horas e aceitam até 30 participantes. Não há conta ou ranking
global. Reconexão com identidade preservada, presença após fechamento abrupto, App Check e rate
limiting continuam pendentes.

O lobby mostra conexão, participantes, convite, resumo e duração estimada. A entrada normaliza o
código e informa separadamente sala inexistente, iniciada, cheia ou nome duplicado. No celular, o
cabeçalho da sala permanece visível e oferece uma ação textual para sair.
O lobby do anfitrião usa layout flat responsivo. O convite e a lista de participantes ficam ao lado
da escolha da atividade no desktop e passam para uma coluna no celular. Escuta coletiva e Bingo
estão disponíveis; Flashcards em grupo e Quiz competitivo aparecem desabilitados como “Em breve”.
A barra inferior resume a rodada e mantém a ação de início visível. Os ícones aprovados do projeto,
a arte da Helena segurando a placa e o QR SVG dinâmico foram preservados.
No quiz de escuta, o professor também pode montar a rodada manualmente com até 30 pares no formato
`inglês = tradução`. O formulário valida linhas incompletas antes de enviar o baralho temporário e
mantém o início bloqueado até que as palavras sejam aplicadas à sala.
Anfitrião e participante guardam a credencial somente na aba atual e retomam a mesma sala após uma
atualização da página, inclusive durante a rodada. Uma sessão expirada ou inválida é descartada com
mensagem clara, sem criar um participante duplicado.

A pronúncia das palavras (Escuta coletiva e Bingo) usa o mesmo cliente e o mesmo caminho de geração
de áudio do Quiz de Escuta individual (`NaturalVoicePlayer`, `POST /api/speech`), em vez de chamar a
Web Speech API direto. Professor e participantes ouvem a mesma pronúncia gerada pelo Cloudflare
Workers AI, com a voz do navegador entrando só se o serviço inteiro falhar. Trocar de pergunta cancela
qualquer reprodução ou pedido de áudio pendente da pergunta anterior.

## 13. Experiência de estudo renovada

A foto aprovada da Helena, sem óculos e com fundo roxo, é usada no ícone da aba e na marca do menu,
por meio do arquivo local `public/helena-portrait.png`.

O painel e a navegação adotam uma hierarquia inspirada em aplicativos de revisão como SimpleStudy:
próxima ação evidente, atalhos de prática, progresso diário visível e cartões fáceis de reconhecer.
A referência é apenas de experiência; cores, componentes, textos e iconografia continuam próprios.

A identidade HelenaStudy permanece baseada em preto, amarelo, violeta e na mascote original. A nova
família de ícones usa traço consistente e pequenos acentos da marca, sem substituir a Helena por uma
identidade genérica. As animações são curtas, comunicam mudança de estado e são removidas quando o
sistema solicita redução de movimento.

Os carregamentos de módulos e ferramentas usam uma única animação vetorial da Helena caminhando,
com mensagem anunciada por leitor de tela, tipografia Manrope e versões responsivas para telas
completas ou painéis compactos. O ciclo fica estático quando `prefers-reduced-motion` está ativo.

No celular, a navegação flutua acima do conteúdo, os atalhos aparecem em uma grade de toque amplo e
o painel mantém resumo, prioridades e início rápido sem rolagem horizontal. Nenhum fluxo, dado local
ou contrato de domínio foi alterado pelo redesign.

# Navegação e painel principal

## Proteção das salas: observabilidade

O guard emite eventos `room_protection` com ação normalizada, enforcement,
resultado da verificação e status da proteção. Tokens, IPs, nomes e respostas
não são registrados. A assinatura também é verificada no modo de observação.
O status 200 nesse evento significa aprovação do guard, não sucesso da ação.
Bloqueios por limite de tentativas também são registrados nesse evento.

O convite do Modo Sala usa a arte aprovada da Helena segurando uma placa. O QR
continua sendo SVG dinâmico com margem branca de quatro módulos, posicionado
na área livre da placa sem cobrir as patas. A imagem é apenas apresentação;
o endereço codificado continua sendo gerado a partir da sala atual.

- No desktop, a barra lateral é o ponto único de acesso aos módulos.
- O Espaço do aluno concentra contexto diário, métricas, tarefas e agenda; atalhos que duplicavam a
  navegação foram removidos.
- No celular, a navegação inferior e a folha “Mais ferramentas” continuam oferecendo todos os módulos.
