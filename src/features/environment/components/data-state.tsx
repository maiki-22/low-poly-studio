export function DataError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="data-state data-error" role="alert">
      <span className="state-symbol">!</span>
      <strong>No pudimos cargar esta información</strong>
      <p>{message}</p>
      <button type="button" className="soft-button" onClick={onRetry}>
        Volver a intentar
      </button>
    </div>
  );
}

export function DataLoading() {
  return (
    <div
      className="data-skeleton"
      role="status"
      aria-label="Cargando datos ambientales"
    >
      <span className="skeleton skeleton-pill" />
      <span className="skeleton skeleton-number" />
      <span className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-chart" />
      <span className="sr-only">Cargando datos ambientales…</span>
    </div>
  );
}
