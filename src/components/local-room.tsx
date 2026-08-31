import { DoorOpen, Play, Radio, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  addLocalParticipant,
  createLocalRoomCode,
  isValidLocalRoomCode,
  localRoomChannelName,
  sanitizeDisplayName,
  type LocalRoomMessage,
  type LocalRoomSettings,
  type LocalRoomState,
} from "../domain/local-room";

const DEFAULT_SETTINGS: LocalRoomSettings = {
  activity: "listening",
  difficulty: "mixed",
  questionCount: 10,
  timed: false,
};

export function LocalRoom() {
  const [role, setRole] = useState<"choose" | "host" | "participant">("choose");
  const [room, setRoom] = useState<LocalRoomState>();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const channelRef = useRef<BroadcastChannel | undefined>(undefined);

  useEffect(() => () => channelRef.current?.close(), []);

  function connect(roomCode: string, onMessage: (message: LocalRoomMessage) => void) {
    channelRef.current?.close();
    const channel = new BroadcastChannel(localRoomChannelName(roomCode));
    channel.addEventListener("message", (event: MessageEvent<LocalRoomMessage>) =>
      onMessage(event.data),
    );
    channelRef.current = channel;
    return channel;
  }

  function createRoom() {
    const nextRoom: LocalRoomState = {
      code: createLocalRoomCode(),
      phase: "lobby",
      settings: DEFAULT_SETTINGS,
      participants: [],
      questionIndex: 0,
      createdAt: Date.now(),
    };
    setRoom(nextRoom);
    setRole("host");
    connect(nextRoom.code, (message) => {
      if (message.type !== "join") return;
      setRoom((current) => {
        if (!current) return current;
        const updated = addLocalParticipant(current, message.participant);
        channelRef.current?.postMessage({
          type: "state",
          state: updated,
        } satisfies LocalRoomMessage);
        return updated;
      });
    });
  }

  function joinRoom(event: FormEvent) {
    event.preventDefault();
    const roomCode = code.trim().toUpperCase();
    const displayName = sanitizeDisplayName(name);
    if (!isValidLocalRoomCode(roomCode)) {
      setError("Digite um código local válido com cinco caracteres.");
      return;
    }
    if (!displayName) {
      setError("Escolha um nome de exibição.");
      return;
    }
    setError("");
    setRole("participant");
    const participant = { id: crypto.randomUUID(), displayName, score: 0 };
    const channel = connect(roomCode, (message) => {
      if (message.type === "state") setRoom(message.state);
    });
    channel.postMessage({ type: "join", participant } satisfies LocalRoomMessage);
  }

  function updateSettings(settings: Partial<LocalRoomSettings>) {
    setRoom((current) =>
      current ? { ...current, settings: { ...current.settings, ...settings } } : current,
    );
  }

  function publish(state: LocalRoomState) {
    setRoom(state);
    channelRef.current?.postMessage({ type: "state", state } satisfies LocalRoomMessage);
  }

  if (role === "choose")
    return (
      <div className="local-room-intro">
        <Radio size={34} />
        <div>
          <h3>Modo Sala local</h3>
          <p>Sincroniza a atividade entre abas deste navegador. Não funciona pela internet.</p>
        </div>
        <div className="local-room-intro__actions">
          <button className="primary-button" type="button" onClick={createRoom}>
            <Users size={17} /> Criar sala
          </button>
          <button className="secondary-button" type="button" onClick={() => setRole("participant")}>
            <DoorOpen size={17} /> Entrar com código
          </button>
        </div>
      </div>
    );

  if (role === "participant" && !room)
    return (
      <form className="local-room-join" onSubmit={joinRoom}>
        <h3>Entrar em uma sala local</h3>
        <p>
          Abra esta página em outra aba no mesmo dispositivo e use o código mostrado pelo professor.
        </p>
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
        {error && <p role="alert">{error}</p>}
        <button className="primary-button" type="submit">
          Entrar
        </button>
      </form>
    );

  if (!room) return null;
  const isHost = role === "host";
  return (
    <div className="local-room-session">
      <header>
        <div>
          <span>Sala local</span>
          <strong>{room.code}</strong>
        </div>
        <p>
          <Users size={16} /> {room.participants.length} participantes
        </p>
      </header>
      {room.phase === "lobby" ? (
        <>
          {isHost ? (
            <div className="local-room-settings">
              <label>
                <span>Atividade</span>
                <select
                  value={room.settings.activity}
                  onChange={(event) =>
                    updateSettings({
                      activity: event.target.value as LocalRoomSettings["activity"],
                    })
                  }
                >
                  <option value="listening">Quiz de escuta</option>
                  <option value="bingo">Bingo educativo</option>
                </select>
              </label>
              <label>
                <span>Dificuldade</span>
                <select
                  value={room.settings.difficulty}
                  onChange={(event) =>
                    updateSettings({
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
                  value={room.settings.questionCount}
                  onChange={(event) =>
                    updateSettings({
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
              <button
                className="primary-button"
                type="button"
                onClick={() => publish({ ...room, phase: "playing" })}
              >
                <Play size={17} /> Iniciar rodada
              </button>
            </div>
          ) : (
            <div className="local-room-waiting" role="status">
              <Radio size={28} />
              <h3>Aguardando o início</h3>
              <p>O organizador controla esta sala local.</p>
            </div>
          )}
        </>
      ) : room.phase === "playing" ? (
        <div className="local-room-waiting" role="status">
          <Play size={28} />
          <h3>Rodada iniciada</h3>
          <p>
            {room.settings.activity === "listening" ? "Quiz de escuta" : "Bingo educativo"}{" "}
            preparado para sincronização local.
          </p>
          {isHost && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => publish({ ...room, phase: "finished" })}
            >
              Encerrar sala
            </button>
          )}
        </div>
      ) : (
        <div className="local-room-waiting" role="status">
          <X size={28} />
          <h3>Sala encerrada</h3>
          <p>Esta sessão local terminou.</p>
        </div>
      )}
    </div>
  );
}
