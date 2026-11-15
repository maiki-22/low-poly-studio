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
      <strong>We couldn’t load this information</strong>
      <p>{message}</p>
      <button type="button" className="soft-button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function DataLoading() {
  return (
    <div
      className="data-skeleton"
      role="status"
      aria-label="Loading environmental data"
    >
      <span className="skeleton skeleton-pill" />
      <span className="skeleton skeleton-number" />
      <span className="skeleton skeleton-copy" />
      <div className="skeleton skeleton-chart" />
      <span className="sr-only">Loading environmental data…</span>
    </div>
  );
}
