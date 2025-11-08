import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@shared/schema";
// Using Layout component instead of direct sidebar/nav imports
import { LeadsTable } from "@/components/leads/leads-table";
import { LeadFilters } from "@/components/leads/lead-filters";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog-new";
import { ImportLeadsDialog } from "@/components/leads/import-leads-dialog";
import { ExportLeads } from "@/components/leads/export-leads";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserSearch, Upload } from "lucide-react";
// Import the proper edit lead dialog component
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
// Using a custom UI for scheduling calls
import { CallDialer as ScheduleCallDialog } from "@/components/calls/call-dialer";
import { useToast } from "@/hooks/use-toast";

export default function LeadsPage() {
  const { toast } = useToast();
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false);
  const [importLeadsDialogOpen, setImportLeadsDialogOpen] = useState(false);
  const [editLeadDialogOpen, setEditLeadDialogOpen] = useState(false);
  const [scheduleCallDialogOpen, setScheduleCallDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: [] as string[],
    search: "",
    assignedToUserId: undefined as number | undefined,
    createdByUserId: undefined as number | undefined,
    sortBy: "createdAt",
    sortOrder: "desc" as "asc" | "desc",
  });
  
  // Fetch leads with filters
  const { data: leads = [], isLoading, refetch } = useQuery<Lead[]>({
    queryKey: ["/api/leads", filters], // Include filters in the queryKey for auto-refetching
    queryFn: async () => {
      // Build query string
      const params = new URLSearchParams();
      
      // Add filters to query params
      if (filters.status.length > 0) {
        params.set('status', filters.status.join(','));
      }
      
      if (filters.search) {
        params.set('search', filters.search);
      }
      
      if (filters.assignedToUserId !== undefined) {
        params.set('assignedToUserId', filters.assignedToUserId.toString());
      }
      
      if (filters.createdByUserId !== undefined) {
        params.set('createdByUserId', filters.createdByUserId.toString());
      }
      
      params.set('sortBy', filters.sortBy);
      params.set('sortOrder', filters.sortOrder);
      
      console.log("Sending filter params:", Object.fromEntries(params.entries()));
      
      // Make the request
      const response = await fetch(`/api/leads?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }
      
      return response.json();
    },
  });
  
  // Trigger refetch when filters change
  useEffect(() => {
    console.log("Filters changed, refetching leads:", filters);
    refetch();
  }, [filters, refetch]);

  // Listen for custom events from the leads table dropdown
  useEffect(() => {
    const handleEditLead = (event: CustomEvent<Lead>) => {
      const lead = event.detail;
      setSelectedLead(lead);
      setEditLeadDialogOpen(true);
    };

    const handleScheduleCall = (event: CustomEvent<Lead>) => {
      const lead = event.detail;
      setSelectedLead(lead);
      setScheduleCallDialogOpen(true);
    };

    window.addEventListener('edit-lead', handleEditLead as EventListener);
    window.addEventListener('schedule-call', handleScheduleCall as EventListener);

    return () => {
      window.removeEventListener('edit-lead', handleEditLead as EventListener);
      window.removeEventListener('schedule-call', handleScheduleCall as EventListener);
    };
  }, []);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Leads"
        description="Manage and track your property leads"
        actions={
          <>
            <ExportLeads 
              leads={leads} 
              isLoading={isLoading}
            />
            <Button 
              variant="outline" 
              className="flex items-center"
              onClick={() => setImportLeadsDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import Leads
            </Button>
            <Button 
              className="flex items-center bg-primary hover:bg-primary/90"
              onClick={() => setAddLeadDialogOpen(true)}
            >
              <UserSearch className="mr-2 h-4 w-4" />
              Add New Lead
            </Button>
          </>
        }
      />
      
      {/* Filters */}
      <LeadFilters 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />
      
      {/* Leads Table */}
      <LeadsTable 
        leads={leads} 
        isLoading={isLoading} 
      />
      
      {/* Add Lead Dialog */}
      <AddLeadDialog 
        open={addLeadDialogOpen} 
        onOpenChange={setAddLeadDialogOpen} 
      />
      
      {/* Import Leads Dialog */}
      <ImportLeadsDialog
        open={importLeadsDialogOpen}
        onOpenChange={setImportLeadsDialogOpen}
      />
      
      {/* Edit Lead Dialog */}
      {editLeadDialogOpen && selectedLead && (
        <EditLeadDialog
          open={editLeadDialogOpen}
          onOpenChange={setEditLeadDialogOpen}
          lead={selectedLead}
        />
      )}
      
      {/* Schedule Call Dialog - Simulate scheduling with call dialer */}
      {scheduleCallDialogOpen && selectedLead && (
        <ScheduleCallDialog
          open={scheduleCallDialogOpen}
          onOpenChange={setScheduleCallDialogOpen}
          leadId={selectedLead.id}
          phoneNumber={selectedLead.ownerPhone || ''}
          leadName={selectedLead.ownerName || ''}
        />
      )}
    </div>
  );
}
