import React, { createContext, useState, useContext, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { ErrorType, ErrorSeverity } from "@/components/ui/error-guidance";

interface ErrorState {
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
  context?: string;
  originalError?: any;
  timestamp: number;
  recoverySteps?: string[];
}

interface ErrorGuidanceContextType {
  currentError: ErrorState | null;
  setError: (
    message: string,
    type: ErrorType,
    options?: {
      severity?: ErrorSeverity;
      context?: string;
      originalError?: any;
      recoverySteps?: string[];
      showToast?: boolean;
    }
  ) => void;
  clearError: () => void;
  addRecoveryStep: (step: string) => void;
}

const ErrorGuidanceContext = createContext<ErrorGuidanceContextType | null>(null);

export function ErrorGuidanceProvider({ children }: { children: React.ReactNode }) {
  const [currentError, setCurrentError] = useState<ErrorState | null>(null);
  const { toast } = useToast();

  // Set an error with type and recovery guidance
  const setError = useCallback(
    (
      message: string,
      type: ErrorType,
      options?: {
        severity?: ErrorSeverity;
        context?: string;
        originalError?: any;
        recoverySteps?: string[];
        showToast?: boolean;
      }
    ) => {
      const newError: ErrorState = {
        message,
        type,
        severity: options?.severity || "medium",
        context: options?.context,
        originalError: options?.originalError,
        timestamp: Date.now(),
        recoverySteps: options?.recoverySteps || [],
      };

      setCurrentError(newError);

      // Optionally show a toast with the error
      if (options?.showToast) {
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      }

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("[Error Guidance]", newError);
      }
    },
    [toast]
  );

  // Clear the current error
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Add a recovery step to the current error
  const addRecoveryStep = useCallback((step: string) => {
    setCurrentError((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recoverySteps: [...(prev.recoverySteps || []), step],
      };
    });
  }, []);

  return (
    <ErrorGuidanceContext.Provider
      value={{
        currentError,
        setError,
        clearError,
        addRecoveryStep,
      }}
    >
      {children}
    </ErrorGuidanceContext.Provider>
  );
}

export function useErrorGuidance() {
  const context = useContext(ErrorGuidanceContext);

  if (!context) {
    throw new Error("useErrorGuidance must be used within an ErrorGuidanceProvider");
  }

  return context;
}

// Helper functions for common errors
export function useErrorHandlers() {
  const { setError } = useErrorGuidance();
  const mapNetworkError = useCallback(
    (error: any) => {
      if (!navigator.onLine) {
        setError("No internet connection", "network", {
          severity: "medium",
          recoverySteps: [
            "Check your internet connection",
            "Try again when you're back online",
          ],
          originalError: error,
        });
        return;
      }

      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        setError("Unable to connect to the server", "network", {
          severity: "medium",
          recoverySteps: [
            "Check your internet connection",
            "The server might be down temporarily",
            "Try again in a few minutes",
          ],
          originalError: error,
        });
        return;
      }

      // Handle based on status codes
      const status = error.status || error.response?.status;
      if (status) {
        switch (status) {
          case 401:
            setError("You need to log in again", "authentication", {
              severity: "medium",
              recoverySteps: ["Your session has expired", "Please log in again"],
              originalError: error,
            });
            break;
          case 403:
            setError("You don't have permission to perform this action", "permission", {
              severity: "medium",
              recoverySteps: [
                "Contact your administrator if you need access",
                "Make sure you have the correct role",
              ],
              originalError: error,
            });
            break;
          case 404:
            setError("The requested resource was not found", "notFound", {
              severity: "low",
              recoverySteps: [
                "Check if the URL is correct",
                "The item may have been deleted",
              ],
              originalError: error,
            });
            break;
          case 422:
            setError("Invalid input data", "validation", {
              severity: "low",
              recoverySteps: ["Please check your input and try again"],
              originalError: error,
            });
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            setError("Server error", "server", {
              severity: "high",
              recoverySteps: [
                "This is a temporary server issue",
                "Please try again later",
                "If the problem persists, contact support",
              ],
              originalError: error,
            });
            break;
          default:
            setError(`Unexpected error (code: ${status})`, "unknown", {
              severity: "medium",
              originalError: error,
            });
        }
        return;
      }

      // Generic error fallback
      setError("An unexpected error occurred", "unknown", {
        severity: "medium",
        originalError: error,
      });
    },
    [setError]
  );

  const handleQueryError = useCallback(
    (error: any, context?: string) => {
      let errorType: ErrorType = "unknown";
      let severity: ErrorSeverity = "medium";
      let message = error.message || "An unexpected error occurred";
      let recoverySteps: string[] = ["Please try again"];

      if (message.includes("Network Error") || !navigator.onLine) {
        errorType = "network";
        message = "Network connection error";
        recoverySteps = [
          "Check your internet connection",
          "Ensure you're connected to the network",
          "Try again when online",
        ];
      } else if (message.includes("Unauthorized") || message.includes("401")) {
        errorType = "authentication";
        message = "Your session has expired";
        recoverySteps = ["Please log in again to continue"];
      } else if (message.includes("Permission") || message.includes("403")) {
        errorType = "permission";
        message = "You don't have permission for this action";
        recoverySteps = ["Contact your administrator to request access"];
      } else if (message.includes("not found") || message.includes("404")) {
        errorType = "notFound";
        severity = "low";
        message = "The requested item was not found";
        recoverySteps = [
          "The item may have been deleted or moved",
          "Check if the information is correct",
        ];
      } else if (message.includes("timeout") || message.includes("timed out")) {
        errorType = "network";
        message = "Request timed out";
        recoverySteps = [
          "The server is taking too long to respond",
          "Try again in a few moments",
          "If this persists, contact support",
        ];
      }

      setError(message, errorType, {
        severity,
        context,
        recoverySteps,
        originalError: error,
        showToast: true,
      });
    },
    [setError]
  );

  return {
    mapNetworkError,
    handleQueryError,
  };
}

// Helper to be used with React Query's onError
export function createQueryErrorHandler(
  context: string,
  customHandler?: (error: any) => void
) {
  return (error: any) => {
    const { handleQueryError } = useErrorHandlers();
    
    if (customHandler) {
      customHandler(error);
    } else {
      handleQueryError(error, context);
    }
  };
}