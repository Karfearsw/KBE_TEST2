import { useQuery } from "@tanstack/react-query";
import { 
  PhoneIcon, 
  ClockIcon, 
  CalendarIcon, 
  PlusIcon, 
  CalendarDaysIcon,
  CheckIcon,
  XIcon,
  AlertCircleIcon,
  ArrowRightIcon
} from "lucide-react";
import { ScheduledCall, Lead, User } from "@shared/schema";
import { format, formatRelative, isToday, isTomorrow, differenceInMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { useLocation } from "wouter";

// Combined type for displaying call with related data
type CallWithRelations = ScheduledCall & {
  lead?: Lead;
  caller?: User;
};

export function UpcomingCalls() {
  const [, navigate] = useLocation();

  // Get today's date at start of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get end of week (7 days from today)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  
  // Fetch upcoming scheduled calls
  const { data: scheduledCalls = [], isLoading: isLoadingCalls } = useQuery<ScheduledCall[]>({
    queryKey: ["/api/scheduled-calls", { status: "pending", startDate: today.toISOString() }],
  });
  
  // Fetch leads to get property addresses
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Fetch users to get caller names
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });
  
  // Determine if any data is still loading
  const isLoading = isLoadingCalls || isLoadingLeads || isLoadingUsers;
  
  // Combine calls with lead and user data
  const callsWithRelations: CallWithRelations[] = scheduledCalls.map(call => ({
    ...call,
    lead: leads.find(lead => lead.id === call.leadId),
    caller: users.find(user => user.id === call.assignedCallerId)
  }));
  
  // Sort calls by scheduled time
  const sortedCalls = [...callsWithRelations].sort((a, b) => {
    const dateA = new Date(a.scheduledTime);
    const dateB = new Date(b.scheduledTime);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Format call time for display
  const formatCallTime = (date: Date | string) => {
    try {
      const callDate = new Date(date);
      if (isToday(callDate)) {
        return `Today at ${format(callDate, 'h:mm a')}`;
      } else if (isTomorrow(callDate)) {
        return `Tomorrow at ${format(callDate, 'h:mm a')}`;
      } else {
        return formatRelative(callDate, new Date());
      }
    } catch (error) {
      return "Unknown time";
    }
  };
  
  // Determine if call is soon (within 60 minutes)
  const isCallSoon = (date: Date | string) => {
    try {
      const callDate = new Date(date);
      const now = new Date();
      return isToday(callDate) && differenceInMinutes(callDate, now) <= 60 && differenceInMinutes(callDate, now) > 0;
    } catch {
      return false;
    }
  };
  
  // Handle click to schedule a new call
  const handleScheduleCall = () => {
    window.dispatchEvent(new CustomEvent('open-schedule-call-dialog'));
  };
  
  // Navigate to the calls page
  const handleViewAllCalls = () => {
    navigate('/calls');
  };

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-heading text-neutral-900">Upcoming Calls</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleScheduleCall}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Schedule a new call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <Badge variant="secondary" className="text-xs">
            <CalendarDaysIcon className="h-3 w-3 mr-1" />
            Upcoming: {sortedCalls.length}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <ClockIcon className="h-3 w-3 mr-1" />
            Today: {sortedCalls.filter(call => isToday(new Date(call.scheduledTime))).length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] custom-scrollbar">
          <div className="p-4">
            {isLoading ? (
              // Loading skeleton
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex items-center p-3 mb-3 rounded border border-neutral-100 dark:border-neutral-800">
                  <Skeleton className="flex-shrink-0 h-10 w-10 rounded-full" />
                  <div className="ml-3 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))
            ) : sortedCalls.length > 0 ? (
              sortedCalls.map((call) => {
                const isSoon = isCallSoon(call.scheduledTime);
                return (
                  <div 
                    key={call.id} 
                    className={`flex items-center p-3 mb-3 rounded border ${
                      isSoon 
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20' 
                        : 'border-neutral-100 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800/30'
                    } hover:shadow-sm transition-shadow`}
                  >
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full ${
                      isSoon 
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' 
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    } flex items-center justify-center`}>
                      {isSoon ? <AlertCircleIcon className="h-5 w-5" /> : <PhoneIcon className="h-5 w-5" />}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]">
                          {call.lead?.ownerName || "Unknown"}
                        </p>
                        {isSoon && (
                          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200 text-[10px] h-5 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                            Soon
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1 inline-block" />
                          {formatCallTime(call.scheduledTime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8 p-0 bg-white dark:bg-neutral-800">
                              <PhoneIcon className="h-4 w-4 text-green-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Make call</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8 p-0 bg-white dark:bg-neutral-800">
                              <CheckIcon className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Mark as completed</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10 px-4">
                <CalendarIcon className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-neutral-500 mb-4">No upcoming calls scheduled</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleScheduleCall}
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Schedule Your First Call
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {!isLoading && sortedCalls.length > 0 && (
          <div className="flex justify-center p-3 border-t border-neutral-100 dark:border-neutral-800">
            <Button 
              variant="link" 
              size="sm" 
              className="text-primary"
              onClick={handleViewAllCalls}
            >
              View all calls
              <ArrowRightIcon className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
