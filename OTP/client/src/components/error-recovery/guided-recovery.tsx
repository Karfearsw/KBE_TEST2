import React, { useState } from "react";
import { useErrorGuidance } from "@/hooks/use-error-guidance";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RecoveryStep {
  id: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => Promise<boolean> | boolean;
  };
  isUserAction: boolean;
  helpText?: string;
}

interface GuidedRecoveryProps {
  title: string;
  description: string;
  steps: RecoveryStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function GuidedRecoveryFlow({
  title,
  description,
  steps,
  open,
  onOpenChange,
  onComplete,
  onCancel
}: GuidedRecoveryProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelpText, setShowHelpText] = useState<Record<string, boolean>>({});
  
  const { clearError } = useErrorGuidance();
  
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  // Handle next step
  const handleNext = async () => {
    if (currentStep.action) {
      setIsProcessing(true);
      try {
        const result = await currentStep.action.onClick();
        setResults({ ...results, [currentStep.id]: result });
        if (result && currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(currentStepIndex + 1);
        }
      } catch (error) {
        setResults({ ...results, [currentStep.id]: false });
      } finally {
        setIsProcessing(false);
      }
    } else if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };
  
  // Handle complete
  const handleComplete = () => {
    clearError();
    if (onComplete) {
      onComplete();
    }
    onOpenChange(false);
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };
  
  // Toggle help text
  const toggleHelpText = (stepId: string) => {
    setShowHelpText({ ...showHelpText, [stepId]: !showHelpText[stepId] });
  };
  
  // Render step status icon
  const renderStepStatus = (stepId: string) => {
    if (stepId in results) {
      return results[stepId] ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-destructive" />
      );
    }
    return null;
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>
        
        <div className="py-4">
          <Progress value={progress} className="mb-6" />
          
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-medium mb-1">
                  Step {currentStepIndex + 1}: {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground">{currentStep.description}</p>
                
                {currentStep.helpText && (
                  <div className="mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-muted-foreground hover:text-foreground p-0"
                      onClick={() => toggleHelpText(currentStep.id)}
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      {showHelpText[currentStep.id] ? "Hide Help" : "Show Help"}
                    </Button>
                    
                    {showHelpText[currentStep.id] && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
                        {currentStep.helpText}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {renderStepStatus(currentStep.id)}
            </div>
            
            {currentStep.isUserAction && (
              <div className="bg-muted/50 p-3 rounded-md mt-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Please complete this step and click "Next" to continue
                </p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className={cn({
                "opacity-50 pointer-events-none": isProcessing,
              })}
            >
              Cancel
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0 || isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            {currentStepIndex < steps.length - 1 ? (
              <Button
                variant="default"
                size="sm"
                onClick={handleNext}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 ml-1" />
                )}
                {currentStep.action ? currentStep.action.label : "Next"}
              </Button>
            ) : (
              <Button
                variant="default" 
                size="sm"
                onClick={handleComplete}
                disabled={isProcessing}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Predefined recovery flows
export const NetworkConnectivityRecovery = {
  title: "Connection Recovery",
  description: "Follow these steps to restore your connection",
  steps: [
    {
      id: "check-connection",
      title: "Check Internet Connection",
      description: "Please verify your internet connection is working",
      isUserAction: true,
      helpText: "Check your Wi-Fi or Ethernet connection. Try visiting another website to confirm your internet is working.",
    },
    {
      id: "refresh-browser",
      title: "Refresh Your Browser",
      description: "Try refreshing your browser to reconnect to FlipStackk",
      action: {
        label: "Refresh Now",
        onClick: () => {
          window.location.reload();
          return true;
        },
      },
      isUserAction: false,
    },
    {
      id: "clear-cache",
      title: "Clear Browser Cache",
      description: "Clearing your browser cache may resolve connection issues",
      isUserAction: true,
      helpText: "In Chrome: Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac), check 'Cached images and files', and click 'Clear data'.",
    },
  ],
};

export const AuthenticationRecovery = {
  title: "Authentication Recovery",
  description: "Follow these steps to resolve your login issue",
  steps: [
    {
      id: "check-credentials",
      title: "Verify Your Credentials",
      description: "Make sure you're using the correct username and password",
      isUserAction: true,
      helpText: "Case matters in passwords. Make sure Caps Lock is off.",
    },
    {
      id: "re-login",
      title: "Log In Again",
      description: "Your session may have expired. Please log in again.",
      action: {
        label: "Go to Login",
        onClick: () => {
          window.location.href = "/auth";
          return true;
        },
      },
      isUserAction: false,
    },
  ],
};

export const DataEntryRecovery = {
  title: "Form Submission Recovery",
  description: "Follow these steps to fix the form submission issue",
  steps: [
    {
      id: "check-required",
      title: "Check Required Fields",
      description: "Make sure all required fields are filled out correctly",
      isUserAction: true,
      helpText: "Required fields are usually marked with an asterisk (*). Check that email addresses are in the correct format, phone numbers have the right number of digits, etc.",
    },
    {
      id: "check-formatting",
      title: "Verify Data Formatting",
      description: "Ensure your data is formatted correctly (e.g., dates, phone numbers)",
      isUserAction: true,
      helpText: "Dates should be in MM/DD/YYYY format. Phone numbers should include area code. Currency values should not include special characters except for decimal points.",
    },
    {
      id: "retry-submission",
      title: "Try Submitting Again",
      description: "Attempt to submit the form again with the corrected information",
      isUserAction: true,
    },
  ],
};