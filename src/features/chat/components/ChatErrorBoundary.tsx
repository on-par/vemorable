/**
 * ChatErrorBoundary Component
 * 
 * Error boundary specifically designed for the chat feature.
 * Provides graceful error handling and recovery options.
 * 
 * Features:
 * - Catches JavaScript errors in chat components
 * - Displays user-friendly error messages
 * - Provides recovery actions
 * - Logs errors for debugging
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error icon component
 */
const ErrorIcon = () => (
  <svg className="w-16 h-16 mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={1.5} 
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
);

/**
 * Retry button component
 */
const RetryButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    Try Again
  </button>
);

/**
 * Error details component for development
 */
const ErrorDetails = ({ error, errorInfo }: { error: Error; errorInfo: ErrorInfo }) => {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <details className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
      <summary className="cursor-pointer text-sm font-medium text-gray-700">
        Error Details (Development)
      </summary>
      <div className="mt-2 text-xs text-gray-600 space-y-2">
        <div>
          <strong>Error:</strong>
          <pre className="mt-1 whitespace-pre-wrap">{error.toString()}</pre>
        </div>
        <div>
          <strong>Component Stack:</strong>
          <pre className="mt-1 whitespace-pre-wrap">{errorInfo.componentStack}</pre>
        </div>
      </div>
    </details>
  );
};

/**
 * Error fallback UI component
 */
const ErrorFallback = ({ 
  error, 
  errorInfo, 
  onRetry 
}: { 
  error: Error; 
  errorInfo: ErrorInfo; 
  onRetry: () => void;
}) => (
  <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200">
    {/* Header */}
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
    </div>

    {/* Error Content */}
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
      <ErrorIcon />
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Something went wrong
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        The chat encountered an unexpected error. This is usually temporary and can be resolved by refreshing.
      </p>
      
      <div className="flex gap-3">
        <RetryButton onClick={onRetry} />
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Refresh Page
        </button>
      </div>

      <ErrorDetails error={error} errorInfo={errorInfo} />
    </div>
  </div>
);

/**
 * ChatErrorBoundary class component for error handling
 */
class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Error boundary lifecycle method
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('ChatErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  /**
   * Reset error state to retry
   */
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Render method
   */
  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;