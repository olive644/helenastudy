# Auditoria do estado atual

## Dificuldade automática do vocabulário

- O quiz de escuta classifica palavras como fáceis, médias ou difíceis usando frequência Zipf.
- Uma base inglesa compacta é carregada somente ao abrir a atividade; o pacote Python completo não entra no bundle do navegador.
- Palavras ausentes consultam a Datamuse e ficam em cache local. Se a rede falhar, uma estimativa determinística mantém a atividade disponível.
- O script `scripts/generate-word-frequency.py` reproduz a base de 10 mil palavras com `wordfreq==3.1.1` em ambiente de desenvolvimento.
- O aluno pode escolher nível misto, fácil, médio ou difícil antes da rodada.

## Correção da navegação desktop

- A barra lateral desktop mantém o fundo preto definido no redesign, mesmo após as camadas legadas de CSS.
- Os ícones autorais recebem dimensões fixas e cores específicas no desktop para evitar encolhimento e deformação.
- O estado ativo usa fundo amarelo, base preta e detalhe violeta; o comportamento móvel permanece inalterado.

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
do desenho original fornecido para a marca.

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

A pronúncia passa a oferecer Piper TTS executado localmente com WebAssembly. A integração usa
`@mintplex-labs/piper-tts-web` 1.0.5, pacote MIT mantido e publicado em agosto de 2026, com runtime de
aproximadamente 500 kB antes da minificação. Os modelos Piper possuem licenças próprias registradas
no catálogo e as vozes selecionadas nesta tela são modelos médios de aproximadamente 60 MB. A carga
só começa por ação explícita, o progresso real é exibido e os modelos ficam no OPFS quando o
navegador permite. O texto da atividade não é enviado a um provedor de TTS. A Web Speech API
permanece como fallback imediato e recebe um nome honesto na interface.

No build de produção, o worker opcional mede aproximadamente 176 kB e o ONNX Runtime WASM mede
13,3 MiB; ambos ficam fora da entrada inicial e só são solicitados ao ativar a voz neural. O orçamento
de performance mede separadamente a aplicação, o worker e o WASM para impedir que esse isolamento
mascare crescimento do código principal.

As rodadas agora são embaralhadas sem repetição e aceitam 5, 10, 15 ou todas as palavras. O catálogo
pedagógico tipado separa as 30 palavras do componente, com dificuldade, categoria e traduções
equivalentes. O feedback correto e incorreto possui ícones, textos e ações distintos, e uma trava
impede que a mesma submissão altere a pontuação duas vezes.

## 12. Modo Sala local

O primeiro Modo Sala é deliberadamente local. O professor cria um código temporário, escolhe Quiz de
escuta ou Bingo, dificuldade e quantidade de perguntas. Participantes em outras abas da mesma origem
entram com nome temporário e recebem o estado por `BroadcastChannel`. A interface diz explicitamente
que isso não funciona pela internet.

Não há backend, conta, dados públicos, ranking global ou autoridade remota nesta fase. As interfaces
de estado e transporte ficam separadas para permitir uma futura implementação online com validação
no servidor, expiração, rate limit e retenção documentada. O Bingo está preparado como atividade no
lobby, mas sorteio, cartelas distintas e validação sincronizada permanecem para uma próxima entrega.
