import React, { ComponentType, useCallback } from 'react';
import { useErrorGuidance } from '@/hooks/use-error-guidance';
import { ErrorType, ErrorSeverity } from '@/components/ui/error-guidance';
import { GuidedRecoveryFlow, NetworkConnectivityRecovery, AuthenticationRecovery } from './guided-recovery';

// Properties that will be injected into wrapped components
export interface WithErrorHandlingProps {
  handleError: (
    error: any,
    options?: {
      context?: string;
      severity?: ErrorSeverity;
      recoverySteps?: string[];
      showRecoveryFlow?: boolean;
    }
  ) => void;
  clearError: () => void;
  isErrorActive: boolean;
}

/**
 * Higher-order component that provides error handling capabilities to any component
 * 
 * @param WrappedComponent The component to wrap with error handling
 * @returns A new component with error handling props injected
 */
export function withErrorHandling<P extends WithErrorHandlingProps>(
  WrappedComponent: ComponentType<P>
) {
  // Return a new component with the same props plus error handling
  const WithErrorHandling = (props: Omit<P, keyof WithErrorHandlingProps>) => {
    const { setError, clearError, currentError } = useErrorGuidance();
    const [showRecoveryFlow, setShowRecoveryFlow] = React.useState(false);
    const [recoveryType, setRecoveryType] = React.useState<'network' | 'auth'>('network');
    
    // Recovery flows configuration
    const recoveryFlows = {
      network: NetworkConnectivityRecovery,
      auth: AuthenticationRecovery
    };
    
    // Function to determine appropriate recovery flow type
    const determineRecoveryType = (errorType: ErrorType): 'network' | 'auth' => {
      if (errorType === 'authentication') return 'auth';
      return 'network'; // Default to network for most issues
    };
    
    // Error handler function that will be passed to the wrapped component
    const handleError = useCallback((
      error: any,
      options?: {
        context?: string;
        severity?: ErrorSeverity;
        recoverySteps?: string[];
        showRecoveryFlow?: boolean;
      }
    ) => {
      // Determine error type from the error object if available
      const errorType: ErrorType = error.errorType || 'unknown';
      
      // Set the error in the global error state
      setError(
        error.message || 'An unexpected error occurred',
        errorType,
        {
          severity: options?.severity || error.severity || 'medium',
          context: options?.context,
          originalError: error,
          recoverySteps: options?.recoverySteps,
          showToast: true
        }
      );
      
      // Optionally show a recovery flow
      if (options?.showRecoveryFlow) {
        setRecoveryType(determineRecoveryType(errorType));
        setShowRecoveryFlow(true);
      }
      
    }, [setError]);
    
    // Pass all the props to the wrapped component along with our error handling props
    const errorHandlingProps: WithErrorHandlingProps = {
      handleError,
      clearError,
      isErrorActive: !!currentError,
    };
    
    return (
      <>
        <WrappedComponent
          {...(props as P)}
          {...errorHandlingProps}
        />
        
        {/* Recovery flow dialog */}
        <GuidedRecoveryFlow 
          open={showRecoveryFlow}
          onOpenChange={setShowRecoveryFlow}
          {...recoveryFlows[recoveryType]}
          onComplete={() => {
            setShowRecoveryFlow(false);
            clearError();
          }}
        />
      </>
    );
  };
  
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithErrorHandling.displayName = `withErrorHandling(${displayName})`;
  
  return WithErrorHandling;
}