import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  WifiOff,
  ShieldAlert,
  BookX,
  ServerCrash,
  DatabaseBackup,
  FileWarning,
  BugPlay
} from "lucide-react";
import { useErrorGuidance } from "@/hooks/use-error-guidance";
import { ErrorAlert, ErrorGuidanceCard } from "@/components/ui/error-guidance";
import { GuidedRecoveryFlow, NetworkConnectivityRecovery, AuthenticationRecovery, DataEntryRecovery } from "./guided-recovery";

/**
 * This component is for demonstration purposes to showcase the error recovery features
 */
export function ErrorRecoveryDemo() {
  const { setError, clearError, currentError } = useErrorGuidance();
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);
  const [recoveryType, setRecoveryType] = useState<"network" | "auth" | "form">("network");
  
  // Set up recovery flow config based on type
  const recoveryFlowConfig = {
    network: NetworkConnectivityRecovery,
    auth: AuthenticationRecovery,
    form: DataEntryRecovery
  };
  
  // Trigger different error types for demonstration
  const triggerError = (type: string) => {
    switch (type) {
      case "network":
        setError("Unable to connect to the server", "network", {
          severity: "medium",
          recoverySteps: [
            "Check your internet connection",
            "Try refreshing the page",
            "Contact support if the issue persists"
          ],
          showToast: true
        });
        break;
      case "auth":
        setError("Your session has expired", "authentication", {
          severity: "medium",
          recoverySteps: ["Please log in again"],
          showToast: true
        });
        break;
      case "permission":
        setError("You don't have permission to access this resource", "permission", {
          severity: "high",
          recoverySteps: ["Contact your administrator to request access"],
          showToast: true
        });
        break;
      case "notFound":
        setError("The requested lead was not found", "notFound", {
          severity: "low",
          recoverySteps: [
            "The lead may have been deleted",
            "Check if you have the correct ID"
          ],
          showToast: true
        });
        break;
      case "server":
        setError("Server error occurred", "server", {
          severity: "high",
          recoverySteps: [
            "This is a temporary issue",
            "Please try again later",
            "Our team has been notified"
          ],
          showToast: true
        });
        break;
      case "database":
        setError("Database connection error", "database", {
          severity: "critical",
          recoverySteps: ["Please try again later"],
          showToast: true
        });
        break;
      case "validation":
        setError("Invalid input data", "validation", {
          severity: "low",
          recoverySteps: ["Please check your input and try again"],
          showToast: true
        });
        break;
      case "crash":
        throw new Error("Simulated application crash for error boundary testing");
      default:
        setError("An unknown error occurred", "unknown", {
          severity: "medium",
          showToast: true
        });
    }
  };
  
  // Launch guided recovery flow
  const launchRecovery = (type: "network" | "auth" | "form") => {
    setRecoveryType(type);
    setShowRecoveryFlow(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Recovery Demonstration</CardTitle>
        <CardDescription>
          This tool demonstrates the intuitive error recovery guidance system.
          Select different error types to see how the system handles them.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="errors">
          <TabsList className="mb-4">
            <TabsTrigger value="errors">Error Types</TabsTrigger>
            <TabsTrigger value="recovery">Recovery Flows</TabsTrigger>
            <TabsTrigger value="current">Current Error</TabsTrigger>
          </TabsList>
          
          <TabsContent value="errors" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("network")}
              >
                <WifiOff className="h-6 w-6 text-amber-500" />
                <span>Network Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("auth")}
              >
                <ShieldAlert className="h-6 w-6 text-amber-500" />
                <span>Auth Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("permission")}
              >
                <ShieldAlert className="h-6 w-6 text-red-500" />
                <span>Permission Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("notFound")}
              >
                <BookX className="h-6 w-6 text-amber-500" />
                <span>Not Found</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("server")}
              >
                <ServerCrash className="h-6 w-6 text-red-500" />
                <span>Server Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("database")}
              >
                <DatabaseBackup className="h-6 w-6 text-red-500" />
                <span>Database Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("validation")}
              >
                <FileWarning className="h-6 w-6 text-amber-500" />
                <span>Validation Error</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => triggerError("crash")}
              >
                <BugPlay className="h-6 w-6 text-red-500" />
                <span>App Crash</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="recovery" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => launchRecovery("network")}
              >
                <WifiOff className="h-6 w-6 text-primary" />
                <span>Network Recovery</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => launchRecovery("auth")}
              >
                <ShieldAlert className="h-6 w-6 text-primary" />
                <span>Auth Recovery</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-auto flex flex-col items-center justify-center gap-2 p-4"
                onClick={() => launchRecovery("form")}
              >
                <FileWarning className="h-6 w-6 text-primary" />
                <span>Form Recovery</span>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="current">
            {currentError ? (
              <div className="space-y-4">
                <ErrorGuidanceCard
                  title={`Error: ${currentError.type}`}
                  description={currentError.message}
                  errorType={currentError.type}
                  severity={currentError.severity}
                  onDismiss={clearError}
                  solutions={
                    currentError.recoverySteps
                      ? currentError.recoverySteps.map((step, index) => ({
                          title: `Solution ${index + 1}`,
                          description: step,
                        }))
                      : []
                  }
                />
              </div>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted" />
                <h3 className="text-lg font-medium mb-1">No Active Errors</h3>
                <p>Trigger an error from the Error Types tab to see it displayed here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t p-4 gap-2">
        <Button variant="ghost" onClick={clearError}>
          Clear All Errors
        </Button>
      </CardFooter>
      
      {/* Guided Recovery Flow Dialog */}
      <GuidedRecoveryFlow
        open={showRecoveryFlow}
        onOpenChange={setShowRecoveryFlow}
        {...recoveryFlowConfig[recoveryType]}
        onComplete={() => setShowRecoveryFlow(false)}
      />
    </Card>
  );
}