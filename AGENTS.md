# Regras de trabalho do HelenaStudy

Estas regras herdam o padrão de engenharia do OliQualidade e valem para todo o repositório.

## Fluxo Git

- Nunca desenvolver diretamente na `main`.
- Criar uma branch curta e descritiva para cada mudança.
- Entregar mudanças por pull request; não habilitar merge automático.
- Não mesclar uma pull request sem autorização explícita do proprietário.
- Preferir squash merge após CI verde e revisão concluída.
- Não misturar atualização de dependência com mudança de produto sem necessidade comprovada.

## Qualidade

- Manter TypeScript estrito; não introduzir `any`, `@ts-ignore` ou `@ts-expect-error` para contornar um problema.
- Não desativar opções estritas do compilador para fazer código novo passar.
- Toda correção deve ter um teste que falhe sem ela quando isso for tecnicamente viável.
- Componentes interativos precisam funcionar com teclado, toque e larguras móveis.
- Nenhuma ação essencial pode depender apenas de hover.
- Rodar `npm run verify` antes de publicar uma branch.
- Mudanças de fluxo principal devem passar também por `npm run test:e2e`.

## Segurança e privacidade

- Nunca versionar segredos, tokens, dados pessoais ou materiais didáticos privados.
- Arquivos enviados pelo usuário devem ser tratados como não confiáveis.
- Não enviar conteúdo a serviços externos sem consentimento claro e documentação do fluxo.
- Dependências novas exigem justificativa, auditoria e verificação do impacto no bundle.
- Autenticação, IA e armazenamento remoto só entram em mudanças próprias, com modelo de ameaça e testes.

## Produto e documentação

- Registrar decisões arquiteturais e mudanças de estado em `docs/CURRENT_STATE_AUDIT.md`.
- Atualizar `docs/SECOND_BRAIN.md` quando o fluxo, a arquitetura ou os comandos mudarem.
- Usar nomes honestos: recursos simulados ou locais não podem ser apresentados como IA, sincronização ou persistência em nuvem.
- Manter o escopo inicial centrado em planejamento de aulas de inglês para professores.
