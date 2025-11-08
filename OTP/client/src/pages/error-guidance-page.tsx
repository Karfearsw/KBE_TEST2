import React from "react";
import { 
  ErrorRecoveryDemo,
  ComponentErrorBoundary,
} from "@/components/error-recovery";
import {
  ErrorAlert,
  ErrorGuidanceCard,
  ErrorMessage,
} from "@/components/ui/error-guidance";
import {
  FormFieldGuidance,
  PasswordStrengthGuidance,
  InputValidationState,
  InputFormatGuide,
} from "@/components/error-recovery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useErrorGuidance } from "@/hooks/use-error-guidance";
import { useState } from "react";

export default function ErrorGuidancePage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { setError, clearError } = useErrorGuidance();
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Recovery Guidance</h1>
        <p className="text-muted-foreground">
          This page demonstrates the intuitive error recovery guidance system for FlipStackk.
        </p>
      </div>
      
      <Tabs defaultValue="demo">
        <TabsList className="mb-6">
          <TabsTrigger value="demo">Error Demo</TabsTrigger>
          <TabsTrigger value="form">Form Guidance</TabsTrigger>
          <TabsTrigger value="components">UI Components</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo">
          <ComponentErrorBoundary>
            <ErrorRecoveryDemo />
          </ComponentErrorBoundary>
        </TabsContent>
        
        <TabsContent value="form" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Validation & Guidance</CardTitle>
              <CardDescription>
                Examples of form field validation with real-time feedback and guidance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                  <PasswordStrengthGuidance password={password} />
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                  <InputValidationState 
                    value={email}
                    pattern={/^[^\s@]+@[^\s@]+\.[^\s@]+$/}
                    invalidMessage="Please enter a valid email address"
                    validMessage="Valid email format"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                  <InputValidationState 
                    value={phone}
                    pattern={/^\(\d{3}\) \d{3}-\d{4}$/}
                    invalidMessage="Please enter a valid phone format (XXX) XXX-XXXX"
                    validMessage="Valid phone number format"
                  />
                  <InputFormatGuide type="phone" className="mt-2" />
                </div>
                
                <div>
                  <Label>Other Format Guides</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <InputFormatGuide type="date" />
                    <InputFormatGuide type="currency" />
                    <InputFormatGuide type="zipcode" />
                    <InputFormatGuide type="creditcard" />
                  </div>
                </div>
                
                <div>
                  <Label>Form Field Guidance Examples</Label>
                  <div className="space-y-2 mt-2">
                    <FormFieldGuidance 
                      isError={true}
                      message="This field is required"
                      suggestion="Please provide your full name as it appears on your ID"
                    />
                    
                    <FormFieldGuidance 
                      isError={false}
                      message="Strong password"
                    />
                    
                    <FormFieldGuidance 
                      message="Adding payment information is optional"
                      suggestion="You can add this later in your profile settings"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="components" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Message Components</CardTitle>
              <CardDescription>
                Various error messages and recovery guidance components
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <ErrorMessage 
                  message="This field is required" 
                  suggestion="Please fill in all required fields marked with an asterisk"
                />
                
                <ErrorAlert
                  title="Network Connection Issue"
                  description="Unable to connect to the server. Please check your internet connection."
                  errorType="network"
                  severity="medium"
                  onDismiss={() => {}}
                  onRetry={() => {}}
                />
                
                <ErrorGuidanceCard
                  title="Form Submission Failed"
                  description="We couldn't process your form submission due to validation errors."
                  errorType="validation"
                  severity="low"
                  onDismiss={() => {}}
                  solutions={[
                    {
                      title: "Check required fields",
                      description: "Make sure all required fields are filled out correctly",
                    },
                    {
                      title: "Verify contact information",
                      description: "Ensure your email and phone number are in the correct format",
                    },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}