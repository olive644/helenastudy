import { Check, Copy, DoorOpen, Play, Radio, Users, Volume2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  buildLocalRoomJoinUrl,
  rankLocalRoomParticipants,
  type LocalRoomParticipant,
  type LocalRoomSettings,
} from "../domain/local-room";
import { selectFallbackEnglishVoice, speakEnglish } from "../data/speech-voice";
import { useLocalRoom } from "../hooks/use-local-room";
import { NavigationIcon } from "./navigation-icon";
import { RoomQrCode } from "./room-qr-code";

const DEFAULT_SETTINGS: LocalRoomSettings = {
  difficulty: "mixed",
  questionCount: 10,
  roundSeconds: 30,
};

const MEDAL_ICON_BY_RANK = ["medal-first", "medal-second", "medal-third"] as const;

type LocalRoomProps = { initialJoinCode?: string | undefined };

function ShareRoom({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const joinUrl = buildLocalRoomJoinUrl(window.location.href, code);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: a pessoa copia o link à mão.
    }
  }

  return (
    <div className="local-room-share">
      <RoomQrCode value={joinUrl} />
      <div className="local-room-share__link">
        <p>Ou peça para escanear o QR code, ou compartilhe o link direto:</p>
        <button className="secondary-button" type="button" onClick={() => void copyLink()}>
          <Copy size={16} /> {copied ? "Link copiado!" : "Copiar link da sala"}
        </button>
      </div>
    </div>
  );
}

function playQuestionAudio(text: string) {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  speakEnglish(text, {
    voice: selectFallbackEnglishVoice(voices),
    rate: 0.9,
    onUnavailable: () => {},
  });
}

function Scoreboard({ participants }: { participants: readonly LocalRoomParticipant[] }) {
  const ranked = rankLocalRoomParticipants(participants);
  return (
    <ol className="local-room-scoreboard">
      {ranked.map((participant, index) => (
        <li key={participant.id}>
          <span className="local-room-scoreboard__rank">{index + 1}</span>
          <span>{participant.displayName}</span>
          <strong>
            {participant.score} <NavigationIcon name="xp" />
          </strong>
        </li>
      ))}
    </ol>
  );
}

function Podium({ participants }: { participants: readonly LocalRoomParticipant[] }) {
  const ranked = rankLocalRoomParticipants(participants);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);
  return (
    <>
      <ol className="local-room-podium">
        {top3.map((participant, index) => (
          <li
            className={`local-room-podium__place local-room-podium__place--${index + 1}`}
            key={participant.id}
          >
            <NavigationIcon name={MEDAL_ICON_BY_RANK[index]!} />
            <span>{participant.displayName}</span>
            <strong>
              {participant.score} <NavigationIcon name="xp" />
            </strong>
          </li>
        ))}
      </ol>
      {rest.length > 0 && <Scoreboard participants={rest} />}
    </>
  );
}

export function LocalRoom({ initialJoinCode }: LocalRoomProps) {
  const room = useLocalRoom();
  const [code, setCode] = useState(initialJoinCode ?? "");
  const [name, setName] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastResult, setLastResult] = useState<{ correct: boolean; xpChange: number } | undefined>(
    undefined,
  );
  const state = room.state;

  const [appliedJoinCode, setAppliedJoinCode] = useState(false);
  if (initialJoinCode && !appliedJoinCode && room.role === "choose") {
    setAppliedJoinCode(true);
    room.setRole("participant");
  }

  const questionKey = state ? `${state.phase}-${state.questionIndex}` : undefined;
  const [seenQuestionKey, setSeenQuestionKey] = useState(questionKey);
  if (questionKey !== seenQuestionKey) {
    setSeenQuestionKey(questionKey);
    setAnswer("");
    setLastResult(undefined);
  }

  const isPlaying = state?.phase === "playing";
  const questionStartedAt = state?.questionStartedAt ?? 0;
  const roundSeconds = state?.settings.roundSeconds ?? 30;
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, roundSeconds - Math.floor((Date.now() - questionStartedAt) / 1000)),
  );

  // Só o navegador do organizador tenta avançar a rodada quando o tempo
  // acaba — ninguém tem um botão para pular antes disso. Quando todo mundo
  // já respondeu, o próprio servidor avança sozinho (submitRoomAnswer); o
  // "advancing" evita pedidos repetidos enquanto um já está a caminho, e o
  // intervalo de 500ms tenta de novo sozinho se o primeiro pedido falhar
  // por uma pequena diferença entre o relógio do navegador e o do servidor.
  useEffect(() => {
    if (!isPlaying) return;
    let advancing = false;
    const tick = () => {
      const remaining = Math.max(
        0,
        roundSeconds - Math.floor((Date.now() - questionStartedAt) / 1000),
      );
      setSecondsLeft(remaining);
      if (remaining === 0 && room.isHost && !advancing) {
        advancing = true;
        void room.nextQuestion().finally(() => {
          advancing = false;
        });
      }
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, questionStartedAt, roundSeconds, room.isHost]);

  function joinRoom(event: FormEvent) {
    event.preventDefault();
    void room.joinRoom(code, name);
  }

  async function submitAnswer(event: FormEvent) {
    event.preventDefault();
    if (!state?.currentQuestion || !answer.trim()) return;
    const result = await room.submitAnswer(state.questionIndex, answer);
    setLastResult(result);
  }

  if (room.role === "choose")
    return (
      <div className="local-room-intro">
        <Radio size={34} />
        <div>
          <h3>Modo Sala</h3>
          <p>Cada aluno entra pelo próprio celular com um código de cinco letras.</p>
        </div>
        <div className="local-room-intro__actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => void room.createRoom(DEFAULT_SETTINGS)}
          >
            <Users size={17} /> Criar sala
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => room.setRole("participant")}
          >
            <DoorOpen size={17} /> Entrar com código
          </button>
        </div>
        {room.error && <p role="alert">{room.error}</p>}
      </div>
    );

  if (room.role === "participant" && !state)
    return (
      <form className="local-room-join" onSubmit={joinRoom}>
        <h3>Entrar em uma sala</h3>
        <p>Peça o código de cinco letras para o professor e digite seu nome.</p>
        <label>
          <span>Código</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={5}
          />
        </label>
        <label>
          <span>Nome de exibição</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} />
        </label>
        {room.error && <p role="alert">{room.error}</p>}
        <button className="primary-button" type="submit">
          Entrar
        </button>
      </form>
    );

  if (!state) return null;
  const isHost = room.isHost;
  const answered = state.answeredParticipantIds.includes(room.participantId);

  return (
    <div className="local-room-session">
      <header>
        <div>
          <span>Sala</span>
          <strong>{state.code}</strong>
        </div>
        <p>
          <Users size={16} /> {state.participants.length} participantes
        </p>
      </header>

      {state.phase === "lobby" ? (
        isHost ? (
          <div className="local-room-settings">
            <ShareRoom code={state.code} />
            <label>
              <span>Dificuldade</span>
              <select
                value={state.settings.difficulty}
                onChange={(event) =>
                  void room.updateSettings({
                    difficulty: event.target.value as LocalRoomSettings["difficulty"],
                  })
                }
              >
                <option value="mixed">Misto</option>
                <option value="easy">Fácil</option>
                <option value="medium">Médio</option>
                <option value="hard">Difícil</option>
              </select>
            </label>
            <label>
              <span>Perguntas</span>
              <select
                value={state.settings.questionCount}
                onChange={(event) =>
                  void room.updateSettings({
                    questionCount:
                      event.target.value === "all"
                        ? "all"
                        : (Number(event.target.value) as 5 | 10 | 15),
                  })
                }
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="all">Todas</option>
              </select>
            </label>
            <label>
              <span>Tempo por pergunta</span>
              <select
                value={state.settings.roundSeconds}
                onChange={(event) =>
                  void room.updateSettings({
                    roundSeconds: Number(event.target.value) as LocalRoomSettings["roundSeconds"],
                  })
                }
              >
                <option value="15">15s</option>
                <option value="30">30s</option>
                <option value="45">45s</option>
                <option value="60">60s</option>
              </select>
            </label>
            {state.participants.length > 0 && <Scoreboard participants={state.participants} />}
            <button
              className="primary-button"
              type="button"
              disabled={state.participants.length === 0}
              onClick={() => void room.startRound()}
            >
              <Play size={17} /> Iniciar rodada
            </button>
            {room.error && <p role="alert">{room.error}</p>}
          </div>
        ) : (
          <div className="local-room-waiting" role="status">
            <Radio size={28} />
            <h3>Aguardando o início</h3>
            <p>O organizador controla esta sala. Código: {state.code}</p>
          </div>
        )
      ) : state.phase === "playing" && state.currentQuestion ? (
        <div className="local-room-round">
          <div className="local-room-round__progress">
            <span>
              Pergunta {state.questionIndex + 1} de {state.totalQuestions}
            </span>
            <span className="local-room-round__timer">
              <NavigationIcon name="timer" /> {secondsLeft}s
            </span>
          </div>
          {isHost ? (
            <>
              <div className="local-room-round__host-question">
                <Volume2 size={20} />
                <span>{state.currentQuestion.front}</span>
              </div>
              <p>
                {state.answeredParticipantIds.length} de {state.participants.length} já responderam
                — a rodada passa sozinha quando todo mundo responder ou o tempo acabar.
              </p>
              <Scoreboard participants={state.participants} />
              <button
                className="secondary-button"
                type="button"
                onClick={() => void room.endRoom()}
              >
                Encerrar sala
              </button>
            </>
          ) : answered ? (
            <div className="local-room-waiting" role="status">
              {lastResult?.correct ? <Check size={28} /> : <Radio size={28} />}
              <h3>{lastResult?.correct ? "Boa! Resposta certa." : "Resposta enviada."}</h3>
              {lastResult && lastResult.xpChange !== 0 && (
                <p className="local-room-xp-feedback">
                  <NavigationIcon name="xp" /> {lastResult.xpChange > 0 ? "+" : ""}
                  {lastResult.xpChange} XP
                </p>
              )}
              <p>Aguardando a próxima pergunta.</p>
            </div>
          ) : (
            <form className="local-room-answer" onSubmit={submitAnswer}>
              <button
                className="secondary-button"
                type="button"
                onClick={() => playQuestionAudio(state.currentQuestion!.front)}
              >
                <Volume2 size={18} /> Ouvir de novo
              </button>
              <label>
                <span>Digite a tradução</span>
                <input
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  autoFocus
                />
              </label>
              <button className="primary-button" type="submit">
                Responder
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="local-room-finished">
          <div className="local-room-waiting" role="status">
            <NavigationIcon name="medal-first" />
            <h3>Sala encerrada</h3>
          </div>
          <Podium participants={state.participants} />
          <button className="secondary-button" type="button" onClick={room.reset}>
            <X size={16} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
