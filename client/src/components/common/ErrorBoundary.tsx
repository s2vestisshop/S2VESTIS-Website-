import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
        <p className="font-display text-5xl font-bold text-ink-200">Oops</p>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Something went wrong</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-500">
          An unexpected error occurred while rendering this page.
        </p>
        <div className="mt-8 flex gap-3">
          <button onClick={() => window.location.reload()} className="btn-primary">
            Reload page
          </button>
          <a href="/" className="btn-outline">
            Go home
          </a>
        </div>
      </div>
    );
  }
}
