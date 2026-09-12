type HelenaLoadingProps = {
  label?: string;
  compact?: boolean;
};

export function HelenaLoading({
  label = "Preparando seu espaço…",
  compact = false,
}: HelenaLoadingProps) {
  return (
    <div
      className={`helena-loading${compact ? " helena-loading--compact" : ""}`}
      role="status"
      aria-live="polite"
    >
      <img src="/helena-loading.svg" alt="" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
