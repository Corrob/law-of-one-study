"use client";

import { Component, ReactNode } from "react";
import posthog from "posthog-js";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 *
 * Prevents the entire app from crashing when a component throws an error.
 * Displays a friendly error message and provides a way to recover.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <ChatInterface />
 * </ErrorBoundary>
 *
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ChatInterface />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Track to PostHog for monitoring
    if (typeof window !== "undefined" && posthog) {
      posthog.capture("error_boundary_triggered", {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 1000),
        component_stack: errorInfo.componentStack?.substring(0, 1000),
        url: window.location.href,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="max-w-md space-y-4">
            <div className="text-[var(--lo1-gold)] text-4xl mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[var(--lo1-starlight)]">
              Something went wrong
            </h2>
            <p className="text-[var(--lo1-text-light)]">
              An unexpected error occurred. This has been logged and we&apos;ll look into it.
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2 bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)] rounded-lg font-medium hover:bg-[var(--lo1-gold-light)] transition-colors"
            >
              Try again
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left text-xs text-[var(--lo1-text-muted)]">
                <summary className="cursor-pointer hover:text-[var(--lo1-text-light)]">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-[var(--lo1-indigo)]/50 rounded overflow-auto max-h-40">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
