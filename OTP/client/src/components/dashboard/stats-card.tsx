import { ReactNode } from "react";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: {
    value?: number;
    timeframe: string;
  };
  previousValue?: number;
  currentValue?: number;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  change,
  previousValue,
  currentValue, 
  iconBgColor = "bg-primary bg-opacity-10", 
  iconColor = "text-primary" 
}: StatsCardProps) {
  // Calculate percentage change if previous and current values are provided
  let percentChange: number | undefined;
  let timeframe = "previous period";
  
  if (previousValue !== undefined && currentValue !== undefined && previousValue !== 0) {
    percentChange = Math.round(((currentValue - previousValue) / previousValue) * 100);
    
    // Use the timeframe from change prop if available
    if (change?.timeframe) {
      timeframe = change.timeframe;
    }
  }
  
  // Use provided change or calculated percentChange
  const displayChange = change?.value !== undefined ? change.value : percentChange;
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${iconBgColor} ${iconColor}`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-neutral-500">{title}</h3>
            <p className="text-2xl font-semibold text-neutral-900">{value}</p>
          </div>
        </div>
        
        {displayChange !== undefined && (
          <div className={`mt-2 flex items-center text-xs ${
            displayChange >= 0 ? "text-green-600" : "text-red-600"
          }`}>
            {displayChange >= 0 ? (
              <ArrowUpIcon className="mr-1 h-3 w-3" />
            ) : (
              <ArrowDownIcon className="mr-1 h-3 w-3" />
            )}
            <span>{Math.abs(displayChange)}% from {timeframe}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
