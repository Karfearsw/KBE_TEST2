import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Activity, User, Lead } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlusIcon, 
  PhoneIcon, 
  CalendarClockIcon, 
  FileEditIcon, 
  PencilIcon,
  TagIcon,
  ActivityIcon,
  CheckSquareIcon,
  TimerIcon,
  SearchIcon,
  FilterIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  
  // Fetch activities - now fetching 100 instead of just 10
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities", { limit: 100 }],
  });
  
  // Fetch users to map user info to activities
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });
  
  // Fetch leads to map lead info to activities
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Determine if data is still loading
  const isLoading = isLoadingActivities || isLoadingUsers || isLoadingLeads;
  
  // Combine activity data with user and lead data
  const activitiesWithDetails = activities.map(activity => {
    // Map targetType to entityType and targetId to entityId for UI consistency
    // Also attempt to find related lead ID based on targetType and targetId
    let leadId: number | undefined;
    let relatedUser = users.find(u => u.id === activity.userId);
    
    if (activity.targetType === 'lead') {
      leadId = activity.targetId;
    } else if (activity.targetType === 'call' || activity.targetType === 'scheduled_call') {
      // For calls and scheduled calls, we need to find the related lead
      // This is simplified - in reality we'd need to fetch call data to get the leadId 
      // For now, we'll just set it to undefined and the UI will handle it gracefully
      leadId = undefined;
    }
    
    let relatedLead = leads.find(l => l.id === leadId);
    
    return {
      ...activity,
      entityType: activity.targetType,
      entityId: activity.targetId,
      timestamp: activity.createdAt,
      user: relatedUser,
      lead: relatedLead
    };
  });
  
  // Helper to get icon based on action type
  const getActivityIcon = (actionType: string, entityType?: string) => {
    // Determine icon based on action and entity type
    if (actionType === "create" && entityType === "lead") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center">
          <UserPlusIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "update" && entityType === "lead") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center">
          <PencilIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "call" || (actionType === "create" && entityType === "call")) {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center">
          <PhoneIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "schedule" || (actionType === "create" && entityType === "scheduled_call")) {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 flex items-center justify-center">
          <CalendarClockIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "status") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 flex items-center justify-center">
          <TagIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "complete" || actionType === "close") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center">
          <CheckSquareIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "timesheet") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center">
          <TimerIcon className="h-5 w-5" />
        </div>
      );
    }
    
    if (actionType === "activity") {
      return (
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
          <ActivityIcon className="h-5 w-5" />
        </div>
      );
    }
    
    return (
      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary bg-opacity-10 text-primary flex items-center justify-center">
        <FileEditIcon className="h-5 w-5" />
      </div>
    );
  };
  
  // Format timestamp relative to now
  const formatTimeAgo = (timestamp: string | Date | undefined) => {
    if (!timestamp) return "Unknown time";
    
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Invalid date";
    }
  };
  
  // Filter activities based on search, type, and timeframe
  const filteredActivities = activitiesWithDetails.filter(activity => {
    let passesSearch = true;
    let passesType = true;
    let passesTimeframe = true;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const description = activity.description?.toLowerCase() || "";
      const username = activity.user?.username.toLowerCase() || "";
      const leadAddress = activity.lead?.propertyAddress?.toLowerCase() || "";
      
      passesSearch = description.includes(searchLower) || 
                    username.includes(searchLower) || 
                    leadAddress.includes(searchLower);
    }
    
    // Activity type filter
    if (activityType !== "all") {
      passesType = activity.targetType === activityType || 
                  (activityType === "call" && (activity.targetType === "call" || activity.targetType === "scheduled_call"));
    }
    
    // Timeframe filter
    if (timeframe !== "all") {
      const activityDate = new Date(activity.createdAt);
      const now = new Date();
      
      if (timeframe === "today") {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        passesTimeframe = activityDate >= today;
      } else if (timeframe === "yesterday") {
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const dayBefore = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
        passesTimeframe = activityDate >= dayBefore && activityDate < yesterday;
      } else if (timeframe === "week") {
        const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        passesTimeframe = activityDate >= weekAgo;
      } else if (timeframe === "month") {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        passesTimeframe = activityDate >= monthAgo;
      }
    }
    
    return passesSearch && passesType && passesTimeframe;
  });
  
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  
  return (
    <div className="flex-1 min-h-screen bg-neutral-50">
      <main className="p-4 md:p-6 overflow-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Activity Log</h1>
            <p className="text-neutral-600">Track all activities and changes across the system</p>
          </div>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="search"
                  placeholder="Search activities..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="call">Calls</SelectItem>
                  <SelectItem value="timesheet">Timesheets</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex items-center gap-1">
                <FilterIcon className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              {isLoading 
                ? "Loading activities..." 
                : sortedActivities.length > 0 
                  ? `Showing ${sortedActivities.length} activities` 
                  : "No activities match your filters"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {isLoading ? (
                <div className="py-20 text-center text-neutral-500">Loading activities...</div>
              ) : sortedActivities.length > 0 ? (
                sortedActivities.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {getActivityIcon(activity.actionType, activity.entityType)}
                    <div className="ml-3 flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <p className="text-sm text-neutral-800 dark:text-neutral-200">
                          <span className="font-medium">{activity.user?.username || "User"}</span>{" "}
                          {activity.description}{" "}
                          {activity.lead && (
                            <span className="text-primary font-medium">
                              {activity.lead.propertyAddress ? activity.lead.propertyAddress.split(',')[0] : activity.lead.leadId}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 md:mt-0 md:ml-4">
                          {formatTimeAgo(activity.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          {activity.entityType || "activity"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          ID: {activity.entityId || activity.id}
                        </Badge>
                        {activity.user?.role && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                            {activity.user.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center">
                  <ActivityIcon className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="text-neutral-500">No activities match your filters</p>
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => {
                      setSearch("");
                      setActivityType("all");
                      setTimeframe("all");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}