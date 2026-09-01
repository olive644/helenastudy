# HelenaStudy

Central de estudos, foco e rotina da marca Oli.

O HelenaStudy reúne agenda, tarefas, hábitos, cronômetro, anotações, digitalizações, escrita à mão,
materiais, flashcards, quizzes, bingo e planejamento de aulas em um único espaço. A base atual
funciona localmente, sem autenticação ou armazenamento remoto. A única integração ativa com IA é a
voz opcional do quiz de escuta, gerada pelo Gemini por uma função segura de servidor.

A fronteira segura da futura Helena inteligente já possui contrato e testes, mas permanece sem
provedor conectado. Consulte [`docs/AI_BACKEND.md`](docs/AI_BACKEND.md) para o fluxo de dados, o
modelo de ameaça e as decisões necessárias antes da ativação.

## Desenvolvimento

### Base de frequência do quiz

O aplicativo não distribui o pacote completo `wordfreq`. Para regenerar o subconjunto inglês
carregado sob demanda pelo quiz, use um ambiente Python isolado:

```bash
pip install wordfreq==3.1.1
python scripts/generate-word-frequency.py
```

Os dados derivados mantêm a atribuição e a licença Apache 2.0 do projeto wordfreq.

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
