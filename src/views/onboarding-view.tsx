import { useEffect, useRef, useState } from "react";
import { OnboardingPaperIcon } from "../components/onboarding-paper-icon";
import { PaperArrow } from "../components/paper-arrow";
import "./onboarding.css";
import { GoogleLogin } from "./google-login";

const questions = [
  {
    title: "Em que fase dos estudos você está?",
    hint: "Cada jornada tem seu próprio ritmo.",
    icon: "library",
    options: [
      "Ensino fundamental",
      "Ensino médio",
      "Ensino superior",
      "Estudo por conta própria",
      "Sou professor",
    ],
  },
  {
    title: "Qual matéria desperta sua curiosidade?",
    hint: "Escolha sua favorita para começar.",
    icon: "notes",
    options: [
      "Línguas",
      "Matemática",
      "Ciências",
      "História e geografia",
      "Artes e tecnologia",
      "Ainda estou descobrindo",
    ],
  },
  {
    title: "Qual idioma você quer praticar?",
    hint: "O aplicativo continua em português. Esta é sua preferência de estudo.",
    icon: "learn",
    options: ["Inglês", "Português", "Espanhol", "Outro idioma", "Não é meu foco agora"],
  },
  {
    title: "O que você quer conquistar?",
    hint: "Vamos guardar seu objetivo, sem pressão.",
    icon: "habits",
    options: [
      "Criar uma rotina",
      "Revisar para provas",
      "Aprender algo novo",
      "Praticar com minha turma",
    ],
  },
  {
    title: "Quanto tempo cabe no seu dia?",
    hint: "Um pouco de cada vez também faz diferença.",
    icon: "focus",
    options: ["5 minutos", "15 minutos", "30 minutos", "Prefiro decidir a cada dia"],
  },
] as const;

const onboardingIconNames = [
  ["school", "book", "graduate", "compass", "teacher"],
  ["chat", "calculator", "science", "globe", "art", "compass"],
  ["flag-us", "flag-br", "flag-es", "globe", "pause"],
  ["calendar", "exam", "bulb", "group"],
  ["clock-5", "clock-15", "clock-30", "calendar"],
] as const;

export default function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showLogin, setShowLogin] = useState(() =>
    new URLSearchParams(window.location.search).has("login"),
  );
  const title = useRef<HTMLHeadingElement>(null);
  const question = questions[step];
  const poseIndex = question ? step : 3;
  const poseDescriptions = [
    "Helena lendo um livro roxo",
    "Helena pensativa segurando um lápis",
    "Helena acenando com balões de conversa",
    "Helena comemorando com estrelas",
    "Helena segurando um relógio roxo com as duas patinhas",
  ];
  useEffect(() => {
    if (step >= questions.length - 1) return;
    const nextPose = new Image();
    nextPose.src =
      step === 3 ? "/helena-onboarding-step-5-v3.webp" : `/helena-onboarding-step-${step + 2}.webp`;
  }, [step]);
  useEffect(() => {
    title.current?.focus();
  }, [step]);

  if (showLogin)
    return <GoogleLogin answers={answers} onFinish={onFinish} onBack={() => setShowLogin(false)} />;

  return (
    <main className="onboarding" id="main-content">
      <header className="onboarding__header">
        <span className="onboarding__brand">
          Helena<span>Study</span>
        </span>
        <span className="onboarding__eyebrow">UM COMEÇO DO SEU JEITO</span>
      </header>
      <section className="onboarding__form">
        <div className="onboarding__progress">
          <p aria-live="polite">
            {question ? `Passo ${step + 1} de ${questions.length}` : "Tudo pronto para começar"}
          </p>
          <progress
            value={question ? step + 1 : questions.length}
            max={questions.length}
            aria-label="Progresso do onboarding"
          />
        </div>
        <div className="onboarding__conversation">
          <div className="onboarding__bubble">
            <h1 ref={title} tabIndex={-1}>
              {question?.title ?? "Sua jornada tem a sua cara."}
            </h1>
            <p>
              {question?.hint ??
                "Entre com Google para continuar. Suas preferências ficam neste dispositivo; seus estudos ainda não são sincronizados na nuvem."}
            </p>
          </div>
          <img
            src={
              poseIndex === 4
                ? "/helena-onboarding-step-5-v3.webp"
                : `/helena-onboarding-step-${poseIndex + 1}.webp`
            }
            alt={poseDescriptions[poseIndex]}
            width={640}
            height={640}
            decoding="async"
            className="onboarding__helena"
          />
        </div>
        <div className="onboarding__answers">
          {showLogin ? (
            <GoogleLogin answers={answers} onFinish={onFinish} onBack={() => setShowLogin(false)} />
          ) : (
            <>
              {question ? (
                <fieldset className="onboarding__choices">
                  <legend className="sr-only">{question.title}</legend>
                  {question.options.map((option, index) => (
                    <label key={option} className={answers[step] === option ? "is-selected" : ""}>
                      <input
                        type="radio"
                        name={`step-${step}`}
                        checked={answers[step] === option}
                        onChange={() =>
                          setAnswers((previous) => {
                            const next = [...previous];
                            next[step] = option;
                            return next;
                          })
                        }
                      />
                      <OnboardingPaperIcon name={onboardingIconNames[step]?.[index] ?? "compass"} />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <ul className="onboarding__summary">
                  {answers.map((answer, index) => (
                    <li key={index}>{answer}</li>
                  ))}
                </ul>
              )}
              <div className="onboarding__actions">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep((value) => value - 1)}
                >
                  <PaperArrow back /> Voltar
                </button>
                {question ? (
                  <button
                    type="button"
                    disabled={!answers[step]}
                    onClick={() => setStep((value) => value + 1)}
                  >
                    Continuar <PaperArrow />
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowLogin(true)}>
                    Entrar com Google
                    <PaperArrow />
                  </button>
                )}
              </div>
            </>
          )}
          <p className="onboarding__privacy">Só o necessário para conhecer seu jeito de estudar.</p>
        </div>
      </section>
    </main>
  );
}
