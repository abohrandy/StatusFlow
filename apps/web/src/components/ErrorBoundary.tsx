import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Production ErrorBoundary Captured Exception]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
            ⚠️
          </div>
          <h1 className="text-xl font-bold text-white">Application Runtime Error</h1>
          <p className="text-xs text-zinc-400 max-w-md">An unexpected UI exception occurred. The incident has been logged for system monitoring.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-zinc-950 font-semibold text-xs rounded-xl shadow-lg shadow-emerald-500/20"
          >
            Reload StatusFlow Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
