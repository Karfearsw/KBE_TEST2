import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TeamTable } from "@/components/team/team-table";
import { PageHeader } from "@/components/shared/page-header";
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

export default function TeamPage() {
  const [timeframe, setTimeframe] = useState("week");
  
  // Fetch team data
  const { data: teamMembers = [], isLoading } = useQuery<TeamMemberWithStats[]>({
    queryKey: ["/api/team"],
  });
  
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="main-content flex-1 md:ml-64 min-h-screen p-4 md:p-6 overflow-auto">
        <PageHeader
          title="Team"
          description="Monitor team performance and activity"
          actions={
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        
        {/* Team Performance Table */}
        <TeamTable 
          teamMembers={teamMembers} 
          isLoading={isLoading} 
          timeframe={timeframe}
        />
      </main>
      
      <MobileNav />
    </div>
  );
}
