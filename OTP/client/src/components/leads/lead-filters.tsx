import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { X, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadFiltersProps {
  filters: {
    status: string[];
    search: string;
    assignedToUserId?: number;
    createdByUserId?: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  onFilterChange: (filters: Partial<LeadFiltersProps["filters"]>) => void;
}

export function LeadFilters({ filters, onFilterChange }: LeadFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  
  // Fetch users for assignee filter
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/team"],
  });
  
  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput });
      }
    }, 300);
    
    return () => clearTimeout(handler);
  }, [searchInput, filters.search, onFilterChange]);
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "contacted": return "Contacted";
      case "follow-up": return "Follow-up";
      case "negotiation": return "Negotiation";
      case "under-contract": return "Under Contract";
      case "closed": return "Closed";
      case "dead": return "Dead";
      default: return status;
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchInput("");
    onFilterChange({
      status: [],
      search: "",
      assignedToUserId: undefined,
      createdByUserId: undefined,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };
  
  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    const currentStatus = [...filters.status];
    const index = currentStatus.indexOf(status);
    
    if (index !== -1) {
      currentStatus.splice(index, 1);
    } else {
      currentStatus.push(status);
    }
    
    onFilterChange({ status: currentStatus });
  };
  
  // Determine if any filters are active
  const hasActiveFilters = filters.status.length > 0 || 
    filters.search !== "" || 
    filters.assignedToUserId !== undefined ||
    filters.createdByUserId !== undefined;
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 mt-4 mb-4">
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 flex-1">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search property address or owner name"
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1.5 h-7 w-7 p-0 text-neutral-500"
              onClick={() => setSearchInput("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> 
              Status Filter
              {filters.status.length > 0 && (
                <Badge variant="secondary">{filters.status.length}</Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Lead Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {["new", "contacted", "follow-up", "negotiation", "under-contract", "closed", "dead"].map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.status.includes(status)}
                onCheckedChange={() => toggleStatusFilter(status)}
              >
                {getStatusLabel(status)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Assigned To Filter */}
        <Select 
          value={filters.assignedToUserId?.toString() || "all"}
          onValueChange={(value) => {
            console.log("Assigned To changed:", value);
            onFilterChange({ 
              assignedToUserId: value && value !== "all" ? parseInt(value) : undefined 
            });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Assigned To" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Created By Filter - Now visible on all devices */}
        <Select 
          value={filters.createdByUserId?.toString() || "all"}
          onValueChange={(value) => {
            console.log("Added By changed:", value);
            onFilterChange({ 
              createdByUserId: value && value !== "all" ? parseInt(value) : undefined 
            });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Added By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Team Members</SelectItem>
            {users.map(user => (
              <SelectItem key={`creator-${user.id}`} value={user.id.toString()}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-1">
            <X className="h-4 w-4" /> Clear Filters
          </Button>
        )}
      </div>
      
      {/* Sort Options */}
      <div className="flex gap-2">
        <Select 
          value={filters.sortBy}
          onValueChange={(value) => onFilterChange({ sortBy: value })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Added</SelectItem>
            <SelectItem value="propertyAddress">Address</SelectItem>
            <SelectItem value="ownerName">Owner Name</SelectItem>
            <SelectItem value="estimatedValue">Property Value</SelectItem>
            <SelectItem value="updatedAt">Last Updated</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={filters.sortOrder}
          onValueChange={(value) => onFilterChange({ sortOrder: value as "asc" | "desc" })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
