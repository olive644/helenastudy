import { Check, Gauge, Play, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Flashcard } from "../domain/workspace";
import {
  acceptedListeningAnswers,
  buildListeningDeck,
  normalizeListeningAnswer,
  type ListeningCard,
} from "../domain/listening-quiz";
import { classifyWordDifficulty, type WordDifficulty } from "../data/word-difficulty";
import { rankEnglishVoices, SPEECH_RATE_OPTIONS, speakEnglish } from "../data/speech-voice";

type RoundState = "ready" | "countdown" | "answering" | "feedback" | "finished";
type DifficultyFilter = "mixed" | WordDifficulty;

const DIFFICULTY_LABELS: Record<DifficultyFilter, string> = {
  mixed: "Misto",
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export function ListeningQuiz({ flashcards }: { flashcards: readonly Flashcard[] }) {
  const initialDeck = useMemo(() => buildListeningDeck(flashcards), [flashcards]);
  const [deck, setDeck] = useState(initialDeck);
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<RoundState>("ready");
  const [countdown, setCountdown] = useState(3);
  const [answer, setAnswer] = useState("");
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<ListeningCard[]>([]);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("mixed");
  const [difficultyById, setDifficultyById] = useState<Record<string, WordDifficulty>>({});
  const [classifying, setClassifying] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState("");
  const [speechRate, setSpeechRate] = useState(0.86);
  const answerRef = useRef<HTMLInputElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | undefined>(undefined);
  const card = deck[index];
  const selectedVoice = voices.find((voice) => voice.voiceURI === voiceUri) ?? voices[0];

  useEffect(() => {
    if (state !== "countdown") return;
    const timer = window.setTimeout(() => {
      if (countdown <= 1) setState("answering");
      else setCountdown((value) => value - 1);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [countdown, state]);

  useEffect(() => {
    if (state === "answering") answerRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => {
      const ranked = rankEnglishVoices(window.speechSynthesis.getVoices());
      setVoices(ranked);
      setVoiceUri((current) => current || ranked[0]?.voiceURI || "");
    };
    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all(
      initialDeck.map(
        async (item) => [item.id, (await classifyWordDifficulty(item.front)).difficulty] as const,
      ),
    ).then((entries) => {
      if (!active) return;
      setDifficultyById(Object.fromEntries(entries));
      setClassifying(false);
    });
    return () => {
      active = false;
    };
  }, [initialDeck]);

  function playAudio() {
    if (!card) return;
    setAudioUnavailable(false);
    utteranceRef.current = speakEnglish(card.front, {
      voice: selectedVoice,
      rate: speechRate,
      onUnavailable: () => setAudioUnavailable(true),
    });
  }

  function beginRound() {
    setAnswer("");
    setWasCorrect(false);
    setCountdown(3);
    setState("countdown");
    playAudio();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!card || !answer.trim()) return;
    const accepted = acceptedListeningAnswers(card).includes(normalizeListeningAnswer(answer));
    setWasCorrect(accepted);
    if (accepted) setCorrect((value) => value + 1);
    else setMissed((items) => [...items, card]);
    setState("feedback");
  }

  function nextRound() {
    if (index + 1 >= deck.length) {
      setState("finished");
      return;
    }
    setIndex((value) => value + 1);
    setState("ready");
  }

  function restart(cards = initialDeck) {
    window.speechSynthesis?.cancel();
    setDeck(cards);
    setIndex(0);
    setCorrect(0);
    setMissed([]);
    setAnswer("");
    setState("ready");
  }

  function selectDifficulty(filter: DifficultyFilter) {
    const cards =
      filter === "mixed"
        ? initialDeck
        : initialDeck.filter((item) => difficultyById[item.id] === filter);
    if (cards.length === 0) return;
    setDifficultyFilter(filter);
    restart(cards);
  }

  function countDifficulty(filter: WordDifficulty): number {
    return initialDeck.filter((item) => difficultyById[item.id] === filter).length;
  }

  if (!card) return null;

  if (state === "finished") {
    return (
      <div className="listening-finish" role="status">
        <span className="listening-finish__score">
          {correct}/{deck.length}
        </span>
        <div>
          <span className="section-label">Sessão concluída</span>
          <h3>{missed.length === 0 ? "Você reconheceu todas!" : "Boa prática. Vamos reforçar?"}</h3>
          <p>
            {missed.length === 0
              ? "Seu ouvido acompanhou todo o vocabulário desta rodada."
              : `${missed.length} ${missed.length === 1 ? "termo precisa" : "termos precisam"} de mais uma escuta.`}
          </p>
        </div>
        <div className="listening-finish__actions">
          {missed.length > 0 && (
            <button className="primary-button" type="button" onClick={() => restart(missed)}>
              <RotateCcw size={17} /> Repetir erros
            </button>
          )}
          <button className="secondary-button" type="button" onClick={() => restart()}>
            Nova sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`listening-quiz is-${state}`}>
      <div className="listening-topline">
        <span>
          Escuta {index + 1} de {deck.length}
        </span>
        <span>{correct} acertos</span>
      </div>

      {state === "ready" && (
        <div className="listening-controls">
          <div className="listening-difficulty" aria-label="Dificuldade do vocabulário">
            {(Object.keys(DIFFICULTY_LABELS) as DifficultyFilter[]).map((filter) => {
              const count = filter === "mixed" ? initialDeck.length : countDifficulty(filter);
              return (
                <button
                  className={difficultyFilter === filter ? "is-active" : undefined}
                  type="button"
                  disabled={classifying || count === 0}
                  aria-pressed={difficultyFilter === filter}
                  onClick={() => selectDifficulty(filter)}
                  key={filter}
                >
                  {DIFFICULTY_LABELS[filter]} <small>{classifying ? "…" : count}</small>
                </button>
              );
            })}
          </div>
          <div className="listening-voice-controls">
            <label>
              <Volume2 size={15} aria-hidden="true" />
              <span>Voz</span>
              <select value={voiceUri} onChange={(event) => setVoiceUri(event.target.value)}>
                {voices.length === 0 ? (
                  <option value="">Voz do navegador</option>
                ) : (
                  voices.map((voice) => (
                    <option value={voice.voiceURI} key={voice.voiceURI}>
                      {voice.name.replace(/Microsoft|Google/g, "").trim()}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              <Gauge size={15} aria-hidden="true" />
              <span>Ritmo</span>
              <select
                value={speechRate}
                onChange={(event) => setSpeechRate(Number(event.target.value))}
              >
                {SPEECH_RATE_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {state === "countdown" ? (
        <div className="listening-stage listening-stage--countdown" aria-live="polite">
          <span className="listening-digital">{countdown || "•"}</span>
          <small>{countdown ? "Prepare sua resposta" : "Agora responda"}</small>
        </div>
      ) : state === "feedback" ? (
        <div
          className={`listening-stage listening-stage--feedback ${wasCorrect ? "is-correct" : "is-wrong"}`}
          aria-live="polite"
        >
          <span className="listening-result-icon">
            <Check size={30} />
          </span>
          <small>{wasCorrect ? "Você reconheceu" : "Resposta correta"}</small>
          <strong>{card.front}</strong>
          <p>{card.back}</p>
          <button className="listening-next" type="button" onClick={nextRound}>
            {index + 1 === deck.length ? "Ver resultado" : "Próxima escuta"}
          </button>
        </div>
      ) : (
        <div className="listening-stage">
          <button
            className="listening-speaker"
            type="button"
            onClick={playAudio}
            aria-label="Ouvir novamente"
          >
            <Volume2 size={30} />
          </button>
          {state === "ready" ? (
            <>
              <span className="section-label">Quiz de pronúncia</span>
              <h3>Ouça e descubra a palavra.</h3>
              <p>
                Nível {DIFFICULTY_LABELS[difficultyFilter].toLocaleLowerCase("pt-BR")}. A resposta
                pode ser em português ou em inglês.
              </p>
              <button className="primary-button" type="button" onClick={beginRound}>
                <Play size={17} /> Iniciar escuta
              </button>
            </>
          ) : (
            <form className="listening-answer" onSubmit={submit}>
              <label htmlFor="listening-answer">O que você ouviu?</label>
              <div>
                <input
                  ref={answerRef}
                  id="listening-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  autoComplete="off"
                  required
                />
                <button type="submit">Confirmar</button>
              </div>
            </form>
          )}
          {audioUnavailable && (
            <p className="listening-audio-note" role="alert">
              Este navegador não oferece voz. Use outro navegador ou leia a dica: começa com “
              {card.front.charAt(0)}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
