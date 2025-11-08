import { useState } from "react";
import { ScheduledCall, Lead, User } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Phone, 
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface ScheduledCallsTableProps {
  scheduledCalls: ScheduledCall[];
  isLoading: boolean;
  onCall?: (lead: Lead) => void;
}

export function ScheduledCallsTable({ scheduledCalls, isLoading, onCall }: ScheduledCallsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch leads to get property addresses
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Fetch users to get caller names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });
  
  // Update scheduled call status mutation
  const updateCallStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/scheduled-calls/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Call status updated",
        description: "The call status has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-calls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating call status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete scheduled call mutation
  const deleteScheduledCall = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scheduled-calls/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Call deleted",
        description: "The scheduled call has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scheduled-calls"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting call",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle deleting a scheduled call
  const handleDeleteCall = (id: number) => {
    if (confirm("Are you sure you want to delete this scheduled call?")) {
      deleteScheduledCall.mutate(id);
    }
  };
  
  // Handle marking call as completed
  const handleMarkCompleted = (id: number) => {
    updateCallStatus.mutate({ id, status: 'completed' });
  };
  
  // Handle marking call as missed
  const handleMarkMissed = (id: number) => {
    updateCallStatus.mutate({ id, status: 'missed' });
  };
  
  // Get lead for a call
  const getLeadForCall = (leadId: number) => {
    return leads.find(lead => lead.id === leadId);
  };
  
  // Get caller for a call
  const getCallerForCall = (callerId: number) => {
    return users.find(user => user.id === callerId);
  };
  
  // Format date for display
  const formatDateTime = (date: string | Date) => {
    return format(new Date(date), "MMM d, yyyy h:mm a");
  };
  
  // Render skeletons when loading
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 dark:bg-neutral-700" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Render empty state if no scheduled calls
  if (scheduledCalls.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No scheduled calls</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Schedule calls with your leads to follow up and close more deals.
        </p>
        <Button variant="outline">Schedule Your First Call</Button>
      </div>
    );
  }
  
  // Get status badge classes
  const getStatusClasses = (status: string | null) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'missed':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Scheduled For</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledCalls.map(call => {
              const lead = getLeadForCall(call.leadId);
              const caller = getCallerForCall(call.assignedCallerId);
              
              return (
                <TableRow key={call.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                  <TableCell className="font-medium">
                    {lead?.ownerName}
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{lead?.propertyAddress}</div>
                  </TableCell>
                  <TableCell>{formatDateTime(call.scheduledTime)}</TableCell>
                  <TableCell>{caller?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusClasses(call.status || 'pending')}`}>
                      {call.status ? call.status.charAt(0).toUpperCase() + call.status.slice(1) : 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {call.notes || 'No notes'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer"
                          onClick={() => {
                            if (onCall && lead) {
                              onCall(lead);
                            }
                          }}
                          disabled={!onCall || !lead}
                        >
                          <Phone className="mr-2 h-4 w-4" />
                          <span>Make Call</span>
                        </DropdownMenuItem>
                        {call.status === 'pending' && (
                          <>
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer text-green-600" 
                              onClick={() => handleMarkCompleted(call.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              <span>Mark Completed</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center cursor-pointer text-red-600" 
                              onClick={() => handleMarkMissed(call.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              <span>Mark Missed</span>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem className="flex items-center cursor-pointer">
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Reschedule</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="flex items-center cursor-pointer text-red-600 focus:text-red-600" 
                          onClick={() => handleDeleteCall(call.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
