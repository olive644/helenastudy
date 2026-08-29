type HelenaBrandProps = {
  compact?: boolean;
};

export function HelenaBrand({ compact = false }: HelenaBrandProps) {
  return (
    <div className="brand" aria-label="HelenaStudy, by Oli">
      <img className="brand__mark" src="/helena.svg" alt="" width="48" height="52" />
      {!compact && (
        <div className="brand__copy">
          <strong>
            Helena<span>Study</span>
          </strong>
          <small>by Oli</small>
        </div>
      )}
    </div>
  );
}
