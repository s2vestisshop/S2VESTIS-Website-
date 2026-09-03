/** Route-level loading state shown while a lazy page chunk downloads. */
export function PageFallback() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div
        className="h-7 w-7 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
