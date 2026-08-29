# Arquitetura inicial

```text
Interface React
  -> dados validados do formulário
  -> gerador determinístico de estrutura
  -> plano de aula em memória
  -> visualização editável (próxima etapa)
```

O domínio não depende da interface. `src/domain` contém os tipos e a transformação que cria um
rascunho. Isso permite trocar a implementação local por um serviço de IA no futuro sem acoplar o
produto a um fornecedor desde o começo.

## Limites

- `src/domain`: regras e modelos do plano de aula;
- `src/components`: componentes visuais reutilizáveis;
- `src/app.tsx`: composição da experiência inicial;
- `src/styles.css`: tokens e layout responsivo;
- `e2e`: contratos visíveis ao usuário.
