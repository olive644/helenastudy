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

Futura Helena inteligente
  -> seleção explícita de fontes + consentimento
  -> cliente same-origin /api/helena
  -> handler e adaptador de provedor no servidor
  -> resposta limitada e validada
```

`WorkspaceState` é a fonte única para matérias, tarefas, compromissos, hábitos, anotações, sessões
de foco, materiais, flashcards, metas e resultados de questionários. Os módulos não mantêm bancos
paralelos. O Espaço do aluno e o módulo Aprender derivam seus resumos desse estado compartilhado.

`src/product/module-catalog.ts` registra o estado dos módulos sem acoplar planejamento a uma
promessa visível. Somente módulos `available` podem fornecer atalhos executáveis. Módulos
`foundation` possuem apenas uma base técnica; módulos `planned` existem no mapa e no roadmap.

O armazenamento possui uma versão explícita e rejeita conteúdo inválido. A versão 3 migra os
estados das versões 1 e 2 sem apagar tarefas, notas ou materiais. Digitalizações e desenhos são
reduzidos no navegador, limitados a 1 MB por imagem e vinculados à anotação. A implementação local
pode ser substituída por um repositório remoto no futuro sem mudar as regras do domínio.

Biblioteca, Quizzes e bingo e o planejador de aulas são carregados sob demanda. As ferramentas de
captura do Caderno também usam um chunk separado. O manifesto do Vite
permite medir separadamente o JavaScript inicial e o total assíncrono: 220 KiB para a entrada e 300
KiB para o conjunto.

O gerador de planos continua independente da interface e da central de estudos. Uma futura IA
poderá implementar outra estratégia sem substituir o fluxo determinístico existente.

A fronteira da futura IA está descrita em [`AI_BACKEND.md`](AI_BACKEND.md). O contrato rejeita
campos desconhecidos e não aceita o workspace completo. A chave do provedor pertence exclusivamente
ao ambiente do servidor. O handler usa `Request` e `Response` web para continuar independente do
runtime de hospedagem; os adaptadores de provedor, identificação e rate limit ainda precisam ser
escolhidos antes da ativação.

## Limites

- `src/domain`: regras, modelos do workspace e gerador de plano de aula;
- `src/ai`: contrato compartilhado e limites da futura integração;
- `src/backend`: fronteira HTTP portável, sem provedor ou segredo configurado;
- `src/data`: persistência e validação da fronteira local;
- `src/hooks`: ligação entre React e o domínio;
- `src/components`: componentes visuais reutilizáveis;
- `src/product`: catálogo tipado e decisões de composição do produto;
- `src/views`: experiências do Espaço do aluno, Agenda, Foco, Hábitos, Cadernos e planos de aula;
- `src/app.tsx`: roteamento local e composição da aplicação;
- `src/styles.css`: tokens e layout responsivo;
- `e2e`: contratos visíveis ao usuário.
