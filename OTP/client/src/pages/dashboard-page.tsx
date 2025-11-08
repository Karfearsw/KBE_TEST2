import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { StatsCard } from "@/components/dashboard/stats-card";
import { SummaryMetrics } from "@/components/dashboard/summary-metrics";
import { DealPipeline } from "@/components/dashboard/deal-pipeline";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingCalls } from "@/components/dashboard/upcoming-calls";
import { TeamPerformance } from "@/components/dashboard/team-performance";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog-new";
import { Button } from "@/components/ui/button";
import { connectWebSocket, addEventListener, removeEventListener } from "@/lib/websocket";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lead, Call, ScheduledCall } from "@shared/schema";
import {
  UserSearch,
  Phone,
  Calendar,
  FileText,
  Upload
} from "lucide-react";

export default function DashboardPage() {
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const { user } = useAuth();
  
  // Function to handle opening the add lead dialog
  const handleAddLead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    setAddLeadDialogOpen(true);
  };
  
  // Get query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (user) {
      connectWebSocket(user.id);
      
      // Setup event listeners for real-time updates
      const handleLeadCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      };
      
      const handleLeadUpdated = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      };
      
      const handleCallCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/calls"] });
      };
      
      const handleCallScheduled = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/scheduled-calls"] });
      };
      
      const handleActivityCreated = () => {
        queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      };
      
      // Register event listeners
      addEventListener("lead_created", handleLeadCreated);
      addEventListener("lead_updated", handleLeadUpdated);
      addEventListener("call_created", handleCallCreated);
      addEventListener("call_scheduled", handleCallScheduled);
      addEventListener("activity_created", handleActivityCreated);
      
      // Cleanup event listeners on unmount
      return () => {
        removeEventListener("lead_created", handleLeadCreated);
        removeEventListener("lead_updated", handleLeadUpdated);
        removeEventListener("call_created", handleCallCreated);
        removeEventListener("call_scheduled", handleCallScheduled);
        removeEventListener("activity_created", handleActivityCreated);
      };
    }
  }, [user, queryClient]);
  
  // Fetch stats data for dashboard
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });
  
  const { data: scheduledCalls = [] } = useQuery<ScheduledCall[]>({
    queryKey: ["/api/scheduled-calls"],
  });
  
  // Helper function to get date range for comparison
  const getDateRange = (daysAgo: number) => {
    const start = new Date();
    start.setDate(start.getDate() - daysAgo);
    start.setHours(0, 0, 0, 0);
    return start;
  };

  // Calculate current stats and previous period stats
  const oneWeekAgo = getDateRange(7);
  const twoWeeksAgo = getDateRange(14);
  const oneDayAgo = getDateRange(1);
  const twoDaysAgo = getDateRange(2);
  const oneMonthAgo = getDateRange(30);
  const twoMonthsAgo = getDateRange(60);

  // New leads stats
  const newLeadsCount = leads.filter((lead) => lead.status === "new").length;
  const newLeadsLastWeek = leads.filter(
    (lead) => lead.status === "new" && 
    new Date(lead.createdAt) >= oneWeekAgo
  ).length;
  const newLeadsPreviousWeek = leads.filter(
    (lead) => lead.status === "new" && 
    new Date(lead.createdAt) >= twoWeeksAgo && 
    new Date(lead.createdAt) < oneWeekAgo
  ).length;

  // Active deals stats
  const activeDealsCount = leads.filter(
    (lead) => ["negotiation", "under-contract"].includes(lead.status || "")
  ).length;
  const activeDealsLastMonth = leads.filter(
    (lead) => ["negotiation", "under-contract"].includes(lead.status || "") &&
    new Date(lead.updatedAt) >= oneMonthAgo
  ).length;
  const activeDealsPreviousMonth = leads.filter(
    (lead) => ["negotiation", "under-contract"].includes(lead.status || "") &&
    new Date(lead.updatedAt) >= twoMonthsAgo &&
    new Date(lead.updatedAt) < oneMonthAgo
  ).length;

  // Calls stats
  const callsMadeCount = calls.length;
  const callsMadeYesterday = calls.filter(
    (call) => new Date(call.createdAt) >= oneDayAgo
  ).length;
  const callsMadeTwoDaysAgo = calls.filter(
    (call) => new Date(call.createdAt) >= twoDaysAgo && 
    new Date(call.createdAt) < oneDayAgo
  ).length;

  // Appointments stats
  const appointmentsCount = scheduledCalls.filter(
    (call) => call.status === "pending"
  ).length;
  const appointmentsLastWeek = scheduledCalls.filter(
    (call) => call.status === "pending" && 
    new Date(call.createdAt) >= oneWeekAgo
  ).length;
  const appointmentsPreviousWeek = scheduledCalls.filter(
    (call) => call.status === "pending" && 
    new Date(call.createdAt) >= twoWeeksAgo && 
    new Date(call.createdAt) < oneWeekAgo
  ).length;
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your real estate deals and activities</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="flex items-center">
            <Upload className="mr-2 h-4 w-4" />
            Import Leads
          </Button>
          <Button 
            className="flex items-center bg-primary hover:bg-primary/90"
            onClick={handleAddLead}
          >
            <UserSearch className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="New Leads" 
          value={newLeadsCount}
          icon={<UserSearch className="h-5 w-5" />}
          currentValue={newLeadsLastWeek}
          previousValue={newLeadsPreviousWeek}
        />
        
        <StatsCard 
          title="Calls Made" 
          value={callsMadeCount}
          icon={<Phone className="h-5 w-5" />}
          currentValue={callsMadeYesterday}
          previousValue={callsMadeTwoDaysAgo}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-700"
        />
        
        <StatsCard 
          title="Appointments" 
          value={appointmentsCount}
          icon={<Calendar className="h-5 w-5" />}
          currentValue={appointmentsLastWeek}
          previousValue={appointmentsPreviousWeek}
          iconBgColor="bg-yellow-100"
          iconColor="text-yellow-700"
        />
        
        <StatsCard 
          title="Active Deals" 
          value={activeDealsCount}
          icon={<FileText className="h-5 w-5" />}
          currentValue={activeDealsLastMonth}
          previousValue={activeDealsPreviousMonth}
          iconBgColor="bg-green-100"
          iconColor="text-green-700"
        />
      </div>
      
      {/* Summary Metrics */}
      <SummaryMetrics />
      
      {/* Deal Pipeline */}
      <DealPipeline />
      
      {/* Activity & Calls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ActivityFeed />
        <UpcomingCalls />
      </div>
      
      {/* Team Performance */}
      <TeamPerformance />
      
      {/* Add Lead Dialog */}
      <AddLeadDialog 
        open={addLeadDialogOpen} 
        onOpenChange={setAddLeadDialogOpen} 
      />
    </div>
  );
}
