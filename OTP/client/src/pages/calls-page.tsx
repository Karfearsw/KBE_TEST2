import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Call, ScheduledCall, Lead } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ScheduledCallsTable } from "@/components/calls/scheduled-calls-table";
import { CallHistoryTable } from "@/components/calls/call-history-table";
import { ScheduleCallDialog } from "@/components/calls/schedule-call-dialog";
import { CallDialer } from "@/components/calls/call-dialer";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  CalendarPlus, 
  Phone, 
  ClipboardList,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CallsPage() {
  const [scheduleCallDialogOpen, setScheduleCallDialogOpen] = useState(false);
  const [callDialerOpen, setCallDialerOpen] = useState(false);
  const [isLeadSearchOpen, setIsLeadSearchOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Fetch scheduled calls
  const { data: scheduledCalls = [], isLoading: scheduledCallsLoading } = useQuery<ScheduledCall[]>({
    queryKey: ["/api/scheduled-calls"],
  });
  
  // Fetch call history
  const { data: callHistory = [], isLoading: callHistoryLoading } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });
  
  // Fetch leads for the search
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Handle selecting a lead to call
  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsLeadSearchOpen(false);
    setCallDialerOpen(true);
  };
  
  // Open the call dialer with a selected lead
  const handleOpenCallDialer = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
    }
    setCallDialerOpen(true);
  };
  
  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="main-content flex-1 md:ml-64 min-h-screen p-4 md:p-6 overflow-auto">
        <PageHeader
          title="Calls"
          description="Manage scheduled calls and call history"
          actions={
            <div className="flex space-x-2">
              <Dialog open={isLeadSearchOpen} onOpenChange={setIsLeadSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Make a Call
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Lead to Call</DialogTitle>
                  </DialogHeader>
                  <Command>
                    <CommandInput placeholder="Search leads..." />
                    <CommandList>
                      <CommandEmpty>No leads found.</CommandEmpty>
                      <CommandGroup>
                        <ScrollArea className="h-72">
                          {leads.map((lead) => (
                            <CommandItem
                              key={lead.id}
                              value={`${lead.ownerName}-${lead.propertyAddress}`}
                              onSelect={() => handleSelectLead(lead)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{lead.ownerName}</span>
                                <span className="text-xs text-neutral-500">
                                  {lead.propertyAddress}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {lead.ownerPhone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </DialogContent>
              </Dialog>
              
              <Button 
                className="flex items-center bg-primary hover:bg-primary-dark"
                onClick={() => setScheduleCallDialogOpen(true)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Schedule Call
              </Button>
            </div>
          }
        />
        
        <Tabs defaultValue="scheduled" className="mt-6">
          <TabsList className="mb-4">
            <TabsTrigger value="scheduled" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Scheduled Calls
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center">
              <ClipboardList className="mr-2 h-4 w-4" />
              Call History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="scheduled">
            <ScheduledCallsTable 
              scheduledCalls={scheduledCalls} 
              isLoading={scheduledCallsLoading}
              onCall={handleOpenCallDialer}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <CallHistoryTable 
              calls={callHistory} 
              isLoading={callHistoryLoading} 
            />
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
      
      {/* Schedule Call Dialog */}
      <ScheduleCallDialog 
        open={scheduleCallDialogOpen} 
        onOpenChange={setScheduleCallDialogOpen} 
      />
      
      {/* Call Dialer */}
      <CallDialer
        open={callDialerOpen}
        onOpenChange={setCallDialerOpen}
        leadId={selectedLead?.id}
        phoneNumber={selectedLead?.ownerPhone || ""}
        leadName={selectedLead?.ownerName}
      />
    </div>
  );
}
