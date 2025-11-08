import React from "react";
import { Lightbulb, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Provides inline contextual help for form fields
 */
export function FormFieldGuidance({
  isError,
  isValid,
  message,
  suggestion,
  className,
}: {
  isError?: boolean;
  isValid?: boolean;
  message: string;
  suggestion?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-sm mt-1 transition-all",
        {
          "text-destructive animate-pulse": isError,
          "text-green-500": isValid,
          "text-muted-foreground": !isError && !isValid,
        },
        className
      )}
    >
      <div className="flex items-start">
        {isError && <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 translate-y-0.5" />}
        {isValid && <Check className="h-4 w-4 mr-1 flex-shrink-0 translate-y-0.5" />}
        {!isError && !isValid && <Lightbulb className="h-4 w-4 mr-1 flex-shrink-0 translate-y-0.5" />}
        <span>{message}</span>
      </div>
      
      {suggestion && (
        <div className="mt-1 pl-5 text-xs">
          {suggestion}
        </div>
      )}
    </div>
  );
}

/**
 * Password strength meter with guidelines
 */
export function PasswordStrengthGuidance({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  // Password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  // Calculate strength
  const criteria = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar];
  const meetsCount = criteria.filter(Boolean).length;
  
  // Determine strength level
  let strengthLevel: "weak" | "medium" | "strong" = "weak";
  let strengthText = "Weak password";
  
  if (meetsCount >= 4) {
    strengthLevel = "strong";
    strengthText = "Strong password";
  } else if (meetsCount >= 3) {
    strengthLevel = "medium";
    strengthText = "Medium password";
  }
  
  return (
    <div className={cn("mt-2", className)}>
      <div className="space-y-2">
        <div className="flex-1 mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium">Password strength</span>
            <span 
              className={cn("text-xs font-medium", {
                "text-red-500": strengthLevel === "weak",
                "text-amber-500": strengthLevel === "medium",
                "text-green-500": strengthLevel === "strong",
              })}
            >
              {strengthText}
            </span>
          </div>
          
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all", {
                "w-1/3 bg-red-500": strengthLevel === "weak",
                "w-2/3 bg-amber-500": strengthLevel === "medium",
                "w-full bg-green-500": strengthLevel === "strong",
              })}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-1">
          <Requirement met={hasMinLength}>At least 8 characters</Requirement>
          <Requirement met={hasUppercase}>Contains uppercase letter</Requirement>
          <Requirement met={hasLowercase}>Contains lowercase letter</Requirement>
          <Requirement met={hasNumber}>Contains a number</Requirement>
          <Requirement met={hasSpecialChar}>Contains a special character</Requirement>
        </div>
      </div>
    </div>
  );
}

/**
 * Password requirement item
 */
function Requirement({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center text-xs gap-1.5", {
      "text-muted-foreground": !met,
      "text-green-500": met,
    })}>
      {met ? (
        <Check className="h-3 w-3" />
      ) : (
        <div className="h-3 w-3 border rounded-full" />
      )}
      {children}
    </div>
  );
}

/**
 * Text input validation state component
 */
export function InputValidationState({
  value,
  pattern,
  validator,
  emptyMessage = "Required",
  invalidMessage,
  validMessage,
  showWhenEmpty = false,
}: {
  value: string;
  pattern?: RegExp;
  validator?: (value: string) => boolean;
  emptyMessage?: string;
  invalidMessage?: string;
  validMessage?: string;
  showWhenEmpty?: boolean;
}) {
  // Empty state
  if (!value) {
    if (showWhenEmpty) {
      return (
        <FormFieldGuidance 
          message={emptyMessage}
        />
      );
    }
    return null;
  }
  
  // Validation check
  let isValid = true;
  
  if (pattern) {
    isValid = pattern.test(value);
  }
  
  if (validator) {
    isValid = validator(value);
  }
  
  return (
    <FormFieldGuidance 
      isError={!isValid}
      isValid={isValid}
      message={isValid ? validMessage || "Valid" : invalidMessage || "Invalid format"}
    />
  );
}

/**
 * Shows specific formatting help for common input types
 */
export function InputFormatGuide({
  type,
  className,
}: {
  type: "phone" | "email" | "date" | "currency" | "zipcode" | "creditcard";
  className?: string;
}) {
  const formatExamples = {
    phone: {
      label: "Phone Number",
      example: "(555) 123-4567",
      guidance: "Include area code and format as (XXX) XXX-XXXX"
    },
    email: {
      label: "Email",
      example: "name@example.com",
      guidance: "Use a valid email format with @ symbol and domain"
    },
    date: {
      label: "Date",
      example: "MM/DD/YYYY",
      guidance: "Enter date in MM/DD/YYYY format"
    },
    currency: {
      label: "Currency",
      example: "1,234.56",
      guidance: "Use numbers only, decimal point for cents"
    },
    zipcode: {
      label: "ZIP Code",
      example: "12345 or 12345-6789",
      guidance: "5-digit ZIP or 9-digit ZIP+4 with hyphen"
    },
    creditcard: {
      label: "Credit Card",
      example: "XXXX XXXX XXXX XXXX",
      guidance: "16 digits, optionally grouped in sets of 4"
    }
  };
  
  const format = formatExamples[type];
  
  return (
    <div className={cn("bg-muted/40 rounded-md p-2 text-xs text-muted-foreground", className)}>
      <div className="font-medium mb-1">{format.label} Format</div>
      <div className="flex items-center gap-2">
        <span>Example:</span>
        <code className="bg-muted px-1 py-0.5 rounded text-foreground">{format.example}</code>
      </div>
      <div className="mt-1">{format.guidance}</div>
    </div>
  );
}