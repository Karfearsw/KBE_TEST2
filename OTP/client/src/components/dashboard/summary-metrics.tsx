import { useQuery } from "@tanstack/react-query";
import { 
  ArrowUpRightIcon, 
  ArrowDownRightIcon,
  TrendingUpIcon, 
  PercentIcon, 
  LineChartIcon, 
  DollarSignIcon,
  PieChartIcon,
  Minus
} from "lucide-react";
import { Lead, Call, Activity } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { subDays, isAfter, isBefore, startOfDay, endOfDay, format } from "date-fns";

// Helper component to display percentage change with proper coloring and icon
const PercentageChange = ({ value, label, inverse = false }: { value: number, label?: string, inverse?: boolean }) => {
  // For some metrics, a higher number is worse (like days on market)
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;
  
  let textColor = "text-gray-500";
  let Icon = Minus;
  
  if (!isNeutral) {
    textColor = isPositive ? "text-green-600" : "text-red-600";
    Icon = isPositive ? ArrowUpRightIcon : ArrowDownRightIcon;
  }
  
  return (
    <div className={`flex items-center ${textColor} text-xs font-medium`}>
      <Icon className="h-3 w-3 mr-1" />
      <span>{Math.abs(value)}%{label ? ` ${label}` : ''}</span>
    </div>
  );
};

export function SummaryMetrics() {
  // Get current date and date ranges for period-over-period comparison
  const today = new Date();
  const currentPeriodStart = subDays(today, 30); // Last 30 days
  const previousPeriodStart = subDays(currentPeriodStart, 30); // 30 days before that
  
  // Fetch lead data for metrics calculation
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Fetch call data for call metrics
  const { data: calls = [], isLoading: isLoadingCalls } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });
  
  // Fetch activity data for trend analysis
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });
  
  const isLoading = isLoadingLeads || isLoadingCalls || isLoadingActivities;
  
  // Filter leads and calls by period for trend analysis
  const currentPeriodLeads = leads.filter(lead => {
    const createdAt = new Date(lead.createdAt);
    return isAfter(createdAt, currentPeriodStart) && isBefore(createdAt, today);
  });
  
  const previousPeriodLeads = leads.filter(lead => {
    const createdAt = new Date(lead.createdAt);
    return isAfter(createdAt, previousPeriodStart) && isBefore(createdAt, currentPeriodStart);
  });
  
  const currentPeriodCalls = calls.filter(call => {
    const callTime = new Date(call.callTime);
    return isAfter(callTime, currentPeriodStart) && isBefore(callTime, today);
  });
  
  const previousPeriodCalls = calls.filter(call => {
    const callTime = new Date(call.callTime);
    return isAfter(callTime, previousPeriodStart) && isBefore(callTime, currentPeriodStart);
  });
  
  // Calculate current metrics
  const totalEstimatedValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const currentPeriodValue = currentPeriodLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const previousPeriodValue = previousPeriodLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  
  // Calculate period-over-period changes
  const valueTrend = previousPeriodValue > 0 
    ? Math.round(((currentPeriodValue - previousPeriodValue) / previousPeriodValue) * 100) 
    : 0;
  
  const leadCountTrend = previousPeriodLeads.length > 0 
    ? Math.round(((currentPeriodLeads.length - previousPeriodLeads.length) / previousPeriodLeads.length) * 100) 
    : 0;
  
  const callCountTrend = previousPeriodCalls.length > 0 
    ? Math.round(((currentPeriodCalls.length - previousPeriodCalls.length) / previousPeriodCalls.length) * 100) 
    : 0;
  
  // Calculate total estimated value of active deals
  const activeDeals = leads.filter(lead => ["negotiation", "under-contract"].includes(lead.status || ""));
  const activeDealsValue = activeDeals.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const activeDealsPercent = totalEstimatedValue > 0 ? Math.round((activeDealsValue / totalEstimatedValue) * 100) : 0;
  
  // Calculate active deals trend
  const currentPeriodActiveDeals = currentPeriodLeads.filter(lead => 
    ["negotiation", "under-contract"].includes(lead.status || "")
  );
  const previousPeriodActiveDeals = previousPeriodLeads.filter(lead => 
    ["negotiation", "under-contract"].includes(lead.status || "")
  );
  
  const activeDealsTrend = previousPeriodActiveDeals.length > 0 
    ? Math.round(((currentPeriodActiveDeals.length - previousPeriodActiveDeals.length) / previousPeriodActiveDeals.length) * 100) 
    : 0;
  
  // Calculate high motivation leads percentage
  const highMotivationLeads = leads.filter(lead => lead.motivationLevel === "high").length;
  const motivationPercentage = leads.length > 0 ? Math.round((highMotivationLeads / leads.length) * 100) : 0;
  
  // Calculate motivation trend
  const currentHighMotivation = currentPeriodLeads.filter(lead => lead.motivationLevel === "high").length;
  const currentMotivationPercent = currentPeriodLeads.length > 0 
    ? Math.round((currentHighMotivation / currentPeriodLeads.length) * 100) 
    : 0;
  
  const previousHighMotivation = previousPeriodLeads.filter(lead => lead.motivationLevel === "high").length;
  const previousMotivationPercent = previousPeriodLeads.length > 0 
    ? Math.round((previousHighMotivation / previousPeriodLeads.length) * 100) 
    : 0;
  
  const motivationTrend = previousMotivationPercent > 0 
    ? currentMotivationPercent - previousMotivationPercent 
    : 0;
  
  // Calculate deal progress by status
  const closedDeals = leads.filter(lead => lead.status === "closed").length;
  const underContractDeals = leads.filter(lead => lead.status === "under-contract").length;
  const negotiationDeals = leads.filter(lead => lead.status === "negotiation").length;
  const dealProgress = leads.length > 0 ? Math.round((closedDeals / leads.length) * 100) : 0;
  
  // Calculate closing rate trend
  const currentClosedDeals = currentPeriodLeads.filter(lead => lead.status === "closed").length;
  const currentClosingRate = currentPeriodLeads.length > 0 
    ? Math.round((currentClosedDeals / currentPeriodLeads.length) * 100) 
    : 0;
  
  const previousClosedDeals = previousPeriodLeads.filter(lead => lead.status === "closed").length;
  const previousClosingRate = previousPeriodLeads.length > 0 
    ? Math.round((previousClosedDeals / previousPeriodLeads.length) * 100) 
    : 0;
  
  const closingRateTrend = previousClosingRate > 0 
    ? currentClosingRate - previousClosingRate 
    : 0;
  
  // Calculate average call effectiveness
  const successfulCalls = calls.filter(call => call.outcome === "successful").length;
  const callEffectiveness = calls.length > 0 ? Math.round((successfulCalls / calls.length) * 100) : 0;
  
  // Calculate call effectiveness trend
  const currentSuccessfulCalls = currentPeriodCalls.filter(call => call.outcome === "successful").length;
  const currentCallEffectiveness = currentPeriodCalls.length > 0 
    ? Math.round((currentSuccessfulCalls / currentPeriodCalls.length) * 100) 
    : 0;
  
  const previousSuccessfulCalls = previousPeriodCalls.filter(call => call.outcome === "successful").length;
  const previousCallEffectiveness = previousPeriodCalls.length > 0 
    ? Math.round((previousSuccessfulCalls / previousPeriodCalls.length) * 100) 
    : 0;
  
  const callEffectivenessTrend = previousCallEffectiveness > 0 
    ? currentCallEffectiveness - previousCallEffectiveness 
    : 0;
  
  // Calculate average property value
  const avgPropertyValue = leads.length > 0 
    ? Math.round(totalEstimatedValue / leads.length) 
    : 0;
  
  // Calculate average property value trend
  const currentAvgValue = currentPeriodLeads.length > 0 
    ? Math.round(currentPeriodValue / currentPeriodLeads.length) 
    : 0;
  
  const previousAvgValue = previousPeriodLeads.length > 0 
    ? Math.round(previousPeriodValue / previousPeriodLeads.length) 
    : 0;
  
  const avgValueTrend = previousAvgValue > 0 
    ? Math.round(((currentAvgValue - previousAvgValue) / previousAvgValue) * 100) 
    : 0;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading flex items-center justify-between">
            Pipeline Value
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <DollarSignIcon className="h-5 w-5 text-primary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">Total estimated value of all leads in the pipeline</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Total value of all leads</span>
            {!isLoading && (
              <Badge variant={valueTrend >= 0 ? "success" : "destructive"} className="text-[10px]">
                <PercentageChange value={valueTrend} label="vs prev. period" />
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neutral-900">
            {formatCurrency(totalEstimatedValue)}
          </div>
          <div className="flex justify-between items-center">
            <div className="text-xs text-neutral-500 mt-1">
              {leads.length} total leads in pipeline
            </div>
            {!isLoading && leadCountTrend !== 0 && (
              <div className="text-xs">
                <PercentageChange value={leadCountTrend} />
              </div>
            )}
          </div>
          <Progress 
            value={activeDealsPercent} 
            className="h-2 mt-3" 
            indicatorColor={activeDealsPercent > 50 ? "bg-green-500" : "bg-amber-500"}
          />
        </CardContent>
        <CardFooter className="pt-0 pb-3">
          <div className="flex flex-col w-full">
            <div className="flex items-center text-sm text-green-600">
              <ArrowUpRightIcon className="h-4 w-4 mr-1" />
              <span>{formatCurrency(activeDealsValue)} in {activeDeals.length} active deals</span>
            </div>
            {!isLoading && activeDealsTrend !== 0 && (
              <div className="text-xs mt-1">
                <PercentageChange value={activeDealsTrend} label="active deals" />
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading flex items-center justify-between">
            Hot Lead Ratio
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <PercentIcon className="h-5 w-5 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">Percentage of leads with high motivation level</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Highly motivated leads</span>
            {!isLoading && (
              <Badge variant={motivationTrend >= 0 ? "success" : "destructive"} className="text-[10px]">
                <PercentageChange value={motivationTrend} label="pts" />
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neutral-900">
            {motivationPercentage}%
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex justify-between">
            <span>{highMotivationLeads} high motivation leads</span>
            {!isLoading && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="underline decoration-dotted">30d trend</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>Current period: {currentMotivationPercent}%</p>
                      <p>Previous period: {previousMotivationPercent}%</p>
                      <p>Change: {motivationTrend > 0 ? "+" : ""}{motivationTrend}%</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Progress 
            value={motivationPercentage} 
            className="h-2 mt-3" 
            indicatorColor={motivationPercentage > 30 ? "bg-green-500" : "bg-amber-500"}
          />
        </CardContent>
        <CardFooter className="pt-0 pb-3">
          <div className="flex w-full justify-between items-center">
            <span className="text-sm text-neutral-600">
              {highMotivationLeads} of {leads.length} total leads
            </span>
            {!isLoading && (
              <span className="text-xs">
                <PercentageChange value={leadCountTrend} />
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-heading flex items-center justify-between">
            Deal Closing Rate
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <PieChartIcon className="h-5 w-5 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="w-[200px] text-xs">Percentage of leads that reached closing status</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>Closed deals performance</span>
            {!isLoading && (
              <Badge variant={closingRateTrend >= 0 ? "success" : "destructive"} className="text-[10px]">
                <PercentageChange value={closingRateTrend} label="pts" />
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-neutral-900">
            {dealProgress}%
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs text-neutral-500 mt-1">
            <div>
              <span className="font-medium text-blue-500">{negotiationDeals}</span> negotiating
            </div>
            <div>
              <span className="font-medium text-green-500">{underContractDeals}</span> contracts
            </div>
            <div>
              <span className="font-medium text-primary">{closedDeals}</span> closed
            </div>
          </div>
          <Progress 
            value={dealProgress} 
            className="h-2 mt-3" 
            indicatorColor={dealProgress > 20 ? "bg-green-500" : "bg-amber-500"}
          />
        </CardContent>
        <CardFooter className="pt-0 pb-3">
          <div className="grid grid-cols-2 gap-1 w-full text-xs">
            <div className="text-neutral-600">
              Avg. value: <span className="font-semibold">{formatCurrency(avgPropertyValue)}</span>
              {!isLoading && avgValueTrend !== 0 && (
                <span className="ml-1">
                  <PercentageChange value={avgValueTrend} />
                </span>
              )}
            </div>
            <div className="text-neutral-600 text-right">
              Call success: <span className={`font-semibold ${callEffectiveness > 50 ? "text-green-600" : "text-neutral-600"}`}>{callEffectiveness}%</span>
              {!isLoading && callEffectivenessTrend !== 0 && (
                <span className="ml-1">
                  <PercentageChange value={callEffectivenessTrend} />
                </span>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}