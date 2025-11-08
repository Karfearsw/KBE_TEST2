import { useState, useEffect } from 'react';
import { useWebSocket, WSMessage } from '@/hooks/use-websocket';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

export function ActivityNotification() {
  const { lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<WSMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  // Add new messages to the notifications list
  useEffect(() => {
    if (lastMessage) {
      setNotifications(prev => [lastMessage, ...prev.slice(0, 9)]); // Keep last 10
      if (!open) {
        setUnread(prev => prev + 1);
      }
    }
  }, [lastMessage, open]);

  // Clear unread count when popover is opened
  useEffect(() => {
    if (open) {
      setUnread(0);
    }
  }, [open]);

  // Format activity message 
  const formatActivity = (message: WSMessage) => {
    switch (message.type) {
      case 'activity_created':
        return message.data.description;
      case 'lead_created':
        return `New lead created: ${message.data.propertyAddress}`;
      case 'lead_updated':
        return `Lead updated: ${message.data.propertyAddress}`;
      case 'call_created':
        return `Call logged for ${message.data.leadName || 'a lead'}`;
      case 'call_scheduled':
        return `Call scheduled for ${message.data.leadName || 'a lead'}`;
      default:
        return 'Activity received';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch {
      return format(new Date(), 'h:mm a');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
          {unread > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-primary rounded-full">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="font-medium">Recent Activity</h3>
        </div>
        <ScrollArea className="h-60">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No recent activity
            </div>
          ) : (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {notifications.map((notification, index) => (
                <div key={index} className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <div className="text-sm">{formatActivity(notification)}</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {formatTimestamp(notification.data.createdAt || new Date())}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}