import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">Erro Inesperado</h2>
            <p className="text-sm text-neutral-500 mb-6">Ocorreu um erro ao renderizar esta página. Tente recarregar.</p>
            {this.state.error && (
              <pre className="bg-neutral-100 rounded-lg p-3 mb-6 text-xs text-left text-red-700 overflow-auto max-h-32">{this.state.error.message}</pre>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl flex items-center gap-2 transition text-sm">
                <RefreshCw className="w-4 h-4" /> Tentar Novamente
              </button>
              <button onClick={() => window.location.href = '/dashboard'} className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold rounded-xl transition text-sm">
                Ir para Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
