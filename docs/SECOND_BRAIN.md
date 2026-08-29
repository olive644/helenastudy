# HelenaStudy — Second Brain

## Proposta

O HelenaStudy é o segundo aplicativo da marca Oli. Ele ajuda professores de inglês a transformar
tema, nível, duração e abordagem pedagógica em uma estrutura de aula clara e editável.

**Promessa:** Planeje sua aula. A Helena organiza o restante.

## Público inicial

- professores de inglês;
- professores particulares;
- pequenas escolas e cursos livres.

## Fluxo do primeiro produto

1. Informar tema, nível CEFR, perfil da turma e duração.
2. Escolher uma abordagem de apresentação.
3. Montar localmente uma estrutura com objetivo, warm-up, apresentação, prática, produção e tarefa.
4. Revisar o resultado na interface.

Nesta fase, “montar” significa aplicar uma estrutura determinística no navegador. Não há IA,
conta, banco ou sincronização remota.

## Arquitetura atual

- React 19 e TypeScript estrito;
- Vite para desenvolvimento e build;
- CSS próprio, mobile-first e sem fonte externa;
- Vitest e Testing Library para unidade/componente;
- Playwright para fluxos desktop e mobile;
- GitHub Actions para qualidade, auditoria, segredos, análise estática e CodeQL.

## Identidade

- preto: `#17151C`;
- amarelo: `#FFC94A`;
- violeta: `#7257E8`;
- lavanda: `#E9E2FF`;
- creme: `#FFF8ED`.

Helena é a gata preta de olhos amarelos que orienta o fluxo. A assinatura `by Oli` liga o produto
ao ecossistema sem copiar a identidade visual do OliQualidade.

## Fora do escopo desta fase

- login e cadastro;
- banco de dados e colaboração;
- geração por IA;
- upload e leitura de PDF/livros;
- pagamentos;
- exportação final em PDF ou slides;
- acompanhamento de alunos.

Cada item entra apenas quando o fluxo local básico estiver validado.
