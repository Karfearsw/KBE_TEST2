import { useState } from "react";
import { Lead } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneLink, formatEmailLink, formatAddressLink, formatCurrency, formatDate, formatSource } from "@/lib/format-utils";
import { formatLeadId } from "@/lib/lead-id-utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Phone, 
  Edit, 
  Trash2,
  CalendarPlus,
  MapPin,
  Mail
} from "lucide-react";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
}

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Delete lead mutation
  const deleteLead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Lead deleted",
        description: "The lead has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting lead",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle delete lead
  const handleDeleteLead = (id: number) => {
    if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      deleteLead.mutate(id);
    }
  };
  
  // Render skeletons when loading
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm mt-4 overflow-hidden">
        <div className="overflow-x-auto scrollable-page">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Lead ID</TableHead>
                <TableHead className="whitespace-nowrap">Property Address</TableHead>
                <TableHead className="whitespace-nowrap">Owner</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Value</TableHead>
                <TableHead className="whitespace-nowrap">Added</TableHead>
                <TableHead className="whitespace-nowrap">Source</TableHead>
                <TableHead className="whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 dark:bg-neutral-700" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 dark:bg-neutral-700" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  
  // Render empty state if no leads
  if (leads.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm mt-4 p-8 text-center">
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">No leads found</h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Start by adding a new lead or importing leads from your existing database.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm mt-4 overflow-hidden">
      <div className="overflow-x-auto scrollable-page">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Lead ID</TableHead>
              <TableHead className="whitespace-nowrap">Property Address</TableHead>
              <TableHead className="whitespace-nowrap">Owner</TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="whitespace-nowrap">Value</TableHead>
              <TableHead className="whitespace-nowrap">Added</TableHead>
              <TableHead className="whitespace-nowrap">Source</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map(lead => (
              <TableRow key={lead.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                <TableCell className="font-medium">
                  <div className="text-primary font-mono bg-primary/5 dark:bg-primary/10 px-2 py-1 rounded-md inline-block text-sm">
                    {formatLeadId(lead.id, lead.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div className="group">
                    <a href={formatAddressLink(lead.propertyAddress) || "#"} 
                       className="text-neutral-900 dark:text-neutral-100 group-hover:text-primary transition-colors"
                       target="_blank"
                       rel="noopener noreferrer">
                      {lead.propertyAddress}
                    </a>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center mt-1">
                      {lead.city}, {lead.state} {lead.zip}
                      <a href={formatAddressLink(`${lead.propertyAddress}, ${lead.city}, ${lead.state} ${lead.zip}`) || "#"} 
                         className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                         target="_blank"
                         rel="noopener noreferrer">
                        <MapPin className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {lead.ownerName}
                  {lead.ownerPhone && (
                    <div className="text-xs">
                      <a 
                        href={formatPhoneLink(lead.ownerPhone) || "#"} 
                        className="text-primary hover:underline flex items-center"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {lead.ownerPhone}
                      </a>
                    </div>
                  )}
                  {lead.ownerEmail && (
                    <div className="text-xs mt-1">
                      <a 
                        href={formatEmailLink(lead.ownerEmail) || "#"} 
                        className="text-primary hover:underline flex items-center"
                      >
                        <Mail className="h-3 w-3 mr-1" />
                        {lead.ownerEmail}
                      </a>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell>
                  {formatCurrency(lead.estimatedValue)}
                </TableCell>
                <TableCell>{formatDate(lead.createdAt)}</TableCell>
                <TableCell>{formatSource(lead.source)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {lead.ownerPhone ? (
                        <DropdownMenuItem className="flex items-center cursor-pointer" asChild>
                          <a href={formatPhoneLink(lead.ownerPhone) || "#"}>
                            <Phone className="mr-2 h-4 w-4" />
                            <span>Call Owner</span>
                          </a>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="flex items-center opacity-50" disabled>
                          <Phone className="mr-2 h-4 w-4" />
                          <span>Call Owner</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="flex items-center cursor-pointer"
                        onClick={() => window.dispatchEvent(new CustomEvent('schedule-call', { detail: lead }))}
                      >
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>Schedule Call</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="flex items-center cursor-pointer"
                        onClick={() => window.dispatchEvent(new CustomEvent('edit-lead', { detail: lead }))}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit Lead</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="flex items-center cursor-pointer text-red-600 focus:text-red-600" 
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Lead</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
