import { useState, useEffect, useMemo } from "react";
import { 
  PhoneIcon, 
  PencilIcon, 
  DollarSignIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  InfoIcon, 
  BarChart3Icon, 
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  CalendarIcon,
  Clock8Icon,
  ZapIcon
} from "lucide-react";
import { Lead } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { subDays, differenceInDays, isAfter, isBefore, addDays, format } from "date-fns";

// Pipeline status groups with their display names and analysis information
const statusGroups = [
  { 
    status: "new", 
    label: "New Leads", 
    description: "Recent leads that need initial contact", 
    idealStageTime: 3, // days
    icon: <ZapIcon className="h-4 w-4" /> 
  },
  { 
    status: "contacted", 
    label: "Contacted", 
    description: "Leads that have been reached out to",
    idealStageTime: 7, // days
    icon: <PhoneIcon className="h-4 w-4" /> 
  },
  { 
    status: "negotiation", 
    label: "Negotiation", 
    description: "Active discussions and offers",
    idealStageTime: 14, // days
    icon: <BarChart3Icon className="h-4 w-4" /> 
  },
  { 
    status: "under-contract", 
    label: "Under Contract", 
    description: "Pending closing",
    idealStageTime: 30, // days
    icon: <TrendingUpIcon className="h-4 w-4" /> 
  },
  { 
    status: "closed", 
    label: "Closed", 
    description: "Completed deals",
    idealStageTime: 0, // days (final state)
    icon: <DollarSignIcon className="h-4 w-4" /> 
  }
];

// Define interfaces for pipeline metrics
interface PipelineStageMetrics {
  status: string;
  label: string;
  description: string;
  idealStageTime: number;
  icon: JSX.Element;
  leads: Lead[];
  leadCount: number;
  stageValue: number;
  stageValuePercentage: number;
  countChange: number;
  valueChange: number;
  avgTimeInStage: number;
  stageHealthStatus: 'on-track' | 'at-risk' | 'delayed' | 'completed';
}

// Helper component to display value change with proper coloring and icon
const ValueChange = ({ value, isPercentage = false, inverse = false }: { value: number, isPercentage?: boolean, inverse?: boolean }) => {
  // For some metrics, a higher number is worse (like days on market)
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;
  
  let textColor = "text-gray-500";
  let Icon = isPositive ? ArrowUpRightIcon : ArrowDownRightIcon;
  
  if (!isNeutral) {
    textColor = isPositive ? "text-green-600" : "text-red-600";
  }
  
  return (
    <div className={`flex items-center ${textColor} text-xs font-medium gap-0.5`}>
      {!isNeutral && <Icon className="h-3 w-3" />}
      <span>
        {isNeutral ? "0" : (isPositive ? "+" : "")}{value.toLocaleString()}{isPercentage ? "%" : ""}
      </span>
    </div>
  );
};

export function DealPipeline() {
  const [, navigate] = useLocation();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  
  // Set date range for comparing current and previous periods
  const today = new Date();
  const currentPeriodStart = subDays(today, 30); // Last 30 days
  const previousPeriodStart = subDays(currentPeriodStart, 30); // 30 days before that
  
  // Fetch all leads for the pipeline
  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Calculate metrics for the pipeline stages
  const pipelineMetrics: PipelineStageMetrics[] = useMemo(() => {
    // Filter leads by period
    const currentPeriodLeads = allLeads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return isAfter(createdAt, currentPeriodStart) && isBefore(createdAt, today);
    });
    
    const previousPeriodLeads = allLeads.filter(lead => {
      const createdAt = new Date(lead.createdAt);
      return isAfter(createdAt, previousPeriodStart) && isBefore(createdAt, currentPeriodStart);
    });
    
    // Calculate active pipeline value (exclude closed deals and assign all value to "new" stage)
    const activeLeads = allLeads.filter(lead => lead.status !== "closed");
    
    // Calculate total pipeline value from active leads
    const totalPipelineValue = activeLeads.reduce((total, lead) => {
      // For leads that aren't in the "new" stage yet, include their values
      if (lead.status !== "new") {
        // Ensure we're using a valid number for estimatedValue
        const value = typeof lead.estimatedValue === 'number' ? lead.estimatedValue : 0;
        return total + value;
      }
      return total;
    }, 0);
    
    // Calculate metrics for each stage
    return statusGroups.map(group => {
      // Get leads in this stage
      const stageLeads = allLeads.filter(lead => lead.status === group.status);
      
      // Calculate the value for this stage more carefully
      const stageValue = stageLeads.reduce((total, lead) => {
        // Ensure we're using a valid number for estimatedValue
        const value = typeof lead.estimatedValue === 'number' ? lead.estimatedValue : 0;
        return total + value;
      }, 0);
      
      // Calculate percentage of total pipeline
      // Special handling for stages:
      // - "new" stage gets 100% of the pipeline value
      // - "closed" stage gets 0%
      // - other stages get 0% since we're showing all value in "new" stage
      let stageValuePercentage = 0;
      
      if (group.status === "new") {
        // Assign 100% to the "new" stage
        stageValuePercentage = 100;
      } else if (group.status !== "closed") {
        // For all other active stages (not "new" and not "closed"), assign 0%
        stageValuePercentage = 0;
      }
      
      // Current period metrics
      const currentStageLeads = currentPeriodLeads.filter(lead => lead.status === group.status);
      const currentStageValue = currentStageLeads.reduce((total, lead) => {
        return total + (typeof lead.estimatedValue === 'number' ? lead.estimatedValue : 0);
      }, 0);
      
      // Previous period metrics
      const previousStageLeads = previousPeriodLeads.filter(lead => lead.status === group.status);
      const previousStageValue = previousStageLeads.reduce((total, lead) => {
        return total + (typeof lead.estimatedValue === 'number' ? lead.estimatedValue : 0);
      }, 0);
      
      // Calculate period-over-period changes
      const countChange = previousStageLeads.length > 0 
        ? Math.round(((currentStageLeads.length - previousStageLeads.length) / previousStageLeads.length) * 100)
        : 0;
      
      const valueChange = previousStageValue > 0 
        ? Math.round(((currentStageValue - previousStageValue) / previousStageValue) * 100)
        : 0;
      
      // Calculate average time in stage (for all leads currently in this stage)
      const avgTimeInStage = stageLeads.length > 0 
        ? stageLeads.reduce((total, lead) => {
            const leadCreatedAt = new Date(lead.createdAt);
            const leadUpdatedAt = lead.updatedAt ? new Date(lead.updatedAt) : leadCreatedAt;
            // Use the latest of created/updated date
            const lastUpdate = isAfter(leadUpdatedAt, leadCreatedAt) ? leadUpdatedAt : leadCreatedAt;
            const daysInStage = differenceInDays(new Date(), lastUpdate);
            return total + daysInStage;
          }, 0) / stageLeads.length
        : 0;
      
      // Is this stage on track based on ideal stage time?
      const stageHealthStatus = 
        group.status === "closed" ? "completed" :
        avgTimeInStage <= group.idealStageTime ? "on-track" :
        avgTimeInStage <= group.idealStageTime * 1.5 ? "at-risk" : "delayed";
      
      return {
        ...group,
        leads: stageLeads,
        leadCount: stageLeads.length,
        stageValue,
        stageValuePercentage: stageValuePercentage,
        countChange,
        valueChange,
        avgTimeInStage: Math.round(avgTimeInStage),
        stageHealthStatus
      };
    });
  }, [allLeads, currentPeriodStart, previousPeriodStart, today]);
  
  // Get leads by status (for display in each column)
  const getLeadsByStatus = (status: string) => {
    return allLeads.filter(lead => lead.status === status);
  };
  
  // Format date for display
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = Math.round((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
    return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
  };
  
  // Navigate to leads page filtered by status
  const handleViewMoreClick = (status: string) => {
    navigate(`/leads?status=${status}`);
  };
  
  // Handle card click to view lead details
  const handleLeadClick = (leadId: number) => {
    navigate(`/leads?lead=${leadId}`);
  };

  // Get health indicator color
  const getHealthColor = (healthStatus: string) => {
    switch (healthStatus) {
      case "on-track": return "bg-green-500";
      case "at-risk": return "bg-amber-500";
      case "delayed": return "bg-red-500";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading text-neutral-900">Deal Pipeline</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs gap-1">
              <DollarSignIcon className="h-3 w-3" />
              {!isLoading && 
                // Show total value of all active leads (excluding closed)
                allLeads.filter(lead => lead.status !== "closed")
                .reduce((total, lead) => {
                  const value = typeof lead.estimatedValue === 'number' ? lead.estimatedValue : 0;
                  return total + value;
                }, 0)
                .toLocaleString('en-US', { 
                  style: 'currency', 
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })
              }
            </Badge>
            <Badge variant="outline" className="text-xs gap-1">
              <BarChart3Icon className="h-3 w-3" />
              {!isLoading && pipelineMetrics.reduce((total, stage) => total + stage.leadCount, 0)} Leads
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 mt-2">
          {pipelineMetrics.map((stage) => (
            <div key={`progress-${stage.status}`} className="relative">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="w-full cursor-help"
                      onMouseEnter={() => setActiveTooltip(stage.status)}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <Progress 
                        value={stage.stageValuePercentage} 
                        className="h-2" 
                        indicatorColor={getHealthColor(stage.stageHealthStatus)}
                      />
                      <div className="flex justify-between items-center mt-1 text-[10px] text-neutral-500">
                        <div className="flex items-center gap-0.5">
                          {stage.icon}
                          <span>{stage.leadCount}</span>
                        </div>
                        <span>{stage.stageValuePercentage}%</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="p-0">
                    <div className="p-2 text-xs space-y-1">
                      <p className="font-semibold">{stage.label} ({stage.leadCount})</p>
                      <p>{stage.stageValue.toLocaleString('en-US', { 
                        style: 'currency', 
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      })}</p>
                      <div className="flex justify-between gap-3">
                        <span>30-day trend:</span>
                        <ValueChange value={stage.valueChange} isPercentage />
                      </div>
                      <div className="flex justify-between gap-3">
                        <span>Avg. time in stage:</span>
                        <span className={stage.stageHealthStatus === "delayed" ? "text-red-500" : ""}>{stage.avgTimeInStage} days</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex overflow-x-auto pb-4 custom-scrollbar">
          <div className="grid grid-flow-col auto-cols-min gap-4 min-w-full md:min-w-0">
            {statusGroups.map(group => {
              const stageMetrics = pipelineMetrics.find(m => m.status === group.status);
              return (
                <div key={group.status} className="w-[260px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <h3 className="font-medium text-neutral-700">{group.label}</h3>
                      {stageMetrics && stageMetrics.valueChange !== 0 && (
                        <ValueChange value={stageMetrics.valueChange} isPercentage />
                      )}
                    </div>
                    <StatusBadge status={group.status} count={getLeadsByStatus(group.status).length} />
                  </div>
                  
                  <div className="space-y-3">
                    {getLeadsByStatus(group.status).slice(0, 3).map(lead => {
                      // Calculate days in current stage
                      const updatedAt = new Date(lead.updatedAt || lead.createdAt);
                      const daysInStage = differenceInDays(new Date(), updatedAt);
                      
                      // Determine stage health
                      const stageInfo = pipelineMetrics.find(m => m.status === group.status);
                      const isDelayed = stageInfo && daysInStage > stageInfo.idealStageTime;
                      
                      return (
                        <div 
                          key={lead.id} 
                          className="bg-neutral-50 p-3 rounded border border-neutral-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleLeadClick(lead.id)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-neutral-800 truncate max-w-[180px]">
                              {lead.propertyAddress || "Unknown Address"}
                            </h4>
                            {isDelayed && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">
                                      This lead has been in {group.label} for {daysInStage} days, 
                                      which is longer than the ideal {stageInfo?.idealStageTime} days.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex justify-between items-center mt-2 text-xs">
                            <span className="text-neutral-500 truncate max-w-[150px]">
                              {lead.ownerName || "Unknown"}
                            </span>
                            <span className="font-medium">
                              {lead.estimatedValue?.toLocaleString('en-US', { 
                                style: 'currency', 
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }) || "$0"}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-neutral-500 flex items-center gap-1">
                              <Clock8Icon className="h-3 w-3" />
                              {daysInStage === 0 ? "Today" : `${daysInStage}d in stage`}
                            </span>
                            <span className="flex space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className="p-1 text-neutral-500 hover:text-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('schedule-call', { detail: lead }));
                                      }}
                                    >
                                      <PhoneIcon className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Schedule a call</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button 
                                      className="p-1 text-neutral-500 hover:text-primary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent('edit-lead', { detail: lead }));
                                      }}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Edit lead</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    
                    {getLeadsByStatus(group.status).length === 0 && (
                      <div className="bg-neutral-50 p-3 rounded border border-neutral-200 text-center">
                        <p className="text-sm text-neutral-500">No leads in this stage</p>
                      </div>
                    )}
                    
                    {getLeadsByStatus(group.status).length > 3 && (
                      <div className="text-center">
                        <button 
                          className="text-xs text-primary hover:text-primary-dark font-medium"
                          onClick={() => handleViewMoreClick(group.status)}
                        >
                          View {getLeadsByStatus(group.status).length - 3} more
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
