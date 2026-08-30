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

`WorkspaceState` é a fonte única para matérias, tarefas, compromissos, hábitos, anotações, sessões
de foco, materiais, flashcards, metas e resultados de questionários. Os módulos não mantêm bancos
paralelos. A tela Hoje e o módulo Aprender derivam seus resumos desse estado compartilhado.

O armazenamento possui uma versão explícita e rejeita conteúdo inválido. A versão 2 migra o estado
da versão 1 sem apagar dados. A implementação local pode ser substituída por um repositório remoto
no futuro sem mudar as regras do domínio.

Biblioteca, Aprender e o planejador de aulas são carregados sob demanda. O manifesto do Vite
permite medir separadamente o JavaScript inicial e o total assíncrono: 220 KiB para a entrada e 300
KiB para o conjunto.

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
