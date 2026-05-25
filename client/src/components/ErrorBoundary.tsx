import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error);
    // כאן בעתיד: Sentry.captureException(error)
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback)  return this.props.fallback;

    return (
      <motion.div
        dir="rtl"
        className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-5xl">⚽</span>
        <h2 className="text-xl font-bold text-white">משהו השתבש</h2>
        <p className="text-gray-400 text-sm">
          אנחנו על זה. נסה לרענן את הדף.
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          className="mt-2 px-6 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-500 transition"
        >
          נסה שוב
        </button>
      </motion.div>
    );
  }
}

export default ErrorBoundary;
