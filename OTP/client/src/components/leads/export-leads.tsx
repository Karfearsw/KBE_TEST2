import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@shared/schema";

interface ExportLeadsProps {
  leads: Lead[];
  isLoading: boolean;
}

export function ExportLeads({ leads, isLoading }: ExportLeadsProps) {
  // Function to convert leads to CSV format
  const convertToCSV = (leads: Lead[]) => {
    if (leads.length === 0) return '';
    
    // Define headers from the first lead
    const headers = [
      'propertyAddress',
      'city',
      'state',
      'zip',
      'ownerName',
      'ownerPhone',
      'ownerEmail',
      'status',
      'estimatedValue',
      'motivationLevel',
      'propertyType',
      'source',
      'notes'
    ];
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    leads.forEach(lead => {
      const row = headers.map(header => {
        // Get the value for this header
        const value = lead[header as keyof Lead];
        
        // Convert to string and handle special cases
        let valueStr = String(value ?? '');
        
        // Escape quotes and wrap in quotes if contains commas or quotes
        if (valueStr.includes(',') || valueStr.includes('"')) {
          valueStr = '"' + valueStr.replace(/"/g, '""') + '"';
        }
        
        return valueStr;
      });
      
      csv += row.join(',') + '\n';
    });
    
    return csv;
  };
  
  // Handle export button click
  const handleExport = () => {
    if (leads.length === 0) return;
    
    const csv = convertToCSV(leads);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flipstackk_leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isLoading || leads.length === 0}
      className="flex items-center"
    >
      <Download className="mr-2 h-4 w-4" />
      Export Leads
    </Button>
  );
}