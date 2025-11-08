import { useWebSocket } from "@/hooks/use-websocket";
import { Signal, WifiOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { connected } = useWebSocket();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {connected ? (
              <Signal className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>
            {connected 
              ? "Connected - receiving real-time updates" 
              : "Disconnected - real-time updates paused"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}