# Configurar o Modo Sala (multiplayer)

O Modo Sala permite que o professor crie uma sala com um código de cinco
letras e cada aluno entre pelo próprio celular, de qualquer lugar, para
jogar o quiz de escuta em tempo real com placar ao vivo.

Como o HelenaStudy é uma SPA estática na Vercel (sem servidor tradicional
nem banco de dados), o estado de cada sala precisa ficar em algum lugar
acessível pelos dispositivos de todos os participantes — não dá para usar só
o navegador de uma pessoa como no modo anterior. Isso exige um banco de
dados chave-valor (Redis) conectado ao projeto na Vercel, que só pode ser
criado por quem tem acesso ao painel — não pode ser feito pelo Claude Code.

## 1. Criar o banco de dados na Vercel

1. Acesse o [painel do projeto `helenastudy` na Vercel](https://vercel.com/meuludi/helenastudy).
2. Vá na aba **Storage**.
3. Clique em **Create Database** e escolha **Upstash — Redis** (aparece no
   Marketplace da Vercel; tem um plano gratuito que é mais do que suficiente
   para o uso do Modo Sala).
4. Siga o assistente de criação. Na etapa de conectar a um projeto, conecte
   ao projeto `helenastudy` no ambiente **Production** (e também
   **Preview**, se quiser testar em PRs).

## 2. Conferir as variáveis de ambiente

Ao conectar o banco, a Vercel adiciona automaticamente as variáveis de
ambiente do projeto. Confira em **Settings → Environment Variables** se
alguma destas combinações apareceu (o nome exato varia um pouco conforme a
integração):

- `KV_REST_API_URL` e `KV_REST_API_TOKEN`, **ou**
- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

O código já lê qualquer uma das duas combinações, então não precisa
renomear nada — só confirmar que uma delas está presente em **Production**.

## 3. Novo deploy

Depois de conectar o banco, um novo deploy é necessário para as variáveis
de ambiente entrarem em vigor (a Vercel geralmente já dispara um deploy
automático ao conectar um Storage; se não disparar, faça um redeploy manual
pelo painel).

## Como funciona por trás

- `POST /api/local-room?action=create` — o professor cria a sala; recebe um
  código de cinco letras e um token de organizador (guardado só no
  navegador dele, nunca exposto aos alunos).
- `POST /api/local-room?action=join` — cada aluno entra com o código e um
  nome de exibição.
- `GET /api/local-room?action=state&code=XXXXX` — todo mundo consulta o
  estado da sala a cada ~1,5s (participantes, pergunta atual, placar).
- `POST ?action=start` / `?action=next` / `?action=end` — só o organizador
  pode iniciar a rodada, avançar pergunta ou encerrar (validado pelo token).
- `POST ?action=answer` — cada aluno envia sua resposta; a correção é
  conferida no servidor (o baralho completo com as respostas certas nunca é
  enviado para o navegador de ninguém, só o texto da palavra atual).

Cada sala expira sozinha no banco depois de 4 horas sem uso, então não
acumula lixo.

## Limitações desta primeira versão

- Só o **quiz de escuta** roda dentro da sala por enquanto (o bingo digital
  ainda não tem um modelo de sincronização definido — fica para uma
  próxima etapa).
- Sincronização por consulta periódica (polling a cada 1,5s), não é
  instantânea como um WebSocket — para uma atividade de sala de aula isso é
  imperceptível na prática.
