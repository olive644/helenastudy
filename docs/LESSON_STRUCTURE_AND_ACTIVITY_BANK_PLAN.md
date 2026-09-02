# Plano: estrutura de aula completa + banco de atividades

Este documento formaliza as anotações manuscritas sobre estrutura de aula (Aim/Objective,
Warm Up, Presentation, Practice, Extra Activity, Production, Homework) e o banco de atividades
classificadas (Total Controlled / Semi Controlled), para integrar ao módulo **Planos de aula**
(`lesson-plans`, hoje "available" em `src/product/module-catalog.ts`).

Não substitui o roadmap geral (`docs/IMPLEMENTATION_ROADMAP.md`); detalha a evolução de um módulo
que já existe.

## 1. O que as notas pedem

- **Aim vs Objective**: hoje `LessonInput`/`LessonDraft` (`src/domain/lesson.ts`) só tem
  `objective`. As notas separam **Aim** (o que a aula representa, a intenção pedagógica) de
  **Objective** (o que o aluno consegue fazer, na prática, ao final — o critério observável).
- **Estrutura de aula** mais rica que as 5 seções fixas atuais:
  - Warm Up
  - Presentation — já mapeado em `Methodology` (`inductive`/`deductive`/`discovery`/`rule-first`)
  - Practice — hoje é uma seção única; as notas pedem **sub-atividades tipadas**:
    Activity 01 (Book), Activity 02 (Total Controlled), Activity 03 (Semi Controlled)
  - Extra Activity — atividade "tapa-buraco" para sobra de tempo, sem contrapartida hoje
  - Production — hoje é texto livre; as notas nomeiam variantes: Product Pitch, Creative Task,
    Problem Solving
  - Homework — hoje existe como seção; falta anexar PDF para impressão e links de apoio
- **Banco de atividades** classificadas por controle:
  - **Total Controlled (TC)**: Bingo, Swat, Mimic, Swatters, Labels and Images, What's Missing,
    Chinese Whispers, Singing
  - **Semi Controlled (SC)**: This or That, Draw, Dictation Draw, Like or Dislike,
    RolePlay Variation
  - Cada atividade é descrita por **Time, Topic, Steps, Goal, Supplies, Links** — os mesmos
    seis campos, sempre.

## 2. Modelo de domínio proposto

Novo arquivo `src/domain/activity-bank.ts`, ao lado de `lesson.ts`:

```ts
export const CONTROL_LEVELS = ["total-controlled", "semi-controlled"] as const;
export type ControlLevel = (typeof CONTROL_LEVELS)[number];

export type ActivityDefinition = {
  id: string;
  name: string;
  controlLevel: ControlLevel;
  time: number; // minutos
  topic: string;
  steps: string[];
  goal: string;
  supplies: string[];
  links: string[];
};
```

Um catálogo inicial (`ACTIVITY_LIBRARY: ActivityDefinition[]`) com as 13 atividades das notas,
como dados estáticos versionados — mesmo padrão de `module-catalog.ts`: literal tipado, sem
banco de dados nesta fase.

## 3. Mudanças em `lesson.ts` / `create-lesson-draft.ts`

- `LessonInput.objective` → mantém, mas passa a existir também `aim: string` (intenção da aula,
  opcional; o objective continua sendo o critério observável — o formulário já pede as duas
  coisas com rótulos e ajuda diferentes).
- `LessonSectionKind` ganha `"extra-activity"` entre `"practice"` e `"production"`.
- `LessonSection` para a seção `practice` passa a carregar uma lista opcional de atividades
  referenciadas do banco (`activityIds: string[]`), permitindo Activity 01/02/03 com
  Book/TC/SC — sem quebrar `guidance`, que continua como fallback textual quando nenhuma
  atividade é escolhida.
- `production` ganha um subtipo (`"product-pitch" | "creative-task" | "problem-solving"`) que
  ajusta o `guidance` gerado, análogo a como `methodology` já ajusta a seção de apresentação.
- `homework` ganha campos opcionais `printableUrl?: string` (PDF) e `links: string[]`.

`createLessonDraft` continua determinístico: sem IA, sem heurística nova além da já existente em
`allocateMinutes`; as atividades e links entram por seleção do usuário, não por geração.

## 4. Interface (`lesson-builder-view.tsx`)

Ordem de entrega, cada uma uma PR pequena e testável:

1. **Aim/Objective separados** no formulário, com um `<textarea>` a mais e ajuda contextual
   explicando a diferença (texto das notas: "representa o que ensinar" vs "o que o Ss faz").
2. **Seletor de atividades no Practice**: três slots (Book, TC, SC), cada um abrindo uma lista
   filtrável do banco por `controlLevel`; ao escolher, mostra Time/Topic/Steps/Goal/Supplies/Links
   no preview, sem digitação livre.
3. **Extra Activity**: card opcional, mesma lista do banco, com aviso "só aparece se sobrar
   tempo" — não entra no somatório de `allocateMinutes` por padrão.
4. **Production com variante**: troca o textarea livre por um seletor das três variantes citadas
   nas notas, cada uma com uma frase-guia própria (sem inventar texto genérico).
5. **Homework com PDF e links**: campo de upload/anexo de PDF (reaproveitando a digitalização
   local já disponível em `notes-view`) e lista de links, exibidos no preview e exportáveis
   junto do plano.
6. **Banco de atividades como tela própria**: nova entrada em `PRODUCT_MODULES`
   (`id: "activity-bank"`, status inicial `"foundation"`), listando as 13 atividades com filtro
   por TC/SC e pelos seis campos de classificação; o Practice/Extra Activity da tela de plano de
   aula passam a consumir esse catálogo em vez de duplicar dados.

## 5. Onde entra no roadmap

Isto é uma extensão da **Fase 1** (`lesson-plans` já "available"), não uma fase nova. Critério de
saída: Aim/Objective, Practice com atividades do banco, Extra Activity, Production com variante e
Homework com PDF/links funcionando com persistência local e testes — mesmo contrato das outras
entregas (`docs/IMPLEMENTATION_ROADMAP.md`, seção "Contrato por pull request").

## 6. Fora de escopo por agora

- Atividades geradas por IA (isso é `helena-ai`, Fase 8, e exige consentimento explícito já
  documentado).
- Banco de atividades editável pelo usuário (nesta fase o catálogo é fixo e versionado no
  código; edição/curadoria pelo usuário vira item futuro do próprio banco).
