# Configurar o Modo Sala (multiplayer)

O Modo Sala permite que o professor crie uma sala com um código de cinco
letras e cada aluno entre pelo próprio celular, de qualquer lugar, para
jogar o quiz de escuta em tempo real com placar ao vivo.

Como o HelenaStudy é uma SPA estática na Vercel (sem servidor tradicional
nem banco de dados), o estado de cada sala precisa ficar em algum lugar
acessível pelos dispositivos de todos os participantes. Usamos o
**Firebase Realtime Database**: o servidor (função na Vercel) é o único que
grava; cada navegador escuta atualizações direto do Firebase por Server-Sent
Events nativos (sem instalar o SDK do Firebase, sem custo de bundle, e sem
polling — a atualização chega na hora). Isso exige um projeto Firebase, que
só pode ser criado por quem tem acesso ao Google Cloud — não pode ser feito
pelo Claude Code.

## 1. Criar (ou reaproveitar) o projeto e ativar o Realtime Database

1. Acesse o [console do Firebase](https://console.firebase.google.com/).
2. Se o projeto Google Cloud que você já usa para o Google Agenda
   (`ideiasteam`, ou o que você tiver criado) ainda não tem o Firebase
   ativado, clique em **Adicionar projeto** e selecione esse projeto
   existente em vez de criar um novo — Firebase e Google Cloud compartilham
   o mesmo projeto por baixo dos panos.
3. No menu lateral, vá em **Build → Realtime Database** e clique em
   **Criar banco de dados**. Escolha a região (`us-central1` é uma opção
   segura) e comece em **modo bloqueado** (vamos definir as regras abaixo).
4. Anote a **URL do banco** mostrada no topo da página (algo como
   `https://SEU-PROJETO-default-rtdb.firebaseio.com`).

## 2. Definir as regras de segurança

Na aba **Regras** do Realtime Database, substitua pelo seguinte e publique:

```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": false
      }
    },
    "private-rooms": {
      ".read": false,
      ".write": false
    }
  }
}
```

- `/rooms/<código>` é a projeção pública da sala (participantes, pergunta
  atual, placar) — qualquer navegador pode **ler**, ninguém pode escrever
  diretamente.
- `/private-rooms/<código>` guarda o estado completo (com o token do
  organizador e as respostas certas) — ninguém lê nem escreve direto por
  aqui, nem autenticado.

O servidor (a função da Vercel) escreve nos dois caminhos usando uma conta
de serviço com privilégio de administrador, que **ignora** essas regras —
por isso elas protegem os dados mesmo assim.

## 3. Criar a conta de serviço

1. No console do Firebase, vá em **Configurações do projeto → Contas de
   serviço**.
2. Clique em **Gerar nova chave privada** e confirme. Um arquivo `.json` é
   baixado — guarde-o com cuidado, ele dá acesso total ao banco.
3. Abra o arquivo. Você vai precisar de dois campos dele:
   - `client_email`
   - `private_key`

## 4. Configurar as variáveis de ambiente na Vercel

No painel do projeto na Vercel (**Settings → Environment Variables**),
nunca num arquivo do repositório:

| Variável                | Valor                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `FIREBASE_DATABASE_URL` | a URL anotada no passo 1                                                                                                       |
| `FIREBASE_CLIENT_EMAIL` | o campo `client_email` do arquivo baixado                                                                                      |
| `FIREBASE_PRIVATE_KEY`  | o campo `private_key` do arquivo baixado, colado como está (com os `\n` literais — o código já converte para quebras de linha) |

Depois de configurar, faça um novo deploy para as variáveis entrarem em
vigor.

## Como funciona por trás

- `POST /api/local-room?action=create` — o professor cria a sala; recebe um
  código de cinco letras, um token de organizador (guardado só no
  navegador dele) e a URL de streaming pública da sala.
- `POST /api/local-room?action=join` — cada aluno entra com o código e um
  nome de exibição, e recebe a mesma URL de streaming.
- O navegador de cada participante conecta direto em
  `https://SEU-PROJETO-default-rtdb.firebaseio.com/rooms/<código>.json`
  usando `EventSource` (API nativa do navegador) e recebe cada atualização
  em tempo real, sem precisar perguntar de novo.
- `POST ?action=start` / `?action=next` / `?action=end` — só o organizador
  pode iniciar a rodada, avançar pergunta ou encerrar (validado pelo token).
- `POST ?action=answer` — cada aluno envia sua resposta; a correção é
  conferida no servidor (o baralho completo com as respostas certas fica só
  em `/private-rooms`, nunca é enviado para o navegador de ninguém).

Cada sala expira sozinha no armazenamento privado depois de 4 horas sem
uso (a projeção pública em `/rooms` não expira sozinha — é só o estado
final de uma sala já encerrada, sem dado sensível, então não tem pressa
para limpar).

## Limitações desta primeira versão

- Só o **quiz de escuta** roda dentro da sala por enquanto (o bingo digital
  ainda não tem um modelo de sincronização definido — fica para uma
  próxima etapa).
