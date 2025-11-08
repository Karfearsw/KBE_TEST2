import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extended user type with stats
interface TeamMemberWithStats extends User {
  stats: {
    totalCalls: number;
    totalLeadsConverted: number;
    totalRevenueGenerated: number;
    currentDealsValue: number;
    lastActivityAt: string | null;
  };
}

export function TeamPerformance() {
  const [timeframe, setTimeframe] = useState("week");
  
  // Fetch team data
  const { data: teamMembers = [] } = useQuery<TeamMemberWithStats[]>({
    queryKey: ["/api/team"],
  });

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
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold font-heading text-neutral-900">Team Performance</h2>
        <div className="flex space-x-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="text-sm border border-neutral-300 rounded py-1 px-2 h-auto w-auto">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <button className="text-sm text-primary hover:text-primary-dark font-medium">View All</button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full data-table">
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Role</th>
              <th>Calls Made</th>
              <th>Appointments</th>
              <th>Contracts</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => {
                const conversion = calculateConversion(
                  member.stats.totalCalls,
                  member.stats.totalLeadsConverted
                );
                
                return (
                  <tr key={member.id} className="hover:bg-neutral-50">
                    <td className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center">
                        <span className="text-xs font-medium">{getInitials(member.name ?? member.username)}</span>
                      </div>
                      <span className="ml-3 font-medium text-neutral-900">{member.name ?? member.username}</span>
                    </td>
                    <td className="capitalize">{member.role}</td>
                    <td>{member.stats.totalCalls}</td>
                    <td>{Math.round(member.stats.totalCalls * 0.12)}</td>
                    <td>{member.stats.totalLeadsConverted}</td>
                    <td>
                      <div className="flex items-center">
                        <span className={`font-medium ${conversion > 0 ? "text-green-600" : "text-neutral-500"}`}>
                          {conversion}%
                        </span>
                        <div className="ml-2 w-16 bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(conversion * 10, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  No team members found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
