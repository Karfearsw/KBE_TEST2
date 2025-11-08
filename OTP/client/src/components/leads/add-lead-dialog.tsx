import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Create a basic schema that only requires minimal fields and uses direct types
// This bypasses the insertLeadSchema to avoid type issues
const simpleLeadSchema = z.object({
  // Required fields with clear error messages
  propertyAddress: z.string().min(1, "Property address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  
  // All other fields are optional with appropriate defaults
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().email("Invalid email format").optional().or(z.literal('')),
  status: z.enum(["new", "contacted", "follow-up", "negotiation", "under-contract", "closed", "dead"]).default("new"),
  motivationLevel: z.enum(["unknown", "low", "medium", "high"]).default("unknown"),
  propertyType: z.enum(["single-family", "multi-family", "condo", "commercial", "land"]).default("single-family"),
  source: z.enum(["cold-call", "direct-mail", "referral", "online", "other"]).default("other"),
  notes: z.string().optional(),
  
  // Number fields as strings with transform
  estimatedValue: z.string().optional().or(z.literal(''))
    .transform((val) => val && val !== '' ? parseInt(val.replace(/\D/g, '')) : undefined),
  arv: z.string().optional().or(z.literal(''))
    .transform((val) => val && val !== '' ? parseInt(val.replace(/\D/g, '')) : undefined),
  repairCost: z.string().optional().or(z.literal(''))
    .transform((val) => val && val !== '' ? parseInt(val.replace(/\D/g, '')) : undefined),
  latitude: z.string().optional().or(z.literal(''))
    .transform((val) => val && val !== '' ? parseFloat(val) : undefined),
  longitude: z.string().optional().or(z.literal(''))
    .transform((val) => val && val !== '' ? parseFloat(val) : undefined),
  
  // User assignment
  assignedToUserId: z.number().optional(),
});

// Use our simple schema for type derivation
type AddLeadFormValues = z.input<typeof simpleLeadSchema>;
type AddLeadSubmission = z.infer<typeof simpleLeadSchema>;

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch users for assignment dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/team"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Setup form with zod schema - explicitly add types to match schema
  const form = useForm<AddLeadFormValues>({
    resolver: zodResolver(simpleLeadSchema, undefined, { raw: true }),
    mode: "onChange", // Validate on change for better feedback
    defaultValues: {
      propertyAddress: "",
      city: "",
      state: "",
      zip: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      status: "new" as const,
      motivationLevel: "unknown" as const,
      propertyType: "single-family" as const,
      source: "other" as const,
      notes: "",
      arv: "",
      repairCost: "",
      estimatedValue: "",
      latitude: "",
      longitude: "",
      assignedToUserId: undefined,
    },
  });
  
  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: AddLeadFormValues) => {
      console.log('Lead submission data:', data);

      const processedData: AddLeadSubmission = simpleLeadSchema.parse(data);

      console.log('Processed lead data:', processedData);
      const res = await apiRequest("POST", "/api/leads", processedData);
      return res.json();
    },
    onSuccess: (data) => {
      console.log('Lead created successfully:', data);
      toast({
        title: "Lead created",
        description: `The lead has been successfully created with ID: ${data.leadId}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Lead creation error:', error);
      toast({
        title: "Error creating lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: AddLeadFormValues) => {
    console.log('Form submitted with data:', data);
    
    // Use the form data directly without additional conversion since our schema handles the conversions
    createLeadMutation.mutate(data);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-neutral-900">Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the information for this new potential deal
          </DialogDescription>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Information */}
              <div>
                <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Property Information</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="propertyAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estimatedValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Value</FormLabel>
                          <FormControl>
                            <Input placeholder="$" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="single-family">Single Family</SelectItem>
                            <SelectItem value="multi-family">Multi-Family</SelectItem>
                            <SelectItem value="condo">Condo</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="arv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ARV (After Repair Value)</FormLabel>
                          <FormControl>
                            <Input placeholder="$" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="repairCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repair Cost</FormLabel>
                          <FormControl>
                            <Input placeholder="$" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g. 32.7767" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input type="number" step="any" placeholder="e.g. -96.7970" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Owner Information */}
              <div>
                <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Owner Information</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 555-5555" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="motivationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivation Level</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select motivation level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unknown">Unknown</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div>
              <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Additional Information</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lead Source</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select lead source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cold-call">Cold Call</SelectItem>
                            <SelectItem value="direct-mail">Direct Mail</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignedToUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="follow-up">Follow-up</SelectItem>
                            <SelectItem value="negotiation">Negotiation</SelectItem>
                            <SelectItem value="under-contract">Under Contract</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="dead">Dead</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLeadMutation.isPending}
                className="bg-primary text-white hover:bg-primary-dark"
                onClick={() => {
                  console.log('Submit button clicked, current form state:', form.getValues());
                  
                  // Check for form errors
                  if (Object.keys(form.formState.errors).length > 0) {
                    console.error('Form has errors:', form.formState.errors);
                    toast({
                      title: "Form validation failed",
                      description: "Please fix the highlighted errors",
                      variant: "destructive",
                    });
                  }
                  
                  // If form is valid, handleSubmit will call onSubmit
                  form.handleSubmit(onSubmit)();
                }}
              >
                {createLeadMutation.isPending ? "Adding Lead..." : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


