import { User } from "@shared/schema";
import { formatDistance } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { TrophyIcon, MailIcon, PhoneIcon } from "lucide-react";

interface TeamMemberWithStats extends User {
  stats: {
    totalCalls: number;
    totalLeadsConverted: number;
    totalRevenueGenerated: number;
    currentDealsValue: number;
    lastActivityAt: string | null;
  };
}

interface TeamTableProps {
  teamMembers: TeamMemberWithStats[];
  isLoading: boolean;
  timeframe: string;
}

export function TeamTable({ teamMembers, isLoading, timeframe }: TeamTableProps) {
  // Helper to get initials from name
  const getInitials = (name?: string | null) => {
    if (!name) {
      return "--";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Calculate conversion rate
  const calculateConversion = (calls: number, leadsConverted: number): number => {
    if (calls === 0) return 0;
    return Math.round((leadsConverted / calls) * 1000) / 10;
  };
  
  // Format last activity
  const formatLastActivity = (date: string | null) => {
    if (!date) return 'Never';
    try {
      return formatDistance(new Date(date), new Date(), { addSuffix: true });
    } catch (error) {
      return 'Unknown';
    }
  };
  
  // Render skeletons when loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Calls Made</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Render empty state if no team members
  if (teamMembers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm mt-4 p-8 text-center">
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No team members found</h3>
        <p className="text-neutral-600 mb-4">
          Add team members to track performance and achievements.
        </p>
      </div>
    );
  }
  
  // Sort team members by conversion rate (high to low)
  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aConversion = calculateConversion(a.stats.totalCalls, a.stats.totalLeadsConverted);
    const bConversion = calculateConversion(b.stats.totalCalls, b.stats.totalLeadsConverted);
    return bConversion - aConversion;
  });
  
  // Get top performer
  const topPerformer = sortedMembers[0];
  
  return (
    <div className="space-y-6">
      {/* Top performer card */}
      {sortedMembers.length > 0 && topPerformer.stats.totalCalls > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-700">
              <TrophyIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold font-heading">Top Performer: {topPerformer.name}</h3>
              <p className="text-neutral-600">
                {calculateConversion(topPerformer.stats.totalCalls, topPerformer.stats.totalLeadsConverted)}% 
                conversion rate with {topPerformer.stats.totalLeadsConverted} deals closed
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Calls Made</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Revenue Generated</TableHead>
                <TableHead>Conversion Rate</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.map(member => {
                const conversion = calculateConversion(
                  member.stats.totalCalls,
                  member.stats.totalLeadsConverted
                );
                
                // Estimate appointments as 15% of calls
                const estimatedAppointments = Math.round(member.stats.totalCalls * 0.15);
                
                return (
                  <TableRow key={member.id} className="hover:bg-neutral-50">
                    <TableCell className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-xs font-medium">{getInitials(member.name ?? member.username)}</span>
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-neutral-900">{member.name ?? member.username}</div>
                        <div className="flex items-center text-neutral-500 text-xs">
                          <MailIcon className="h-3 w-3 mr-1" />
                          <span>{member.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{member.role}</TableCell>
                    <TableCell>{member.stats.totalCalls}</TableCell>
                    <TableCell>{estimatedAppointments}</TableCell>
                    <TableCell>{member.stats.totalLeadsConverted}</TableCell>
                    <TableCell>${member.stats.totalRevenueGenerated.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className={`font-medium ${conversion > 0 ? "text-green-600" : "text-neutral-500"}`}>
                          {conversion}%
                        </span>
                        <div className="ml-2 w-24">
                          <Progress value={Math.min(conversion * 5, 100)} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatLastActivity(member.stats.lastActivityAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
