import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduledCallSchema } from "@shared/schema";
import { X } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

// Extend the scheduled call schema with validation
const extendedScheduledCallSchema = insertScheduledCallSchema.extend({
  leadId: z.number({
    required_error: "Please select a lead",
    invalid_type_error: "Lead ID must be a number",
  }),
  assignedCallerId: z.number({
    required_error: "Please assign a caller",
    invalid_type_error: "Caller ID must be a number",
  }),
  scheduledTime: z.date({
    required_error: "Please select a date and time",
    invalid_type_error: "That's not a valid date",
  }),
  timeHour: z.string().min(1, "Please select an hour"),
  timeMinute: z.string().min(1, "Please select a minute"),
  timeAmPm: z.string().min(1, "Please select AM or PM"),
});

type ScheduleCallFormValues = Omit<z.infer<typeof extendedScheduledCallSchema>, "scheduledTime"> & {
  scheduledTime: Date;
  timeHour: string;
  timeMinute: string;
  timeAmPm: string;
};

interface ScheduleCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleCallDialog({ open, onOpenChange }: ScheduleCallDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch leads for dropdown
  const { data: leads = [] } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  // Fetch users for caller assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/team"],
  });
  
  // Setup form with zod schema
  const form = useForm<ScheduleCallFormValues>({
    resolver: zodResolver(extendedScheduledCallSchema),
    defaultValues: {
      leadId: undefined,
      assignedCallerId: user?.id,
      scheduledTime: new Date(),
      status: "pending",
      notes: "",
      timeHour: "10",
      timeMinute: "00",
      timeAmPm: "AM",
    },
  });
  
  // Create scheduled call mutation
  const scheduleCallMutation = useMutation({
    mutationFn: async (data: ScheduleCallFormValues) => {
      // Combine date and time values
      const scheduledDate = new Date(data.scheduledTime);
      let hours = parseInt(data.timeHour);
      
      // Convert to 24-hour format
      if (data.timeAmPm === "PM" && hours < 12) {
        hours += 12;
      } else if (data.timeAmPm === "AM" && hours === 12) {
        hours = 0;
      }
      
      scheduledDate.setHours(hours);
      scheduledDate.setMinutes(parseInt(data.timeMinute));
      scheduledDate.setSeconds(0);
      scheduledDate.setMilliseconds(0);
      
      // Remove time fields from the data and ensure data is properly formatted
      const { timeHour, timeMinute, timeAmPm, ...callData } = data;
      
      // Create a properly formatted payload with all required fields
      const payload = {
        leadId: callData.leadId,
        assignedCallerId: callData.assignedCallerId,
        scheduledTime: scheduledDate.toISOString(),
        status: callData.status || "pending",
        notes: callData.notes || ""
      };
      
      console.log("Sending scheduled call data:", payload);
      
      // Send with the combined scheduledTime
      const res = await apiRequest("POST", "/api/scheduled-calls", payload);
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Call scheduled",
        description: "The call has been successfully scheduled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-calls"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Schedule call error:", error);
      
      let errorMessage = "Failed to schedule call";
      
      // Try to extract more detailed error message if available
      if (error.message) {
        errorMessage = error.message;
      } else if (error.errors && Array.isArray(error.errors)) {
        errorMessage = error.errors.map((e: any) => e.message || e.path?.join('.')).join(', ');
      }
      
      toast({
        title: "Error scheduling call",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ScheduleCallFormValues) => {
    scheduleCallMutation.mutate(data);
  };
  
  // Generate hour options (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(1, '0'));
  
  // Generate minute options (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-neutral-900">Schedule a Call</DialogTitle>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leadId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lead</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a lead" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id.toString()}>
                          {lead.ownerName} - {lead.propertyAddress}
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
              name="assignedCallerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Caller</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a caller" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users && users.length > 0 ? (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username || user.name || `User ${user.id}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={user ? user.id.toString() : "1"}>
                          {user ? user.username : "Current User"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-12 gap-2">
              <FormField
                control={form.control}
                name="scheduledTime"
                render={({ field }) => (
                  <FormItem className="col-span-6">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full text-left font-normal flex justify-between"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="col-span-6 space-y-2">
                <FormLabel>Time</FormLabel>
                <div className="flex items-center space-x-1">
                  <FormField
                    control={form.control}
                    name="timeHour"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Hour" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {hours.map(hour => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <span className="text-center">:</span>
                  
                  <FormField
                    control={form.control}
                    name="timeMinute"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Min" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {minutes.map(minute => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
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
                    name="timeAmPm"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Call preparation notes or agenda" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={scheduleCallMutation.isPending}
                className="bg-primary hover:bg-primary-dark"
              >
                {scheduleCallMutation.isPending ? "Scheduling..." : "Schedule Call"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
