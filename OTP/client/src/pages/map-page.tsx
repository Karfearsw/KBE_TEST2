import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup,
  ZoomControl,
  useMap
} from "react-leaflet";
import { Icon } from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Maximize, Minimize, Search, Filter, AlertCircle } from "lucide-react";
import { formatPhoneLink, formatEmailLink, formatAddressLink, formatCurrency } from "@/lib/format-utils";

// We need to import the CSS for leaflet
import "leaflet/dist/leaflet.css";

// Define custom marker icons based on lead status
const getMarkerIcon = (status: string) => {
  const iconSize: [number, number] = [32, 41];
  const iconAnchor: [number, number] = [16, 41];
  const popupAnchor: [number, number] = [0, -41];
  
  let iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
  
  switch (status) {
    case "new":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png";
      break;
    case "contacted":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png";
      break;
    case "follow-up":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png";
      break;
    case "negotiation":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png";
      break;
    case "under-contract":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
      break;
    case "closed":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png";
      break;
    case "dead":
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png";
      break;
    default:
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png";
      break;
  }
  
  return new Icon({
    iconUrl,
    iconSize,
    iconAnchor,
    popupAnchor,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    shadowSize: [41, 41],
  });
};

// Function to get color class based on lead status
const getStatusColor = (status: string) => {
  switch (status) {
    case "new":
      return "bg-blue-500";
    case "contacted":
      return "bg-orange-500";
    case "follow-up":
      return "bg-yellow-500";
    case "negotiation":
      return "bg-violet-500";
    case "under-contract":
      return "bg-green-500";
    case "closed":
      return "bg-green-700";
    case "dead":
      return "bg-neutral-800";
    default:
      return "bg-red-500";
  }
};



// Component for centering the map on a specific lead
function MapCenter({ coordinates }: { coordinates: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.flyTo(coordinates, 15, {
        animate: true,
        duration: 1,
      });
    }
  }, [coordinates, map]);

  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mapView, setMapView] = useState<"split" | "fullscreen">("split");

  const parseCoordinate = useMemo(
    () =>
      (value: unknown): number | null => {
        if (typeof value === "number") {
          return Number.isFinite(value) ? value : null;
        }

        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) {
            return null;
          }

          const parsed = Number(trimmed);
          return Number.isFinite(parsed) ? parsed : null;
        }

        return null;
      },
    []
  );
  
  // Fetch leads for displaying on the map
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });
  
  // Filter leads based on status and search query
  const filteredLeads = leads.filter((lead) => {
    // Status filter
    if (statusFilter !== "all" && lead.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (lead.propertyAddress && lead.propertyAddress.toLowerCase().includes(query)) ||
        (lead.ownerName && lead.ownerName.toLowerCase().includes(query)) ||
        (lead.notes && lead.notes.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Center map when lead is selected
  
  // Center map on clicked lead
  const handleCenterMap = (lead: Lead) => {
    const latitude = parseCoordinate(lead.latitude);
    const longitude = parseCoordinate(lead.longitude);

    if (latitude !== null && longitude !== null) {
      setCenterCoordinates([latitude, longitude]);
      setSelectedLead(lead);
    }
  };
  
  // Toggle between split and fullscreen view
  const toggleMapView = () => {
    setMapView(prev => prev === "split" ? "fullscreen" : "split");
  };
  
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900">
      <main className="main-content flex-1 min-h-screen p-4 md:ml-64 md:p-6 overflow-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-900 dark:text-neutral-100">Property Map</h1>
            <p className="text-neutral-600 dark:text-neutral-400">Visualize and explore your real estate deals</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMapView}
              className="flex items-center"
            >
              {mapView === "split" ? (
                <>
                  <Maximize className="h-4 w-4 mr-2" />
                  <span>Fullscreen</span>
                </>
              ) : (
                <>
                  <Minimize className="h-4 w-4 mr-2" />
                  <span>Split View</span>
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Map and List Layout */}
        <div className={`grid ${mapView === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"} gap-6`}>
          {/* Map Section */}
          <Card className={`${mapView === "fullscreen" ? "col-span-full" : ""}`}>
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Deal Map</CardTitle>
                  <CardDescription>Interactive map of all properties</CardDescription>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search address or owner..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="follow-up">Follow Up</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="under-contract">Under Contract</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="dead">Dead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`w-full ${mapView === "fullscreen" ? "h-[70vh]" : "h-[50vh]"}`}>
                <MapContainer
                  center={[39.8283, -98.5795] as [number, number]} // Center of US
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <ZoomControl position="bottomright" />
                  {filteredLeads.map((lead) => {
                    const latitude = parseCoordinate(lead.latitude);
                    const longitude = parseCoordinate(lead.longitude);

                    if (latitude !== null && longitude !== null) {
                      return (
                        <Marker
                          key={lead.id}
                          position={[latitude, longitude]}
                          icon={getMarkerIcon(lead.status || "new")}
                        >
                          <Popup>
                            <div className="p-1">
                              <div className="font-bold mb-1">{lead.propertyAddress}</div>
                              <div className="flex items-center mb-1">
                                <Badge className={`${getStatusColor(lead.status || "new")} text-white`}>
                                  {lead.status}
                                </Badge>
                              </div>
                              <div className="text-sm mb-1">
                                <strong>Owner:</strong> {lead.ownerName}
                              </div>
                              <div className="text-sm mb-1">
                                <strong>Value:</strong> {formatCurrency(lead.estimatedValue)}
                              </div>
                              <div className="mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setSelectedLead(lead)}
                                >
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                  {centerCoordinates && <MapCenter coordinates={centerCoordinates} />}
                </MapContainer>
              </div>
              
              {/* Legend for map markers */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  New
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Contacted
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Follow-up
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  Negotiation
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  Under Contract
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-700"></div>
                  Closed
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-neutral-800"></div>
                  Dead
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Property List Section - Only show in split view */}
          {mapView === "split" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Property List</CardTitle>
                <CardDescription>
                  {filteredLeads.length} {filteredLeads.length === 1 ? "property" : "properties"} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredLeads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="font-medium text-lg mb-1">No properties found</h3>
                    <p className="text-muted-foreground">
                      Try changing your search criteria or adding more properties
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
                    {filteredLeads.map((lead) => (
                      <Card 
                        key={lead.id} 
                        className={`hover:shadow-md transition-shadow ${selectedLead?.id === lead.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => handleCenterMap(lead)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium mb-1">{lead.propertyAddress}</h3>
                              <div className="flex items-center mb-2">
                                <Badge className={`${getStatusColor(lead.status || "new")} text-white`}>
                                  {lead.status}
                                </Badge>
                                {lead.propertyType && (
                                  <Badge variant="outline" className="ml-2">
                                    {lead.propertyType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{formatCurrency(lead.estimatedValue)}</div>
                              {lead.arv && <div className="text-sm text-muted-foreground">ARV: {formatCurrency(lead.arv)}</div>}
                            </div>
                          </div>
                          
                          {/* Owner Information with Clickable Links */}
                          <div className="mt-2">
                            <div className="text-sm">
                              <span className="font-medium">Owner:</span> {lead.ownerName}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {lead.ownerPhone && (
                                <a 
                                  href={formatPhoneLink(lead.ownerPhone) || "#"} 
                                  className="inline-flex items-center text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2 py-1 rounded"
                                >
                                  <Phone className="h-3 w-3 mr-1" />
                                  {lead.ownerPhone}
                                </a>
                              )}
                              
                              {lead.ownerEmail && (
                                <a 
                                  href={formatEmailLink(lead.ownerEmail) || "#"} 
                                  className="inline-flex items-center text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2 py-1 rounded"
                                >
                                  <Mail className="h-3 w-3 mr-1" />
                                  {lead.ownerEmail}
                                </a>
                              )}
                              
                              <a 
                                href={formatAddressLink(lead.propertyAddress) || "#"} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-2 py-1 rounded"
                              >
                                <MapPin className="h-3 w-3 mr-1" />
                                Directions
                              </a>
                            </div>
                          </div>
                          
                          {/* Notes preview if available */}
                          {lead.notes && (
                            <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                              {lead.notes}
                            </div>
                          )}
                          
                          {/* Motivation level if available */}
                          {lead.motivationLevel && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Motivation:</span> {lead.motivationLevel}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Selected Property Details - Show when a property is selected */}
        {selectedLead && (
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Property Details</CardTitle>
                  <CardDescription>{selectedLead.propertyAddress}</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedLead(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Property Information</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Status:</span>
                        <Badge className={`${getStatusColor(selectedLead.status || "new")} text-white ml-2`}>
                          {selectedLead.status}
                        </Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Type:</span>{" "}
                        {selectedLead.propertyType || "N/A"}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Value:</span>{" "}
                        {formatCurrency(selectedLead.estimatedValue)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">ARV:</span>{" "}
                        {formatCurrency(selectedLead.arv)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Repairs:</span>{" "}
                        {formatCurrency(selectedLead.repairCost)}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Source:</span>{" "}
                        {selectedLead.source || "N/A"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Owner Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">Owner Information</h3>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Name:</span>{" "}
                        {selectedLead.ownerName || "N/A"}
                      </div>
                      
                      {selectedLead.ownerPhone && (
                        <div className="text-sm">
                          <span className="font-medium">Phone:</span>{" "}
                          <a 
                            href={formatPhoneLink(selectedLead.ownerPhone) || "#"} 
                            className="text-primary hover:underline"
                          >
                            {selectedLead.ownerPhone}
                          </a>
                        </div>
                      )}
                      
                      {selectedLead.ownerEmail && (
                        <div className="text-sm">
                          <span className="font-medium">Email:</span>{" "}
                          <a 
                            href={formatEmailLink(selectedLead.ownerEmail) || "#"} 
                            className="text-primary hover:underline"
                          >
                            {selectedLead.ownerEmail}
                          </a>
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="font-medium">Motivation:</span>{" "}
                        {selectedLead.motivationLevel || "Unknown"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notes and Actions */}
                <div className="space-y-4">
                  {selectedLead.notes && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Notes</h3>
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-3 rounded-md text-sm">
                        {selectedLead.notes}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Phone className="h-4 w-4" />
                        Call Owner
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Mail className="h-4 w-4" />
                        Email Owner
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <a 
                          href={formatAddressLink(selectedLead.propertyAddress) || "#"} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                        >
                          Get Directions
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <MobileNav />
    </div>
  );
}