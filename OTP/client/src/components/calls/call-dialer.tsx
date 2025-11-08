import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatPhoneLink } from "@/lib/format-utils";
import { Lead, InsertCall } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { formatLeadId } from "@/lib/lead-id-utils";
import { useAuth } from "@/hooks/use-auth";
import { Device } from "@twilio/voice-sdk";
import type { Call } from "@twilio/voice-sdk";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Phone,
  PhoneOff,
  Loader2,
  PhoneOutgoing,
  PhoneIncoming,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Dialer button props
interface DialerButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
}

// Dialer button component
const DialerButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  active = false, 
  className = "" 
}: DialerButtonProps) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled}
    variant={active ? "default" : "outline"}
    size="icon"
    className={`h-12 w-12 rounded-full ${className}`}
  >
    {children}
  </Button>
);

// Keypad button component
const KeypadButton = ({ 
  digit, 
  letters = "",
  onClick,
  disabled = false 
}: { 
  digit: string; 
  letters?: string;
  onClick: (digit: string) => void;
  disabled?: boolean;
}) => (
  <Button
    type="button"
    onClick={() => onClick(digit)}
    disabled={disabled}
    variant="outline"
    className="h-14 w-14 rounded-full flex flex-col items-center justify-center dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
  >
    <span className="text-lg font-medium">{digit}</span>
    {letters && <span className="text-xs text-muted-foreground">{letters}</span>}
  </Button>
);

// Call form schema
const callFormSchema = z.object({
  outcome: z.enum(["answered", "voicemail", "no_answer", "wrong_number"]),
  notes: z.string().optional(),
});

type CallFormValues = z.infer<typeof callFormSchema>;

interface CallDialerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: number;
  phoneNumber?: string;
  leadName?: string;
}

export function CallDialer({ open, onOpenChange, leadId, phoneNumber, leadName }: CallDialerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  
  // Call states
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("");
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoggingCall, setIsLoggingCall] = useState(false);
  const [manualPhoneNumber, setManualPhoneNumber] = useState<string>(phoneNumber || "");
  // Always default to showing the dialpad
  const [showDialpad, setShowDialpad] = useState<boolean>(true);
  
  // For call timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Setup form
  const form = useForm<CallFormValues>({
    resolver: zodResolver(callFormSchema),
    defaultValues: {
      outcome: "answered",
      notes: "",
    },
  });
  
  // Interface for the token response
  interface TokenResponse {
    token: string;
    twilioNumber: string;
    identity: string;
    expires: string;
  }
  
  // Fetch Twilio token
  const { data: tokenData, isLoading: isTokenLoading, error: tokenError } = useQuery<TokenResponse>({
    queryKey: ["/api/twilio/token"],
    enabled: open, // Only fetch when dialog is open
  });
  
  // Fetch leads for dropdown if no leadId is provided
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
    enabled: open && !leadId, // Only fetch when dialog is open and no leadId
  });

  // Create call log mutation
  const createCallMutation = useMutation({
    mutationFn: async (data: InsertCall) => {
      const res = await apiRequest("POST", "/api/calls", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      toast({
        title: "Call logged successfully",
        description: "The call details have been saved",
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log call",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Initialize device when component mounts (load from localStorage)
  useEffect(() => {
    const savedShowDialpad = localStorage.getItem('showDialpad');
    // Only apply the setting from localStorage if it's not forcing it to hide
    if (savedShowDialpad === 'true') {
      setShowDialpad(true);
    }
  }, []);

  // Track initialization attempts to prevent infinite loops
  const initAttemptsRef = useRef(0);
  
  // Initialize Twilio device when token is available
  useEffect(() => {
    if (!tokenData?.token || !open) return;
    
    // Don't re-initialize if we're already initializing
    if (isInitializing && deviceRef.current) return;
    
    // Limit initialization attempts to prevent infinite loops
    if (initAttemptsRef.current >= 3) {
      console.log("Maximum initialization attempts reached, skipping initialization");
      setIsInitializing(false);
      return;
    }
    
    initAttemptsRef.current += 1;
    setIsInitializing(true);
    console.log(`Initializing Twilio device with token... (Attempt ${initAttemptsRef.current})`);
    
    try {
      // Setup Twilio device with basic, minimal options for maximum compatibility
      // Note: Too many options can sometimes cause connection issues
      console.log(`Creating device with token starting with: ${tokenData.token.substring(0, 10)}...`);
      
      const device = new Device(tokenData.token, {
        // Minimize options for better compatibility
        allowIncomingWhileBusy: true,
        closeProtection: true,
        disableAudioContextSounds: false
      });
      
      console.log("Device created, registering event handlers...");
      
      // Set up event handlers
      device.on("ready", () => {
        console.log("Twilio device is now ready");
        setIsInitializing(false);
        initAttemptsRef.current = 0; // Reset counter on successful init
      });
      
      device.on("error", (error) => {
        console.error("Twilio device error:", error);
        toast({
          title: "Call system error",
          description: error.message || "There was an error with the calling system",
          variant: "destructive",
        });
        setIsInitializing(false);
        setIsCallInProgress(false);
      });
      
      // Register for incoming calls (if needed)
      device.on("incoming", (call) => {
        console.log("Incoming call detected");
        callRef.current = call;
        setIsCallInProgress(true);
        setCallStatus("incoming");
        
        call.on("accept", () => {
          console.log("Call accepted");
          setCallStatus("in-progress");
          setCallStartTime(new Date());
          startCallTimer();
        });
        
        call.on("disconnect", () => {
          console.log("Call disconnected");
          handleCallEnded();
        });
        
        call.on("cancel", () => {
          console.log("Call canceled");
          handleCallEnded();
        });
      });
      
      deviceRef.current = device;
      
      // Add a fallback timeout in case the ready event doesn't fire
      const fallbackTimer = setTimeout(() => {
        if (isInitializing) {
          console.log("Twilio device initialization timed out, proceeding anyway");
          setIsInitializing(false);
        }
      }, 5000); // Increased timeout to 5 seconds
      
      return () => {
        clearTimeout(fallbackTimer);
        stopCallTimer();
        if (callRef.current) {
          try {
            callRef.current.disconnect();
          } catch (error) {
            console.error("Error disconnecting call:", error);
          }
          callRef.current = null;
        }
        
        if (deviceRef.current) {
          try {
            deviceRef.current.destroy();
          } catch (error) {
            console.error("Error destroying device:", error);
          }
          deviceRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing Twilio device:", error);
      toast({
        title: "Call system error",
        description: "Failed to initialize phone system. Please try again.",
        variant: "destructive",
      });
      setIsInitializing(false);
      return () => {}; // Empty cleanup function for this case
    }
  }, [tokenData, open, toast]);
  
  // Set selected lead when leadId changes
  useEffect(() => {
    if (leadId && leads.length > 0) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setSelectedLead(lead);
      }
    }
  }, [leadId, leads]);
  
  // Start call timer
  const startCallTimer = () => {
    // Clear any existing timer
    stopCallTimer();
    
    // Start a new timer
    timerRef.current = setInterval(() => {
      if (callStartTime) {
        const now = new Date();
        const durationInSeconds = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(durationInSeconds);
      }
    }, 1000);
  };
  
  // Stop call timer
  const stopCallTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Counter for call reconnection attempts
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 2;

  // Handle initiating a call with retry logic
  const handleMakeCall = async () => {
    if (!deviceRef.current) {
      // If the device isn't initialized, try to reinitialize it
      if (tokenData?.token) {
        toast({
          title: "Reinitializing phone system",
          description: "Please wait while we reconnect...",
        });
        
        try {
          // Try to reinitialize the device with compatible options
          const device = new Device(tokenData.token, {
            disableAudioContextSounds: false,
            closeProtection: true
          });
          
          deviceRef.current = device;
          
          // Set up event handlers for the reinitialized device
          device.on("ready", () => {
            console.log("Reinitialized device is ready");
          });

          device.on("error", (error) => {
            console.error("Reinitialized device error:", error);
          });
          
          // Wait a moment for the device to initialize
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error("Error reinitializing device:", error);
          toast({
            title: "Call system error",
            description: "Phone system could not be reinitialized. Please try refreshing the page.",
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Call system error",
          description: "Phone system is not initialized yet",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Reset reconnect attempts counter
    reconnectAttemptsRef.current = 0;
    
    // Use the manual phone number if available, otherwise use the lead's phone number
    const numberToCall = manualPhoneNumber || phoneNumber;
    
    if (!numberToCall) {
      toast({
        title: "No phone number",
        description: "Please enter a phone number or select a lead with a valid phone number",
        variant: "destructive",
      });
      return;
    }
    
    // Format the phone number to E.164 format if possible
    const formattedNumber = formatPhoneNumber(numberToCall);
    
    try {
      setCallStatus("connecting");
      
      // Make the outbound call, passing phone number to your server
      console.log(`Initiating call to ${formattedNumber} using Twilio voice endpoint`);
      
      // Create correct URL for voice endpoint
      const apiUrl = new URL("/api/twilio/voice", window.location.origin).toString();
      
      // Connect with proper parameters format and minimal options for reliability
      console.log(`Connecting to ${formattedNumber} via ${apiUrl}`);
      
      // Use the proper ConnectOptions format for Twilio.Device.connect()
      const call = await deviceRef.current.connect({
        // Params are sent directly to the voice endpoint
        params: {
          To: formattedNumber,
          From: tokenData?.twilioNumber || "+18778561719"
        }
      });
      
      callRef.current = call;
      
      // Set up call event handlers with reconnect logic
      call.on("accept", () => {
        console.log("Call accepted successfully");
        setIsCallInProgress(true);
        setCallStatus("in-progress");
        setCallStartTime(new Date());
        startCallTimer();
        // Reset reconnect attempts on successful connection
        reconnectAttemptsRef.current = 0;
      });
      
      call.on("disconnect", () => {
        console.log("Call disconnected normally");
        handleCallEnded();
      });
      
      call.on("error", (error) => {
        console.error("Call error:", error);
        
        // Check if this is a connection error that we can retry
        if (error.code === 31005 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          toast({
            title: `Connection issue (Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`,
            description: "Trying to reconnect the call...",
          });
          
          // Attempt to reconnect after a short delay
          setTimeout(() => {
            if (deviceRef.current) {
              try {
                handleMakeCall();
              } catch (retryError) {
                console.error("Error during retry:", retryError);
                handleCallEnded();
              }
            }
          }, 1500);
        } else {
          // Either exceeded max retries or it's a different error
          toast({
            title: "Call failed",
            description: error.message || "There was an error making the call",
            variant: "destructive",
          });
          handleCallEnded();
        }
      });
      
    } catch (error) {
      console.error("Error making call:", error);
      toast({
        title: "Call failed",
        description: "There was an error making the call. Please check your internet connection.",
        variant: "destructive",
      });
      setCallStatus("");
    }
  };
  
  // Helper function to format phone numbers to E.164 format
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // If already in E.164 format, return as is
    if (phone.startsWith('+')) return phone;
    
    // Remove all non-digit characters
    let digits = phone.replace(/\D/g, '');
    
    // Handle US/Canada numbers (10 digits or 11 digits starting with 1)
    if (digits.length === 10) {
      // Standard US 10-digit number: format as +1XXXXXXXXXX
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // US number with country code: format as +1XXXXXXXXXX
      return `+${digits}`;
    } else if (digits.length > 10) {
      // For international numbers, just add + prefix
      return `+${digits}`;
    }
    
    // Safety measure: If we can't determine format,
    // assume it's a US number and prepend +1
    // This will ensure it works with Twilio even if not perfectly formatted
    console.log(`Reformatting phone number: ${phone} to E.164 format`);
    return `+1${digits}`;
  };
  
  // Handle ending a call
  const handleEndCall = () => {
    if (callRef.current) {
      try {
        callRef.current.disconnect();
      } catch (error) {
        console.error("Error disconnecting call:", error);
      }
    }
    handleCallEnded();
  };
  
  // Handle call ended (cleanup)
  const handleCallEnded = () => {
    setIsCallInProgress(false);
    setCallStatus("ended");
    stopCallTimer();
    setIsLoggingCall(true);
  };
  
  // Toggle mute
  const handleToggleMute = () => {
    if (callRef.current) {
      if (isMuted) {
        callRef.current.mute(false);
      } else {
        callRef.current.mute(true);
      }
      setIsMuted(!isMuted);
    }
  };
  
  // Handle keypad digit press
  const handleKeypadPress = (digit: string) => {
    // Update the manual phone number
    setManualPhoneNumber(prev => prev + digit);
    
    // If in a call, send DTMF tones
    if (callRef.current && isCallInProgress) {
      try {
        callRef.current.sendDigits(digit);
      } catch (error) {
        console.error('Error sending digits:', error);
      }
    }
  };
  
  // Clear the phone number input
  const handleClearPhoneNumber = () => {
    setManualPhoneNumber('');
  };
  
  // Toggle between showing the keypad or not
  const toggleKeypad = () => {
    // Set showDialpad to the opposite of its current state
    const newState = !showDialpad;
    setShowDialpad(newState);
    // Only store preference in localStorage if we're setting it to true
    // this ensures it doesn't persist as hidden across sessions
    if (newState) {
      localStorage.setItem('showDialpad', 'true');
    }
  };
  
  // Handle form submission to log the call
  const onSubmit = (data: CallFormValues) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to log calls",
        variant: "destructive",
      });
      return;
    }
    
    if (!leadId) {
      toast({
        title: "No lead selected",
        description: "Please select a lead to log this call",
        variant: "destructive",
      });
      return;
    }
    
    // Create the call log entry
    const callData: InsertCall = {
      leadId,
      userId: user.id,
      callTime: callStartTime || new Date(),
      duration: callDuration,
      outcome: data.outcome,
      notes: data.notes || "",
    };
    
    createCallMutation.mutate(callData);
  };
  
  // Handle dialog close
  const handleDialogClose = (open: boolean) => {
    if (!open && isCallInProgress) {
      // Prevent closing during active call
      toast({
        description: "Please end the call before closing",
      });
      return;
    }
    
    if (!open && isLoggingCall) {
      // Prevent closing while logging
      toast({
        description: "Please complete call logging before closing",
      });
      return;
    }
    
    // Cleanup when closing
    if (!open) {
      stopCallTimer();
      setCallDuration(0);
      setCallStartTime(null);
      setCallStatus("");
      setIsLoggingCall(false);
      
      if (callRef.current) {
        try {
          callRef.current.disconnect();
        } catch (error) {
          console.error("Error disconnecting call:", error);
        }
        callRef.current = null;
      }
      
      form.reset();
    }
    
    onOpenChange(open);
  };
  
  // Show initialization message
  if (isInitializing || isTokenLoading) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Initializing phone system...</DialogTitle>
            <DialogDescription>
              Please wait while we connect to the phone system
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-neutral-500 mt-2">This may take a few seconds</p>
            
            {/* Bypass button to force proceed if stuck */}
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsInitializing(false)}
            >
              Skip initialization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Show token error
  if (tokenError) {
    return (
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Phone System Error</DialogTitle>
            <DialogDescription>
              There was an error connecting to the phone system.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6">
            <PhoneOff className="h-8 w-8 text-destructive mb-4" />
            <p className="text-sm text-neutral-700">
              Please try again later or check your internet connection.
            </p>
            
            {/* Bypass button to force proceed anyway */}
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsInitializing(false)}
            >
              Try anyway
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => handleDialogClose(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md w-[95%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoggingCall ? "Log Call Details" : "Call Lead"}
          </DialogTitle>
          <DialogDescription>
            {isLoggingCall 
              ? "Record the outcome and any notes from the call"
              : leadName 
                ? `Calling ${leadName}` 
                : "Make an outbound call to a lead"}
          </DialogDescription>
        </DialogHeader>
        
        {isLoggingCall ? (
          // Call logging form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Outcome</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="answered">Answered</SelectItem>
                        <SelectItem value="voicemail">Left Voicemail</SelectItem>
                        <SelectItem value="no_answer">No Answer</SelectItem>
                        <SelectItem value="wrong_number">Wrong Number</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter notes about the call..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 w-24">Duration:</span>
                  <span className="font-medium dark:text-neutral-200">{formatDuration(callDuration)}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 w-24">Lead:</span>
                  <span className="font-medium dark:text-neutral-200">{leadName || "Unknown"}</span>
                  {selectedLead && (
                    <span className="text-primary font-mono bg-primary/5 dark:bg-primary/10 px-2 py-1 rounded-md text-xs ml-2">
                      {formatLeadId(selectedLead.id, selectedLead.createdAt)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 w-24">Phone:</span>
                  <span className="font-medium dark:text-neutral-200">{phoneNumber || "Unknown"}</span>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsLoggingCall(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCallMutation.isPending}
                >
                  {createCallMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Call Log
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // Call dialer UI
          <div className="space-y-6">
            {/* Lead and phone number display */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  {/* Display selected lead info */}
                  {leadName && <div className="text-lg font-medium">{leadName}</div>}
                  {selectedLead && (
                    <div className="text-primary font-mono bg-primary/5 dark:bg-primary/10 px-2 py-1 rounded-md inline-block text-sm mb-2">
                      {formatLeadId(selectedLead.id, selectedLead.createdAt)}
                    </div>
                  )}
                  
                  {/* Manual phone number input */}
                  <div className="relative">
                    <Input 
                      value={manualPhoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualPhoneNumber(e.target.value)}
                      placeholder="Enter phone number..."
                      className="text-xl text-center font-bold"
                    />
                    {manualPhoneNumber && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={handleClearPhoneNumber}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Call status indicator */}
                  {callStatus && (
                    <div className={`text-sm font-medium ${
                      callStatus === "in-progress" ? "text-green-600 dark:text-green-400" : 
                      callStatus === "connecting" ? "text-amber-600 dark:text-amber-400" : 
                      callStatus === "incoming" ? "text-blue-600 dark:text-blue-400" : 
                      "text-neutral-600 dark:text-neutral-400"
                    }`}>
                      {callStatus === "connecting" && "Connecting..."}
                      {callStatus === "in-progress" && `In call ${callDuration > 0 ? `(${formatDuration(callDuration)})` : ""}`}
                      {callStatus === "incoming" && "Incoming call"}
                      {callStatus === "ended" && "Call ended"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Keypad toggle button */}
            <div className="flex justify-center my-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={toggleKeypad}
              >
                {showDialpad ? (
                  <>
                    <span>Hide Keypad</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Show Keypad</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Show/hide keypad based on showDialpad state */}
            {showDialpad && (
              <div className="space-y-4 border rounded-md p-2 sm:p-4 bg-neutral-50 dark:bg-neutral-900 transition-all duration-300 ease-in-out">
                {/* Numeric keypad */}
                <div className="grid grid-cols-3 gap-1 sm:gap-2 mb-3 sm:mb-4">
                  <KeypadButton digit="1" letters="" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="2" letters="ABC" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="3" letters="DEF" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="4" letters="GHI" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="5" letters="JKL" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="6" letters="MNO" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="7" letters="PQRS" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="8" letters="TUV" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="9" letters="WXYZ" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="*" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="0" letters="+" onClick={handleKeypadPress} disabled={isInitializing} />
                  <KeypadButton digit="#" onClick={handleKeypadPress} disabled={isInitializing} />
                </div>
              </div>
            )}
            
            {/* Call control buttons */}
            <div className="flex justify-center space-x-4 py-4">
              {isCallInProgress ? (
                <>
                  <DialerButton 
                    onClick={handleToggleMute} 
                    active={isMuted}
                  >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </DialerButton>
                  
                  <DialerButton
                    onClick={handleEndCall}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    <PhoneOff className="h-6 w-6" />
                  </DialerButton>
                  
                  <DialerButton
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    active={isSpeakerOn}
                  >
                    {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                  </DialerButton>
                </>
              ) : (
                <>
                  <DialerButton
                    onClick={toggleKeypad}
                    active={showDialpad}
                  >
                    <Phone className="h-6 w-6" />
                  </DialerButton>

                  <DialerButton
                    onClick={handleMakeCall}
                    disabled={!manualPhoneNumber && !phoneNumber || isInitializing}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <PhoneOutgoing className="h-6 w-6" />
                  </DialerButton>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleDialogClose(false)}
                disabled={isCallInProgress}
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}