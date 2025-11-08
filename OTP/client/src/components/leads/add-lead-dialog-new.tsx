import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Create a simple schema for form validation
const leadFormSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "Zip code is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerPhone: z.string().optional(),
  ownerEmail: z.string().optional(),
  propertyType: z.string().optional(),
  motivationLevel: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  estimatedValue: z.string().optional(),
  arv: z.string().optional(),
  repairCost: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadFormSchema>;

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const queryClient = useQueryClient();
  
  // Form state using React's useState
  const [formData, setFormData] = useState<LeadFormData>({
    propertyAddress: "",
    city: "",
    state: "",
    zip: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    propertyType: "single-family",
    motivationLevel: "unknown",
    source: "other",
    status: "new",
    estimatedValue: "",
    arv: "",
    repairCost: "",
    latitude: "",
    longitude: "",
    notes: "",
  });
  
  // Form field errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Handle input changes
  const handleChange = (field: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Create lead mutation
  const createLeadMutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      // Process the data and convert number fields
      const processedData = {
        ...data,
        arv: data.arv ? Number(data.arv) : undefined,
        repairCost: data.repairCost ? Number(data.repairCost) : undefined,
        estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : undefined,
        latitude: data.latitude ? Number(data.latitude) : undefined,
        longitude: data.longitude ? Number(data.longitude) : undefined,
      };
      
      console.log('Submitting lead:', processedData);
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
      setFormData({
        propertyAddress: "",
        city: "",
        state: "",
        zip: "",
        ownerName: "",
        ownerPhone: "",
        ownerEmail: "",
        propertyType: "single-family",
        motivationLevel: "unknown",
        source: "other",
        status: "new",
        estimatedValue: "",
        arv: "",
        repairCost: "",
        latitude: "",
        longitude: "",
        notes: "",
      });
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
  
  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    try {
      leadFormSchema.parse(formData);
      createLeadMutation.mutate(formData);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach(error => {
          if (error.path.length > 0) {
            const field = error.path[0].toString();
            newErrors[field] = error.message;
          }
        });
        setErrors(newErrors);
        
        // Show a toast with validation errors
        toast({
          title: "Form validation failed",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        
        // Log the required fields that are missing
        const requiredFields = ["propertyAddress", "city", "state", "zip", "ownerName"];
        const missingFields = requiredFields.filter(field => !formData[field as keyof LeadFormData]);
        if (missingFields.length > 0) {
          console.error("Missing required fields:", missingFields);
        }
      }
    }
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
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Property Information */}
            <div>
              <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Property Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    placeholder="Street address" 
                    value={formData.propertyAddress}
                    onChange={(e) => handleChange("propertyAddress", e.target.value)}
                    className={errors.propertyAddress ? "border-red-500" : ""}
                  />
                  {errors.propertyAddress && (
                    <p className="text-sm text-red-500">{errors.propertyAddress}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className={errors.state ? "border-red-500" : ""}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500">{errors.state}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Zip Code <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      value={formData.zip}
                      onChange={(e) => handleChange("zip", e.target.value)}
                      className={errors.zip ? "border-red-500" : ""}
                    />
                    {errors.zip && (
                      <p className="text-sm text-red-500">{errors.zip}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Estimated Value
                    </label>
                    <Input 
                      placeholder="$" 
                      value={formData.estimatedValue}
                      onChange={(e) => handleChange("estimatedValue", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Property Type
                  </label>
                  <Select 
                    value={formData.propertyType}
                    onValueChange={(value) => handleChange("propertyType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single-family">Single Family</SelectItem>
                      <SelectItem value="multi-family">Multi-Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      ARV (After Repair Value)
                    </label>
                    <Input 
                      placeholder="$" 
                      value={formData.arv}
                      onChange={(e) => handleChange("arv", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Repair Cost
                    </label>
                    <Input 
                      placeholder="$" 
                      value={formData.repairCost}
                      onChange={(e) => handleChange("repairCost", e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Latitude
                    </label>
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder="e.g. 32.7767"
                      value={formData.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Longitude
                    </label>
                    <Input 
                      type="number" 
                      step="any" 
                      placeholder="e.g. -96.7970"
                      value={formData.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Owner Information */}
            <div>
              <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Owner Information</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Owner Name <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    value={formData.ownerName}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                    className={errors.ownerName ? "border-red-500" : ""}
                  />
                  {errors.ownerName && (
                    <p className="text-sm text-red-500">{errors.ownerName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Phone Number
                  </label>
                  <Input 
                    placeholder="(555) 555-5555" 
                    value={formData.ownerPhone}
                    onChange={(e) => handleChange("ownerPhone", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    value={formData.ownerEmail}
                    onChange={(e) => handleChange("ownerEmail", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Motivation Level
                  </label>
                  <Select
                    value={formData.motivationLevel}
                    onValueChange={(value) => handleChange("motivationLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select motivation level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Lead Source
                  </label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => handleChange("source", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold-call">Cold Call</SelectItem>
                      <SelectItem value="direct-mail">Direct Mail</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="follow-up">Follow Up</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="under-contract">Under Contract</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="dead">Dead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          <div>
            <h3 className="text-md font-semibold font-heading mb-3 text-neutral-900">Additional Information</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Notes
              </label>
              <Textarea 
                placeholder="Additional notes about this lead" 
                rows={4}
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
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
            >
              {createLeadMutation.isPending ? "Adding Lead..." : "Add Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}