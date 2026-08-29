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
