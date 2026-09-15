import { useEffect, useRef, useState } from "react";
import { HelenaLoading } from "../components/helena-loading";
import { PaperArrow } from "../components/onboarding-paper-icon";

async function prepareGoogle() {
  const apiKey = import.meta.env["VITE_FIREBASE_API_KEY"];
  const authDomain = import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"];
  const projectId = import.meta.env["VITE_FIREBASE_PROJECT_ID"];
  if (!apiKey || !authDomain || !projectId) throw new Error("setup");
  const [{ initializeApp, getApps }, auth] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);
  const app =
    getApps().find((item) => item.name === "helena-account") ??
    initializeApp({ apiKey, authDomain, projectId }, "helena-account");
  const provider = new auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return () => auth.signInWithPopup(auth.getAuth(app), provider);
}

function googleLoginError(cause: unknown): string {
  const code = cause && typeof cause === "object" && "code" in cause ? cause.code : "";
  if (code === "auth/popup-closed-by-user")
    return "A janela foi fechada. Você pode tentar novamente.";
  if (code === "auth/popup-blocked")
    return "Permita a janela de login no navegador e tente novamente.";
  if (code === "auth/network-request-failed") return "Confira sua conexão e tente novamente.";
  return "Não foi possível entrar agora. Tente novamente em instantes.";
}

export function GoogleLogin({
  answers,
  onFinish,
  onBack,
}: {
  answers: string[];
  onFinish: () => void;
  onBack: () => void;
}) {
  const [start, setStart] = useState<Awaited<ReturnType<typeof prepareGoogle>>>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    void prepareGoogle()
      .then((login) => {
        if (active) setStart(() => login);
      })
      .catch(() => {
        if (active) setError("O login está sendo preparado. Tente novamente mais tarde.");
      });
    return () => {
      active = false;
    };
  }, []);
  async function login() {
    if (!start || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await start();
      try {
        localStorage.setItem("helena.onboarding.v1", JSON.stringify({ answers, completed: true }));
      } catch {
        /* Login remains valid when browser storage is unavailable. */
      }
      onFinish();
    } catch (cause) {
      setError(googleLoginError(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <section aria-label="Entrar na HelenaStudy">
      <h2>Vamos começar?</h2>
      <p>Use sua conta Google para entrar na HelenaStudy.</p>
      <p>Seus estudos continuam salvos neste dispositivo.</p>
      {(busy || (!start && !error)) && (
        <HelenaLoading compact label={busy ? "Aguardando o Google…" : "Preparando seu login…"} />
      )}
      {error && <p role="alert">{error}</p>}
      <div className="onboarding__actions">
        <button type="button" disabled={busy} onClick={onBack}>
          <PaperArrow back />
          Voltar
        </button>
        <button type="button" disabled={!start || busy} onClick={() => void login()}>
          Entrar com Google
          <PaperArrow />
        </button>
      </div>
    </section>
  );
}
