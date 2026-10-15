import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** Last line of defense: a UI bug shows a friendly recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CodeGames UI error', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // Navigating elsewhere clears the error.
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="level-missing" role="alert">
        <h1>Oops, the game tripped over itself</h1>
        <p>This is a bug in CodeGames, not in your code. Your progress and code are saved.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => this.setState({ error: null })}>
            Try again
          </button>
          <button className="btn" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
        <pre style={{ color: 'var(--text-faint)', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
      </div>
    );
  }
}
