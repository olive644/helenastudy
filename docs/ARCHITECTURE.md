# Arquitetura atual

```text
Views React
  -> dispatch de ações tipadas
  -> workspaceReducer
  -> WorkspaceState versionado
  -> localStorage

Plano de aula
  -> dados validados do formulário
  -> gerador determinístico
  -> visualização local
```

`WorkspaceState` é a fonte única para matérias, tarefas, compromissos, hábitos, anotações e sessões
de foco. Os módulos não mantêm bancos paralelos. A tela Hoje deriva seu resumo desse estado
compartilhado.

O armazenamento possui uma versão explícita e rejeita conteúdo inválido. A implementação local
pode ser substituída por um repositório remoto no futuro sem mudar as regras do domínio.

O gerador de planos continua independente da interface e da central de estudos. Uma futura IA
poderá implementar outra estratégia sem substituir o fluxo determinístico existente.

## Limites

- `src/domain`: regras, modelos do workspace e gerador de plano de aula;
- `src/data`: persistência e validação da fronteira local;
- `src/hooks`: ligação entre React e o domínio;
- `src/components`: componentes visuais reutilizáveis;
- `src/views`: experiências de Hoje, Agenda, Foco, Hábitos, Cadernos e planos de aula;
- `src/app.tsx`: roteamento local e composição da aplicação;
- `src/styles.css`: tokens e layout responsivo;
- `e2e`: contratos visíveis ao usuário.
