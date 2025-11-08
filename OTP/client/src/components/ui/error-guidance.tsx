import React from "react";
import {
  AlertTriangle,
  HelpCircle,
  X,
  ArrowRight,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type ErrorType = 
  | "network" 
  | "authentication" 
  | "permission" 
  | "validation" 
  | "notFound" 
  | "server" 
  | "database" 
  | "input" 
  | "unknown";

export type ErrorSeverity = "low" | "medium" | "high" | "critical";

export interface ErrorGuidanceProps {
  title: string;
  description: string;
  errorType: ErrorType;
  severity?: ErrorSeverity;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  solutions?: Array<{
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
}

/**
 * Simple inline error message with suggestion
 */
export function ErrorMessage({
  message,
  suggestion,
  className,
}: {
  message: string;
  suggestion?: string;
  className?: string;
}) {
  return (
    <div className={cn("text-destructive text-sm mt-1", className)}>
      <span>{message}</span>
      {suggestion && (
        <span className="block text-muted-foreground text-xs mt-0.5">
          <Lightbulb className="inline-block h-3 w-3 mr-1" />
          {suggestion}
        </span>
      )}
    </div>
  );
}

/**
 * Error alert with recovery options
 */
export function ErrorAlert({
  title,
  description,
  errorType,
  severity = "medium",
  className,
  onDismiss,
  onRetry,
}: ErrorGuidanceProps) {
  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "relative",
        {
          "border-amber-500": severity === "low",
          "border-red-500": severity === "critical",
        },
        className
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-sm">{description}</AlertDescription>
      
      <div className="flex gap-2 mt-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Try Again
          </Button>
        )}
        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Dismiss
          </Button>
        )}
      </div>
      
      {onDismiss && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="absolute top-3 right-3 h-7 w-7 p-0" 
          onClick={onDismiss}
        >
          <span className="sr-only">Dismiss</span>
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </Alert>
  );
}

/**
 * Detailed error card with guidance steps
 */
export function ErrorGuidanceCard({
  title,
  description,
  errorType,
  severity = "medium",
  children,
  className,
  onDismiss,
  onRetry,
  solutions = [],
}: ErrorGuidanceProps) {
  return (
    <Card className={cn("border-destructive", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            <CardTitle>{title}</CardTitle>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {children}
        
        {solutions.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-2">Suggested Solutions</h4>
            <Accordion type="single" collapsible className="w-full">
              {solutions.map((solution, index) => (
                <AccordionItem key={index} value={`solution-${index}`}>
                  <AccordionTrigger className="text-sm py-2">
                    {solution.title}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      {solution.description}
                    </p>
                    {solution.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={solution.action.onClick}
                        className="mt-1"
                      >
                        {solution.action.label}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-1">
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Try Again
            </Button>
          )}
          <Button variant="link" size="sm" className="text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            Get Help
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Full page error with recovery guidance
 */
export function FullPageError({
  title,
  description,
  errorType,
  severity = "medium",
  onRetry,
  solutions = [],
}: ErrorGuidanceProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        {solutions.length > 0 && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Suggested Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div key={index} className="rounded-md border p-3">
                    <h3 className="font-medium mb-1">{solution.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {solution.description}
                    </p>
                    {solution.action && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={solution.action.onClick}
                        className="w-full justify-center"
                      >
                        {solution.action.label}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="flex gap-2 justify-center">
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}