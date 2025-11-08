import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ModernCalendar } from "@/components/ui/fullcalendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { format, parseISO, isBefore, isAfter, isToday } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Trash,
  UserRound,
  FileClock,
  Plus,
  FileEdit,
  Check,
  X,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the schema for the timesheet form
const timesheetSchema = z.object({
  date: z.date({ required_error: "Date is required" }),
  description: z.string().min(3, "Description must be at least 3 characters"),
  activityType: z.string({ required_error: "Activity type is required" }),
  totalHours: z.coerce
    .number({ required_error: "Total hours is required" })
    .min(0.25, "Must be at least 15 minutes (0.25 hours)")
    .max(24, "Cannot exceed 24 hours")
});

type TimesheetFormValues = z.infer<typeof timesheetSchema>;

// Activity types for dropdown selection
const activityTypes = [
  { value: "lead-gen", label: "Lead Generation" },
  { value: "calling", label: "Phone Calls" },
  { value: "meetings", label: "Client Meetings" },
  { value: "paperwork", label: "Contract/Paperwork" },
  { value: "property-visits", label: "Property Visits" },
  { value: "marketing", label: "Marketing" },
  { value: "research", label: "Market Research" },
  { value: "admin", label: "Administrative" },
  { value: "training", label: "Training/Learning" },
  { value: "other", label: "Other" },
];

// Format the activity type for display
const formatActivityType = (type: string) => {
  const activityType = activityTypes.find((t) => t.value === type);
  return activityType ? activityType.label : type;
};

// Component for adding a new timesheet entry
function AddTimesheetDialog({ open, setOpen, date }: { open: boolean; setOpen: (open: boolean) => void; date?: Date }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Setup form with schema
  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: date || new Date(),
      description: "",
      activityType: "",
      totalHours: undefined,
    },
  });

  // Create timesheet mutation
  const createTimesheetMutation = useMutation({
    mutationFn: async (data: TimesheetFormValues) => {
      const res = await apiRequest("POST", "/api/timesheets", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Timesheet entry added",
        description: "Your timesheet entry has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding timesheet entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: TimesheetFormValues) => {
    createTimesheetMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Timesheet Entry</DialogTitle>
          <DialogDescription>
            Record your time spent on various activities.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <div className="grid gap-2">
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${
                        !field.value && "text-muted-foreground"
                      }`}
                      type="button"
                      onClick={() => {
                        const trigger = document.getElementById("date-calendar-trigger");
                        if (trigger) {
                          (trigger as HTMLButtonElement).click();
                        }
                      }}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </div>
                  <Dialog>
                    <DialogTrigger className="hidden" id="date-calendar-trigger" />
                    <DialogContent className="p-0">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          // Close the dialog
                          document.getElementById("date-calendar-close")?.click();
                        }}
                        disabled={(date) => {
                          // Disable future dates more than today
                          return isAfter(date, new Date());
                        }}
                        initialFocus
                      />
                      <button id="date-calendar-close" className="hidden" onClick={() => {}} />
                    </DialogContent>
                  </Dialog>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="totalHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hours Spent</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="0.0"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter time in hours (e.g., 1.5 for 1 hour and 30 minutes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you worked on..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={createTimesheetMutation.isPending}>
                {createTimesheetMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Component for viewing and managing timesheets
export default function TimesheetPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [addTimesheetOpen, setAddTimesheetOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date(), // Today
  });

  // Define type for timesheet data
  interface TimesheetEntry {
    id: number;
    userId: number;
    date: string;
    description: string;
    activityType: string;
    totalHours: number;
    approved?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  // Fetch timesheets
  const {
    data: timesheets = [] as TimesheetEntry[],
    isLoading,
    isError,
    error,
  } = useQuery<TimesheetEntry[]>({
    queryKey: [
      "/api/timesheets",
      { userId: user?.id, startDate: dateRange.startDate, endDate: dateRange.endDate },
    ],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Define analytics type
  interface TimesheetAnalytics {
    count: number;
    totalHours: number;
    byActivityType: Record<string, number>;
    byDate: Record<string, number>;
  }
  
  // Fetch analytics
  const { data: analytics = {
    count: 0,
    totalHours: 0,
    byActivityType: {},
    byDate: {}
  } as TimesheetAnalytics } = useQuery<TimesheetAnalytics>({
    queryKey: [
      "/api/timesheets/analytics",
      { userId: user?.id, startDate: dateRange.startDate, endDate: dateRange.endDate },
    ],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Delete timesheet mutation
  const deleteTimesheetMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/timesheets/${id}`);
      if (!res.ok) {
        throw new Error("Failed to delete timesheet entry");
      }
    },
    onSuccess: () => {
      toast({
        title: "Timesheet entry deleted",
        description: "Your timesheet entry has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting timesheet entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Group timesheets by date
  const timesheetsByDate = timesheets.reduce(
    (acc: { [key: string]: TimesheetEntry[] }, timesheet: TimesheetEntry) => {
      const date = format(new Date(timesheet.date), "yyyy-MM-dd");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(timesheet);
      return acc;
    },
    {} as { [key: string]: TimesheetEntry[] }
  );

  // Handle adding a new timesheet
  const handleAddTimesheet = (date?: Date) => {
    setSelectedDate(date);
    setAddTimesheetOpen(true);
  };

  // Handle deleting a timesheet
  const handleDeleteTimesheet = (id: number) => {
    if (window.confirm("Are you sure you want to delete this timesheet entry?")) {
      deleteTimesheetMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="text-destructive text-xl mb-2">Error loading timesheets</div>
        <div className="text-muted-foreground dark:text-neutral-400">{(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Timesheets</h1>
          <p className="text-muted-foreground mb-4">
            Track and manage your work hours
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 items-end md:items-center">
          <div className="flex items-center gap-2 relative text-sm">
            <Button 
              variant="outline" 
              className="gap-1"
              onClick={() => {
                // Set to current month
                const today = new Date();
                setDateRange({
                  startDate: new Date(today.getFullYear(), today.getMonth(), 1),
                  endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0)
                });
              }}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {format(dateRange.startDate, "MMM d")} - {format(dateRange.endDate, "MMM d, yyyy")}
              </span>
              <span className="sm:hidden">Date Range</span>
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendar View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Timesheet Calendar</DialogTitle>
                  <DialogDescription>
                    View your timesheet entries in calendar format
                  </DialogDescription>
                </DialogHeader>
                <div className="h-[500px] mt-4">
                  <ModernCalendar 
                    events={timesheets.map((ts: TimesheetEntry) => ({
                      id: ts.id,
                      title: `${ts.totalHours}h - ${formatActivityType(ts.activityType)}`,
                      start: ts.date,
                      allDay: true,
                      extendedProps: {
                        description: ts.description,
                        activityType: ts.activityType
                      }
                    }))}
                    eventClick={(info: any) => {
                      info.jsEvent.preventDefault();
                      toast({
                        title: info.event.title,
                        description: info.event.extendedProps.description || "No description provided"
                      });
                    }}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth'
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Button onClick={() => handleAddTimesheet()} className="ml-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Hours
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="list">Timesheet List</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(timesheetsByDate).length === 0 ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <FileClock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No timesheets found</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't logged any hours for the selected period.
                    </p>
                    <Button onClick={() => handleAddTimesheet()}>
                      Add Your First Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              Object.keys(timesheetsByDate)
                .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                .map((date) => {
                  const entries = timesheetsByDate[date];
                  const totalHours = entries.reduce(
                    (sum, entry) => sum + parseFloat(entry.totalHours.toString()),
                    0
                  );
                  const formattedDate = format(
                    new Date(date),
                    "EEEE, MMMM d, yyyy"
                  );
                  
                  return (
                    <Card key={date} className="overflow-hidden dark:border-neutral-700">
                      <CardHeader className="pb-3 bg-muted/50 dark:bg-muted/10">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-base font-medium">
                              {formattedDate}
                            </CardTitle>
                            <CardDescription>
                              Total: {totalHours.toFixed(2)} hours
                            </CardDescription>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleAddTimesheet(new Date(date))}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 pt-3">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0"
                            >
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <Badge variant="outline" className="mr-2">
                                    {formatActivityType(entry.activityType)}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {parseFloat(entry.totalHours.toString()).toFixed(2)} hrs
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {entry.description}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDeleteTimesheet(entry.id)}
                              >
                                <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-full md:col-span-1 dark:border-neutral-700">
              <CardHeader>
                <CardTitle>Total Hours</CardTitle>
                <CardDescription>
                  {format(dateRange.startDate, "MMM d")} - {format(dateRange.endDate, "MMM d, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {analytics?.totalHours?.toFixed(1) || "0.0"}
                </div>
                <div className="text-muted-foreground text-sm">
                  Hours logged across {analytics?.count || 0} entries
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-full md:col-span-2 dark:border-neutral-700">
              <CardHeader>
                <CardTitle>Hours by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.byActivityType && Object.keys(analytics.byActivityType).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analytics.byActivityType)
                      .sort(([, hoursA], [, hoursB]) => (hoursB as number) - (hoursA as number))
                      .map(([type, hours]) => {
                        const percentage = ((hours as number) / analytics.totalHours) * 100;
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{formatActivityType(type)}</span>
                              <span>{(hours as number).toFixed(1)} hrs ({percentage.toFixed(0)}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No activity data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Additional analytics cards can be added here */}
          </div>
        </TabsContent>
      </Tabs>

      {addTimesheetOpen && (
        <AddTimesheetDialog
          open={addTimesheetOpen}
          setOpen={setAddTimesheetOpen}
          date={selectedDate}
        />
      )}
    </div>
  );
}