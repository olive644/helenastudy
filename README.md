# HelenaStudy

Central de estudos, foco e rotina da marca Oli.

O HelenaStudy reúne agenda, tarefas, hábitos, cronômetro, anotações, materiais, flashcards,
questionários e planejamento de aulas em um único espaço. A base atual funciona localmente e não
possui autenticação, integração com IA ou armazenamento remoto.

A fronteira segura da futura Helena inteligente já possui contrato e testes, mas permanece sem
provedor conectado. Consulte [`docs/AI_BACKEND.md`](docs/AI_BACKEND.md) para o fluxo de dados, o
modelo de ameaça e as decisões necessárias antes da ativação.

## Desenvolvimento

Requer Node.js 24 ou superior.

```bash
npm ci
npm run dev
```

## Verificação completa

```bash
npm run verify
```

O contexto do produto e as decisões técnicas ficam em
[`docs/SECOND_BRAIN.md`](docs/SECOND_BRAIN.md).

O [mapa mental do produto](docs/PRODUCT_MIND_MAP.md) conecta todas as áreas planejadas. O
[roadmap de implementação](docs/IMPLEMENTATION_ROADMAP.md) separa as entregas em fases e registra
quando uma biblioteca ou linguagem adicional pode ser avaliada.
