import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorGuidanceCard, FullPageError } from "@/components/ui/error-guidance";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnRouteChange?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary component that catches JavaScript errors anywhere in its child component tree
 * and displays a fallback UI instead of crashing the whole app
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log the error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo);
    }
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Otherwise, use our default error UI
      return (
        <FullPageError
          title="Something went wrong"
          description="We've encountered an unexpected error. Our team has been notified."
          errorType="unknown"
          severity="high"
          onRetry={this.resetErrorBoundary}
          solutions={[
            {
              title: "Try reloading the page",
              description: "This often resolves temporary issues",
              action: {
                label: "Reload Page",
                onClick: () => {
                  window.location.reload();
                  return true;
                },
              },
            },
            {
              title: "Return to dashboard",
              description: "Go back to the main dashboard",
              action: {
                label: "Go to Dashboard",
                onClick: () => {
                  window.location.href = "/";
                  return true;
                },
              },
            },
          ]}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Creates a component-level error boundary specifically for sections or widgets
 */
export function ComponentErrorBoundary({
  children,
  title = "Component Error",
  description = "There was a problem loading this component",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <ErrorGuidanceCard
          title={title}
          description={description}
          errorType="unknown"
          severity="medium"
          onRetry={() => window.location.reload()}
          solutions={[
            {
              title: "Refresh this component",
              description: "Reload to try again",
              action: {
                label: "Refresh",
                onClick: () => {
                  window.location.reload();
                  return true;
                },
              },
            },
          ]}
        >
          <div className="flex justify-center gap-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </ErrorGuidanceCard>
      }
    >
      {children}
    </ErrorBoundary>
  );
}