import { Call, Lead, User } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneOff,
  Smartphone,
  Phone,
  Clock,
  Calendar,
  User as UserIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallHistoryTableProps {
  calls: Call[];
  isLoading: boolean;
}

export function CallHistoryTable({ calls, isLoading }: CallHistoryTableProps) {
  // Fetch leads to get property addresses
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Fetch users to get caller names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });
  
  // Get lead for a call
  const getLeadForCall = (leadId: number) => {
    return leads.find(lead => lead.id === leadId);
  };
  
  // Get caller for a call
  const getCallerForCall = (callerId: number) => {
    return users.find(user => user.id === callerId);
  };
  
  // Format timestamp for display
  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Format exact time for tooltip
  const formatExactTime = (timestamp: string | Date | null) => {
    if (!timestamp) return 'Date not available';
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Get outcome icon
  const getOutcomeIcon = (outcome: string | null) => {
    if (!outcome) return <Phone className="h-5 w-5 text-neutral-500" />;
    
    switch (outcome) {
      case 'answered':
        return <PhoneIncoming className="h-5 w-5 text-green-600" />;
      case 'voicemail':
        return <PhoneOutgoing className="h-5 w-5 text-yellow-600" />;
      case 'no_answer':
        return <PhoneOff className="h-5 w-5 text-red-600" />;
      case 'wrong_number':
        return <Smartphone className="h-5 w-5 text-red-600" />;
      default:
        return <Phone className="h-5 w-5 text-neutral-500" />;
    }
  };
  
  // Format duration in minutes:seconds
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render skeletons when loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Called By</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Render empty state if no calls
  if (calls.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No call history</h3>
        <p className="text-neutral-600 mb-4">
          Start making calls to track your communication with leads.
        </p>
        <Button variant="outline">Make Your First Call</Button>
      </div>
    );
  }
  
  // Get outcome classes
  const getOutcomeClasses = (outcome: string | null) => {
    if (!outcome) return 'bg-neutral-100 text-neutral-800';
    
    switch (outcome) {
      case 'answered':
        return 'bg-green-100 text-green-800';
      case 'voicemail':
        return 'bg-yellow-100 text-yellow-800';
      case 'no_answer':
        return 'bg-red-100 text-red-800';
      case 'wrong_number':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };
  
  // Format outcome for display
  const formatOutcome = (outcome: string | null) => {
    if (!outcome) return 'Unknown';
    
    switch (outcome) {
      case 'answered':
        return 'Answered';
      case 'voicemail':
        return 'Voicemail';
      case 'no_answer':
        return 'No Answer';
      case 'wrong_number':
        return 'Wrong Number';
      default:
        return outcome;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Called By</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map(call => {
              const lead = getLeadForCall(call.leadId);
              const caller = getCallerForCall(call.userId);
              
              return (
                <TableRow key={call.id} className="hover:bg-neutral-50">
                  <TableCell className="font-medium">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            {lead?.ownerName}
                            <div className="text-xs text-neutral-500">{lead?.propertyAddress}</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 text-xs">
                            <div className="font-medium">Property Details:</div>
                            {lead?.ownerPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {lead.ownerPhone}
                              </div>
                            )}
                            {lead?.propertyType && (
                              <div>Type: {lead.propertyType}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help flex items-center">
                            <UserIcon className="mr-1 h-3 w-3 text-neutral-400" />
                            <span>{caller?.name || 'Unknown'}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1 text-xs">
                            <div className="font-medium">Call Agent:</div>
                            {caller?.email && (
                              <div>{caller.email}</div>
                            )}
                            {caller?.role && (
                              <div>Role: {caller.role}</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center cursor-help">
                            <Clock className="mr-1 h-3 w-3 text-neutral-400" />
                            {formatTime(call.callTime)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {formatExactTime(call.callTime)}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">{formatDuration(call.duration)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            {call.duration ? `${call.duration} seconds total` : 'Duration not recorded'}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {getOutcomeIcon(call.outcome)}
                      <span className={`ml-2 text-xs font-medium rounded-full px-2 py-1 ${getOutcomeClasses(call.outcome)}`}>
                        {formatOutcome(call.outcome)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {call.notes || 'No notes'}
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
