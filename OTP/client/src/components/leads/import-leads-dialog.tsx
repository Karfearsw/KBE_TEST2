import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, AlertCircle, Download, FileText, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ImportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportLead {
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  status?: string;
  motivationLevel?: string;
  propertyType?: string;
  source?: string;
  notes?: string;
  arv?: number;
  repairCost?: number;
  estimatedValue?: number;
  assignedToUserId?: number;
  latitude?: number;
  longitude?: number;
}

// Sample CSV data for template
const SAMPLE_CSV_DATA = `propertyAddress,city,state,zip,ownerName,ownerPhone,ownerEmail,status,motivationLevel,propertyType,source,notes,arv,repairCost,estimatedValue
123 Main St,Los Angeles,CA,90001,John Smith,555-123-4567,john@example.com,new,medium,single-family,import,Needs roof repair,250000,30000,300000
456 Oak Dr,San Francisco,CA,94103,Jane Doe,555-987-6543,jane@example.com,new,high,multi-family,import,Motivated seller,500000,45000,600000`;

export function ImportLeadsDialog({ open, onOpenChange }: ImportLeadsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsedLeads, setParsedLeads] = useState<ImportLead[]>([]);
  const [currentTab, setCurrentTab] = useState<string>("upload");
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);

  // Reset state when dialog opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFile(null);
      setParseError(null);
      setIsUploading(false);
      setUploadProgress(0);
      setParsedLeads([]);
      setCurrentTab("upload");
    }
    onOpenChange(open);
  };

  // Download template CSV
  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    if (downloadLinkRef.current) {
      downloadLinkRef.current.href = url;
      downloadLinkRef.current.download = 'lead-import-template.csv';
      downloadLinkRef.current.click();
    }
    
    // Cleanup URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError(null);

    // Check if file is CSV
    if (!selectedFile.name.endsWith('.csv')) {
      setParseError('Only CSV files are supported');
      return;
    }

    // Parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        
        // Split by newlines, handling different line endings
        const lines = csv.split(/\r?\n/);
        
        // Handle quoted CSV properly
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = [];
          let inQuotes = false;
          let currentField = '';
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(currentField.trim());
              currentField = '';
            } else {
              currentField += char;
            }
          }
          
          // Add the last field
          result.push(currentField.trim());
          return result;
        };
        
        const headers = parseCSVLine(lines[0]).map(header => header.trim());
        console.log("CSV Headers:", headers);
        
        // Validate that we have all required headers (case-insensitive)
        const requiredHeaders = ['propertyAddress', 'city', 'state', 'zip', 'ownerName'];
        const lowercaseHeaders = headers.map(h => h.toLowerCase());
        
        // Case-insensitive header matching
        const headerMap: Record<string, string> = {};
        
        // Map standard field names to the actual headers in the CSV
        requiredHeaders.forEach(reqHeader => {
          const idx = lowercaseHeaders.findIndex(h => h === reqHeader.toLowerCase());
          if (idx >= 0) {
            headerMap[reqHeader] = headers[idx];
          }
        });
        
        console.log("Header mapping:", headerMap);
        
        const missingHeaders = requiredHeaders.filter(h => 
          !lowercaseHeaders.includes(h.toLowerCase()));
        
        if (missingHeaders.length > 0) {
          setParseError(`Missing required headers: ${missingHeaders.join(', ')}`);
          return;
        }

        // Parse rows
        const leads: ImportLead[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = parseCSVLine(lines[i]);
          const lead: ImportLead = {
            propertyAddress: '',
            city: '',
            state: '',
            zip: '',
            ownerName: ''
          };
          
          console.log(`Parsing line ${i}:`, values);
          
          // Map CSV values to lead properties
          headers.forEach((header, index) => {
            if (index < values.length) {
              let value = values[index];
              
              // Skip empty values
              if (!value) return;
              
              // Clean up quoted values
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.substring(1, value.length - 1);
              }
              
              // Handle special case for estimatedValue which might be formatted with $ and commas
              if (header.toLowerCase() === 'estimatedvalue' && value.includes('$')) {
                value = value.replace(/[$,]/g, '');
              }
              
              // Handle number fields
              if (['arv', 'repairCost', 'estimatedValue', 'assignedToUserId', 'latitude', 'longitude'].includes(header.toLowerCase())) {
                const cleanValue = value.replace(/[$,]/g, '');
                const numValue = cleanValue ? parseFloat(cleanValue) : undefined;
                if (!isNaN(numValue as number)) {
                  (lead as any)[header.toLowerCase()] = numValue;
                }
              } else {
                (lead as any)[header.toLowerCase()] = value;
              }
            }
          });
          
          // Set default values for missing fields
          lead.status = lead.status || 'new';
          lead.motivationLevel = lead.motivationLevel || 'unknown';
          lead.propertyType = lead.propertyType || 'single-family';
          lead.source = lead.source || 'import';
          
          // Handle potential state in zip field format (if state is empty but zip has format like "MA")
          if (!lead.state && lead.zip && lead.zip.length === 2) {
            lead.state = lead.zip;
            lead.zip = '';
          }
          
          console.log("Processed lead:", lead);
          
          // Validate required fields
          if (lead.propertyAddress && (lead.city || lead.state || lead.zip) && lead.ownerName) {
            leads.push(lead);
          }
        }
        
        setParsedLeads(leads);
        
        if (leads.length > 0) {
          console.log(`Successfully parsed ${leads.length} leads:`, leads.slice(0, 5));
          // Switch to preview tab if leads were parsed successfully
          setCurrentTab("preview");
          toast({
            title: `${leads.length} leads parsed successfully`,
            description: "You can now preview and import your leads",
            variant: "default"
          });
        } else {
          console.log("No leads were parsed from the CSV file.");
          toast({
            title: "No leads found",
            description: "The CSV file was processed but no valid leads were found.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setParseError('Failed to parse CSV file. Please check the format.');
      }
    };
    
    reader.readAsText(selectedFile);
  };

  // Import leads mutation
  const importLeadsMutation = useMutation({
    mutationFn: async (leads: ImportLead[]) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Process leads in batches to show progress
      const batchSize = 10;
      const totalLeads = leads.length;
      
      // Normalize phone numbers and format data properly
      const normalizedLeads = leads.map(lead => {
        // Format phone numbers consistently
        let formattedPhone = lead.ownerPhone || '';
        
        // Strip non-numeric characters from phone
        if (formattedPhone) {
          formattedPhone = formattedPhone.replace(/\D/g, '');
          
          // Ensure it has area code and proper format
          if (formattedPhone.length === 10) {
            formattedPhone = `${formattedPhone.slice(0, 3)}-${formattedPhone.slice(3, 6)}-${formattedPhone.slice(6)}`;
          } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            // Handle 1-xxx-xxx-xxxx format
            formattedPhone = `${formattedPhone.slice(1, 4)}-${formattedPhone.slice(4, 7)}-${formattedPhone.slice(7)}`;
          }
        }
        
        // Normalize status field 
        let status = (lead.status || 'new').toLowerCase();
        // Map common status values to our system values
        if (status === 'call') status = 'new';
        if (status === 'cold') status = 'cold';
        if (status === 'follow up') status = 'follow-up';
        
        // Convert values to appropriate types
        return {
          ...lead,
          ownerPhone: formattedPhone,
          status,
          estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : undefined,
          arv: lead.arv ? Number(lead.arv) : undefined,
          repairCost: lead.repairCost ? Number(lead.repairCost) : undefined,
          // Add any specific conversions needed for the attached CSV
          source: lead.source || 'import',
        };
      });
      
      // Import in batches
      // First get existing leads to avoid potential duplicates
      const existingLeads = await (await apiRequest("GET", "/api/leads")).json();
      
      // Create a map of existing property addresses to check for duplicates
      const existingAddresses = new Map();
      existingLeads.forEach((lead: any) => {
        // Create a key using address and zip for comparison
        const key = `${lead.propertyAddress}${lead.zip}`.toLowerCase().replace(/\s+/g, '');
        existingAddresses.set(key, lead);
      });
      
      // Filter out potential duplicates
      const newLeads = normalizedLeads.filter(lead => {
        const key = `${lead.propertyAddress}${lead.zip}`.toLowerCase().replace(/\s+/g, '');
        return !existingAddresses.has(key);
      });
      
      console.log(`Found ${normalizedLeads.length - newLeads.length} potential duplicates out of ${normalizedLeads.length} leads`);
      
      // Update total count based on filtered leads
      const filteredTotal = newLeads.length;
      
      if (filteredTotal === 0) {
        toast({
          title: "No new leads to import",
          description: "All leads in the CSV file already exist in the system.",
          variant: "default"
        });
        return 0;
      }
      
      for (let i = 0; i < filteredTotal; i += batchSize) {
        const batch = newLeads.slice(i, i + batchSize);
        // Make sure we're using proper endpoint and format
        console.log('Sending batch:', batch);
        const response = await apiRequest("POST", "/api/leads/import", { 
          leads: batch
        });
        
        // Enhanced response logging and error handling
        console.log('Import response status:', response.status, response.ok);
        
        if (!response.ok) {
          // Try to parse the error as JSON first
          let errorMessage = 'Unknown error occurred';
          
          try {
            const errorJson = await response.json();
            errorMessage = errorJson.message || errorJson.error || 'Import failed';
            
            // Handle authentication errors specifically
            if (response.status === 401) {
              console.error('Authentication error during import:', errorJson);
              // Redirect to auth page if not authenticated
              window.location.href = '/auth';
              throw new Error('Authentication required. Please log in.');
            }
          } catch (jsonError) {
            // If JSON parsing fails, fall back to text
            try {
              const errorText = await response.text();
              errorMessage = errorText || 'Import failed';
            } catch (textError) {
              // If all fails, use the status
              errorMessage = `Import failed with status ${response.status}`;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Update progress
        const progress = Math.min(100, Math.round(((i + batch.length) / filteredTotal) * 100));
        setUploadProgress(progress);
        
        // Short delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Return the number of newly imported leads
      return filteredTotal;
    },
    onSuccess: (totalImported) => {
      // Get a description based on the total
      const getDescription = () => {
        if (totalImported === 0) {
          return 'No new leads were imported. All leads already exist in the system.';
        } else if (totalImported < parsedLeads.length) {
          return `${totalImported} leads have been imported successfully. ${parsedLeads.length - totalImported} duplicates were skipped.`;
        } else {
          return `${totalImported} leads have been imported successfully.`;
        }
      };
      
      toast({
        title: totalImported > 0 ? "Import successful" : "Import complete",
        description: getDescription(),
        variant: totalImported > 0 ? "default" : undefined
      });
      
      // Refresh the leads data
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      
      // Short delay to show 100% completion before closing
      setTimeout(() => {
        handleOpenChange(false);
      }, 1000);
    },
    onError: (error: Error) => {
      setIsUploading(false);
      
      // Special handling for authentication errors
      if (error.message.includes('Authentication required')) {
        toast({
          title: "Authentication Required",
          description: "You need to be logged in to import leads. Redirecting to login page...",
          variant: "destructive",
        });
        
        // Short delay before redirecting to allow toast to be seen
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        return;
      }
      
      // Handle other errors
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle import submission
  const handleImport = () => {
    if (parsedLeads.length === 0) {
      setParseError('No leads to import');
      return;
    }
    
    importLeadsMutation.mutate(parsedLeads);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-heading text-neutral-900">Import Leads</DialogTitle>
          <DialogDescription>
            Import your leads from a CSV file or use our template to get started
          </DialogDescription>
          <Button 
            variant="ghost" 
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            onClick={() => handleOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        {parseError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{parseError}</AlertDescription>
          </Alert>
        )}
        
        {isUploading ? (
          <div className="py-4 space-y-4">
            <p className="text-sm text-neutral-600 text-center">
              Importing {parsedLeads.length} leads...
            </p>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-neutral-500 text-center">
              {uploadProgress}% complete
            </p>
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </TabsTrigger>
              <TabsTrigger value="preview" disabled={parsedLeads.length === 0}>
                <FileText className="mr-2 h-4 w-4" />
                Preview Leads
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-medium mb-2">
                      {file ? file.name : 'Select a CSV file to upload'}
                    </p>
                    <p className="text-xs text-neutral-500 mb-4">
                      Required fields: propertyAddress, city, state, zip, ownerName
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      id="csv-upload"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('csv-upload')?.click()}
                        className="text-sm"
                      >
                        Select File
                      </Button>
                    </div>
                  </div>
                  
                  {parsedLeads.length > 0 && (
                    <p className="text-sm text-neutral-600">
                      {parsedLeads.length} leads ready to import
                    </p>
                  )}
                </div>
                
                <div>
                  <div className="border rounded-lg p-5 space-y-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-primary mr-2" />
                      <h3 className="text-sm font-medium">Need a template?</h3>
                    </div>
                    
                    <p className="text-sm text-neutral-600">
                      Download our template CSV file with the required columns and example data
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={downloadTemplate}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    
                    <a ref={downloadLinkRef} className="hidden" />
                    
                    <div className="mt-4 pt-4 border-t text-sm text-neutral-600">
                      <h4 className="font-medium mb-2">Field descriptions:</h4>
                      <ul className="space-y-1 list-disc pl-5 text-xs">
                        <li><span className="font-medium">propertyAddress</span>: Full street address</li>
                        <li><span className="font-medium">city</span>: City name</li>
                        <li><span className="font-medium">state</span>: State (2-letter code)</li>
                        <li><span className="font-medium">zip</span>: ZIP/Postal code</li>
                        <li><span className="font-medium">ownerName</span>: Property owner name</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                {parsedLeads.length > 0 && (
                  <Button 
                    onClick={() => setCurrentTab("preview")}
                    className="bg-primary hover:bg-primary-dark"
                  >
                    Preview Leads
                  </Button>
                )}
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-primary mr-2" />
                    <h3 className="text-sm font-medium">Preview Leads</h3>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Review your leads before importing them. The system will automatically generate a lead ID for each entry.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Property Address</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedLeads.slice(0, 10).map((lead, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{lead.propertyAddress}</TableCell>
                          <TableCell>{lead.city}</TableCell>
                          <TableCell>{lead.state}</TableCell>
                          <TableCell>{lead.ownerName}</TableCell>
                          <TableCell>{lead.status || 'new'}</TableCell>
                        </TableRow>
                      ))}
                      {parsedLeads.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-sm text-neutral-500">
                            ...and {parsedLeads.length - 10} more leads
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm text-amber-700">
                  You are about to import {parsedLeads.length} leads to your database. This action cannot be undone.
                </AlertDescription>
              </Alert>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentTab("upload")}
                >
                  Back
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={parsedLeads.length === 0 || !!parseError}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Import {parsedLeads.length} Leads
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}