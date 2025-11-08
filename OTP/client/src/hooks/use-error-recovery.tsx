import React, { useState } from 'react';
import { useErrorGuidance } from './use-error-guidance';
import { ErrorType } from '@/components/ui/error-guidance';
import { 
  GuidedRecoveryFlow, 
  NetworkConnectivityRecovery, 
  AuthenticationRecovery,
  DataEntryRecovery
} from '@/components/error-recovery';
import { useToast } from './use-toast';

type RecoveryFlowType = 'network' | 'auth' | 'form';

/**
 * Hook that provides error recovery flows for handling different error types
 */
export function useErrorRecovery() {
  const { setError, clearError, currentError } = useErrorGuidance();
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);
  const [recoveryType, setRecoveryType] = useState<RecoveryFlowType>('network');
  const { toast } = useToast();
  
  // Recovery flow configurations
  const recoveryFlows = {
    network: NetworkConnectivityRecovery,
    auth: AuthenticationRecovery,
    form: DataEntryRecovery
  };
  
  // Map error type to appropriate recovery flow
  const determineRecoveryFlow = (errorType: ErrorType): RecoveryFlowType => {
    switch (errorType) {
      case 'authentication':
        return 'auth';
      case 'validation':
      case 'input':
        return 'form';
      case 'network':
      case 'server':
      case 'notFound':
      case 'database':
      default:
        return 'network';
    }
  };
  
  // Show recovery flow
  const showRecovery = (type: RecoveryFlowType = 'network') => {
    setRecoveryType(type);
    setShowRecoveryFlow(true);
  };
  
  // Handle error with optional recovery flow
  const handleErrorWithRecovery = (
    error: any, 
    options?: {
      context?: string;
      showToast?: boolean;
      launchRecoveryFlow?: boolean;
    }
  ) => {
    // Determine error type
    const errorType: ErrorType = error.errorType || 'unknown';
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // Set the error in the global error context
    setError(errorMessage, errorType, {
      severity: error.severity || 'medium',
      context: options?.context,
      originalError: error,
      showToast: options?.showToast
    });
    
    // Show toast notification if requested
    if (options?.showToast) {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    // Automatically launch recovery flow if requested
    if (options?.launchRecoveryFlow) {
      const flowType = determineRecoveryFlow(errorType);
      showRecovery(flowType);
    }
    
    return error;
  };
  
  // Create a React Query onError handler function
  const createQueryErrorHandler = (
    context: string,
    options?: {
      showToast?: boolean;
      launchRecoveryFlow?: boolean;
    }
  ) => {
    return (error: any) => {
      return handleErrorWithRecovery(error, {
        context,
        showToast: options?.showToast !== false, // Default to true
        launchRecoveryFlow: options?.launchRecoveryFlow,
      });
    };
  };
  
  // Recovery flow component
  const RecoveryFlowDialog = () => (
    <GuidedRecoveryFlow
      open={showRecoveryFlow}
      onOpenChange={setShowRecoveryFlow}
      {...recoveryFlows[recoveryType]}
      onComplete={() => {
        setShowRecoveryFlow(false);
        clearError();
      }}
      onCancel={() => {
        setShowRecoveryFlow(false);
      }}
    />
  );
  
  return {
    // Core functions
    handleError: handleErrorWithRecovery,
    clearError,
    showRecovery,
    
    // Helper functions
    createQueryErrorHandler,
    
    // State
    hasError: !!currentError,
    currentError,
    
    // Components
    RecoveryFlowDialog,
  };
}