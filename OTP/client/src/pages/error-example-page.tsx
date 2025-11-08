import React, { useState } from 'react';
import { useErrorRecovery } from '@/hooks/use-error-recovery';
import { withErrorHandling, ComponentErrorBoundary } from '@/components/error-recovery';
import { ErrorMessage, ErrorAlert, ErrorGuidanceCard } from '@/components/ui/error-guidance';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Create a form schema with validation
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' }),
});

// Mock API functions
const mockApiCall = async (delay = 1000, shouldFail = false, errorType = 'network') => {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (shouldFail) {
    const error = new Error('API call failed');
    (error as any).errorType = errorType;
    throw error;
  }
  
  return { success: true };
};

// Component to demonstrate error handling with the withErrorHandling HOC
function ErrorDemoComponent({ handleError, clearError, isErrorActive }: any) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleApiCall = async (errorType?: string) => {
    setIsLoading(true);
    try {
      await mockApiCall(1000, true, errorType);
    } catch (error) {
      handleError(error, {
        context: 'API Demo',
        showToast: true,
        launchRecoveryFlow: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>HOC Error Handling Demo</CardTitle>
        <CardDescription>
          This component uses the withErrorHandling HOC to demonstrate error handling
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handleApiCall('network')} 
            disabled={isLoading}
          >
            Trigger Network Error
          </Button>
          <Button 
            onClick={() => handleApiCall('authentication')} 
            disabled={isLoading}
          >
            Trigger Auth Error
          </Button>
        </div>
        
        {isErrorActive && (
          <ErrorAlert
            title="Error in API Demo"
            description="The API call failed. Try using the recovery guidance to resolve the issue."
            errorType="network"
            severity="medium"
            onDismiss={clearError}
          />
        )}
      </CardContent>
    </Card>
  );
}

// Wrap the component with the HOC
const ErrorDemoWithHandling = withErrorHandling(ErrorDemoComponent);

// Form error handling example
function FormErrorExample() {
  const { handleError, RecoveryFlowDialog } = useErrorRecovery();
  
  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });
  
  // Mock form submission
  const contactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await mockApiCall(1000, Math.random() > 0.5);
      return response;
    },
    onError: (error) => {
      handleError(error, {
        context: 'Contact Form',
        showToast: true,
        launchRecoveryFlow: true,
      });
    },
  });
  
  function onSubmit(data: z.infer<typeof formSchema>) {
    contactMutation.mutate(data);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Error Handling</CardTitle>
        <CardDescription>
          This form demonstrates validation and submission error handling
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                  {field.value && !form.formState.errors.email && (
                    <ErrorMessage
                      message="Looks good!"
                      suggestion="We'll only use this to respond to your message"
                    />
                  )}
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please describe your issue or question"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide as much detail as possible
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={contactMutation.isPending}
              className="w-full"
            >
              {contactMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Form>
        
        {contactMutation.isError && (
          <div className="mt-4">
            <ErrorGuidanceCard
              title="Form Submission Failed"
              description="We couldn't send your message due to a network issue."
              errorType="network"
              severity="medium"
              onDismiss={() => contactMutation.reset()}
              onRetry={() => form.handleSubmit(onSubmit)()}
              solutions={[
                {
                  title: "Check your internet connection",
                  description: "Ensure you're connected to the internet and try again",
                },
                {
                  title: "Try again later",
                  description: "Our servers might be experiencing high load at the moment",
                },
              ]}
            />
          </div>
        )}
        
        <RecoveryFlowDialog />
      </CardContent>
    </Card>
  );
}

// Component that will intentionally throw an error to test error boundary
function ErrorBoundaryExample() {
  const [shouldCrash, setShouldCrash] = useState(false);
  
  if (shouldCrash) {
    throw new Error('This is an intentional error to test the error boundary');
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Boundary Example</CardTitle>
        <CardDescription>
          This component demonstrates how Error Boundaries catch and handle runtime errors
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => setShouldCrash(true)}
          variant="destructive"
        >
          Crash This Component
        </Button>
      </CardContent>
    </Card>
  );
}

// Main example page
export default function ErrorExamplePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Recovery Examples</h1>
        <p className="text-muted-foreground mb-6">
          This page showcases different error recovery patterns and techniques used throughout the application.
        </p>
        
        <Tabs defaultValue="components">
          <TabsList className="mb-6">
            <TabsTrigger value="components">Error Components</TabsTrigger>
            <TabsTrigger value="form">Form Errors</TabsTrigger>
            <TabsTrigger value="boundary">Error Boundaries</TabsTrigger>
          </TabsList>
          
          <TabsContent value="components" className="space-y-6">
            <ErrorDemoWithHandling />
          </TabsContent>
          
          <TabsContent value="form" className="space-y-6">
            <FormErrorExample />
          </TabsContent>
          
          <TabsContent value="boundary" className="space-y-6">
            <ComponentErrorBoundary>
              <ErrorBoundaryExample />
            </ComponentErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}