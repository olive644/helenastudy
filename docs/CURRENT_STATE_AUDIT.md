# Auditoria do estado atual

## 1. Fundação inicial — 2026-08-29

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
