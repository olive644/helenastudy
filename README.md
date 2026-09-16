# HelenaStudy

Central de estudos, foco e rotina da marca Oli.

O HelenaStudy reúne agenda, tarefas, hábitos, cronômetro, anotações, digitalizações, escrita à mão,
materiais, flashcards, quizzes, bingo e planejamento de aulas em um único espaço. A base atual
mantém o workspace pessoal no dispositivo, sem conta. O Modo Sala usa Firebase Realtime Database
para sincronizar participantes e rodadas entre dispositivos. A única integração ativa com IA é a
voz opcional do quiz de escuta, gerada pelo Gemini por uma função segura de servidor.

A fronteira segura da futura Helena inteligente já possui contrato e testes, mas permanece sem
provedor conectado. Consulte [`docs/AI_BACKEND.md`](docs/AI_BACKEND.md) para o fluxo de dados, o
modelo de ameaça e as decisões necessárias antes da ativação.

## Licença

Software proprietário. Todos os direitos reservados — veja [`LICENSE`](LICENSE). O código está
visível neste repositório para fins de desenvolvimento e revisão, mas nenhuma cópia, modificação,
distribuição ou uso comercial é permitido sem autorização prévia e por escrito do titular.

## Desenvolvimento

Requer Node.js 24 ou superior.

```bash
npm ci
npm run dev
```

Em produção, configure `GEMINI_API_KEY` somente no ambiente da Vercel. A chave nunca deve usar o
prefixo `VITE_` nem ser enviada ao navegador. Sem a variável, o quiz recorre automaticamente à voz
instalada no dispositivo.

## Verificação completa

```bash
npm run verify
```

O contexto do produto e as decisões técnicas ficam em
[`docs/SECOND_BRAIN.md`](docs/SECOND_BRAIN.md).

O [mapa mental do produto](docs/PRODUCT_MIND_MAP.md) conecta todas as áreas planejadas. O
[roadmap de implementação](docs/IMPLEMENTATION_ROADMAP.md) separa as entregas em fases e registra
quando uma biblioteca ou linguagem adicional pode ser avaliada.
