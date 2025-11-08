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
  RefreshCwIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Activity, User, Lead } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

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

interface ActivityWithUser extends Activity {
  user?: User;
  lead?: Lead;
  entityType?: string;
  entityId?: number;
  timestamp?: Date | string;
}

export function ActivityFeed() {
  const [, navigate] = useLocation();
  
  // Fetch recent activities
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
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
  const activitiesWithUsers = activities.map(activity => {
    // Map targetType to entityType and targetId to entityId for UI consistency
    // Also attempt to find related lead ID based on targetType and targetId
    let leadId: number | undefined;
    
    if (activity.targetType === 'lead') {
      leadId = activity.targetId;
    } else if (activity.targetType === 'call' || activity.targetType === 'scheduled_call') {
      // For calls and scheduled calls, we need to find the related lead
      // This is simplified - in reality we'd need to fetch call data to get the leadId 
      // For now, we'll just set it to undefined and the UI will handle it gracefully
      leadId = undefined;
    }
    
    return {
      ...activity,
      entityType: activity.targetType,
      entityId: activity.targetId,
      timestamp: activity.createdAt,
      user: users.find(u => u.id === activity.userId),
      lead: leads.find(l => l.id === leadId)
    };
  });
  
  // Sort activities by timestamp (newest first)
  const sortedActivities = [...activitiesWithUsers].sort((a, b) => {
    // Use createdAt as the primary timestamp field
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Function to handle clicking on activity
  const handleActivityClick = (activity: ActivityWithUser) => {
    if (activity.targetType === 'lead' && activity.targetId) {
      navigate(`/leads?lead=${activity.targetId}`);
    } else if (activity.lead?.id) {
      navigate(`/leads?lead=${activity.lead.id}`);
    }
  };
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-neutral-900">
            Recent Activity
          </CardTitle>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/activities')}
              className="text-xs text-primary hover:text-primary-dark font-medium flex items-center gap-1"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
            <RefreshCwIcon className="h-4 w-4 text-neutral-400 hover:text-primary cursor-pointer" />
          </div>
        </div>
        <div className="text-xs text-neutral-500 flex gap-2 overflow-x-auto py-1 custom-scrollbar">
          <Badge variant="outline" className="rounded-full">All</Badge>
          <Badge variant="outline" className="rounded-full">Leads</Badge>
          <Badge variant="outline" className="rounded-full">Calls</Badge>
          <Badge variant="outline" className="rounded-full">Schedule</Badge>
          <Badge variant="outline" className="rounded-full">Timesheets</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] custom-scrollbar">
          <div className="space-y-0 p-4">
            {isLoading ? (
              Array(5).fill(0).map((_, index) => (
                <div key={index} className="flex items-start py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                  <Skeleton className="flex-shrink-0 h-9 w-9 rounded-full" />
                  <div className="ml-3 space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : sortedActivities.length > 0 ? (
              sortedActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  {getActivityIcon(activity.actionType, activity.entityType)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-neutral-800 dark:text-neutral-200">
                      <span className="font-medium">{activity.user?.username || "User"}</span>{" "}
                      {activity.description}{" "}
                      {activity.lead && (
                        <span className="text-primary font-medium">
                          {activity.lead.propertyAddress ? activity.lead.propertyAddress.split(',')[0] : activity.lead.leadId}
                        </span>
                      )}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-neutral-500">
                        {formatTimeAgo(activity.createdAt)}
                      </p>
                      {activity.entityType && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                          {activity.entityType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <ActivityIcon className="h-10 w-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-neutral-500">No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
