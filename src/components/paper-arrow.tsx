export function PaperArrow({ back = false }: { back?: boolean }) {
  return (
    <img
      className={back ? "onboarding-paper-arrow is-back" : "onboarding-paper-arrow"}
      src="/paper-arrow.svg"
      alt=""
    />
  );
}
