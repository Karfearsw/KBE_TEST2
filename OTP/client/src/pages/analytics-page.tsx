import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useQuery } from "@tanstack/react-query";
import { Lead, Call, ScheduledCall } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("30days");

  // Fetch data for analytics
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: calls = [] } = useQuery<Call[]>({
    queryKey: ["/api/calls"],
  });

  const { data: scheduledCalls = [] } = useQuery<ScheduledCall[]>({
    queryKey: ["/api/scheduled-calls"],
  });

  // Calculate lead stats by status
  const leadsByStatus = leads.reduce((acc, lead) => {
    const status = lead.status || "unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const leadStatusData = Object.entries(leadsByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Calculate lead stats by property type
  const leadsByPropertyType = leads.reduce((acc, lead) => {
    const propertyType = lead.propertyType || "unknown";
    acc[propertyType] = (acc[propertyType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const propertyTypeData = Object.entries(leadsByPropertyType).map(([name, value]) => ({
    name: formatPropertyType(name),
    value,
  }));

  // Calculate lead stats by motivation level
  const leadsByMotivation = leads.reduce((acc, lead) => {
    const motivation = lead.motivationLevel || "unknown";
    acc[motivation] = (acc[motivation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const motivationData = Object.entries(leadsByMotivation).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Calculate lead stats by source
  const leadsBySource = leads.reduce((acc, lead) => {
    const source = lead.source || "unknown";
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const sourceData = Object.entries(leadsBySource).map(([name, value]) => ({
    name: formatSourceName(name),
    value,
  }));

  // Calculate deal value by status
  const dealValueByStatus = leads.reduce((acc, lead) => {
    const status = lead.status || "unknown";
    acc[status] = (acc[status] || 0) + (lead.estimatedValue || 0);
    return acc;
  }, {} as Record<string, number>);
  
  const dealValueData = Object.entries(dealValueByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  // Generate monthly lead data (for now using mock data, would be replaced with actual dates)
  const monthlyLeadData = [
    { name: "Jan", count: 4 },
    { name: "Feb", count: 6 },
    { name: "Mar", count: 8 },
    { name: "Apr", count: 10 },
    { name: "May", count: 8 },
    { name: "Jun", count: 12 },
    { name: "Jul", count: 16 },
    { name: "Aug", count: 14 },
    { name: "Sep", count: 18 },
    { name: "Oct", count: 20 },
    { name: "Nov", count: 22 },
    { name: "Dec", count: 25 },
  ];

  // Chart colors
  const COLORS = [
    "#FF533E", // primary
    "#3B82F6", // blue
    "#10B981", // green
    "#FBBF24", // yellow
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#6B7280", // gray
  ];

  // Helper functions to format labels
  function formatPropertyType(type: string): string {
    switch (type) {
      case "single-family": return "Single Family";
      case "multi-family": return "Multi-Family";
      case "condo": return "Condo";
      case "commercial": return "Commercial";
      case "land": return "Land";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  function formatSourceName(source: string): string {
    switch (source) {
      case "cold-call": return "Cold Call";
      case "direct-mail": return "Direct Mail";
      case "referral": return "Referral";
      case "online": return "Online";
      case "other": return "Other";
      default: return source.charAt(0).toUpperCase() + source.slice(1);
    }
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar open={true} onOpenChange={() => {}} />
      
      <main className="main-content flex-1 min-h-screen p-4 md:ml-64 md:p-6 overflow-auto pb-16">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl font-bold font-heading text-neutral-900">Analytics</h1>
            <p className="text-neutral-600">Insights and performance metrics for your real estate deals</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Leads</CardTitle>
              <CardDescription>All leads in system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Deals</CardTitle>
              <CardDescription>In negotiation or under contract</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.filter(lead => ["negotiation", "under-contract"].includes(lead.status || "")).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Pipeline Value</CardTitle>
              <CardDescription>Total estimated value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Conversion Rate</CardTitle>
              <CardDescription>Lead to closed deal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {leads.length > 0 
                  ? `${Math.round((leads.filter(lead => lead.status === "closed").length / leads.length) * 100)}%` 
                  : "0%"}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for different analytics sections */}
        <Tabs defaultValue="leads" className="mb-4 md:mb-6">
          <TabsList className="mb-2 md:mb-4">
            <TabsTrigger value="leads">Lead Analytics</TabsTrigger>
            <TabsTrigger value="deals">Deal Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          {/* Lead Analytics Tab */}
          <TabsContent value="leads" className="space-y-4 md:space-y-6">
            {/* Lead Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Growth Over Time</CardTitle>
                <CardDescription>Number of new leads acquired monthly</CardDescription>
              </CardHeader>
              <CardContent className="px-2 py-4">
                <div className="h-[300px] w-full max-w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyLeadData}
                      margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px', marginTop: '5px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="New Leads" 
                        stroke="#FF533E" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Lead Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Lead Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                  <CardDescription>Breakdown of leads by current status</CardDescription>
                </CardHeader>
                <CardContent className="px-2 py-3">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} leads`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Lead Source Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Source Distribution</CardTitle>
                  <CardDescription>Where your leads are coming from</CardDescription>
                </CardHeader>
                <CardContent className="px-2 py-3">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} leads`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Property Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Property Type Distribution</CardTitle>
                  <CardDescription>Types of properties in your pipeline</CardDescription>
                </CardHeader>
                <CardContent className="px-2 py-3">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={propertyTypeData}
                        layout="vertical"
                        margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Number of Properties" fill="#FF533E" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Motivation Level Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Lead Motivation Levels</CardTitle>
                  <CardDescription>Distribution of seller motivation</CardDescription>
                </CardHeader>
                <CardContent className="px-2 py-3">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={motivationData}
                        layout="vertical"
                        margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Number of Leads" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Deal Analytics Tab */}
          <TabsContent value="deals" className="space-y-4 md:space-y-6">
            {/* Deal Value by Status */}
            <Card>
              <CardHeader>
                <CardTitle>Deal Value by Status</CardTitle>
                <CardDescription>Total value of deals in each stage</CardDescription>
              </CardHeader>
              <CardContent className="px-2 py-3">
                <div className="h-[280px] w-full max-w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dealValueData}
                      margin={{ top: 0, right: 5, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value) => [formatCurrency(value as number), "Deal Value"]} />
                      <Legend />
                      <Bar dataKey="value" name="Deal Value" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Deals */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Deals by Value</CardTitle>
                <CardDescription>Highest value properties in your pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full data-table">
                    <thead>
                      <tr>
                        <th>Property Address</th>
                        <th>Owner</th>
                        <th>Status</th>
                        <th className="text-right">Estimated Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads
                        .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
                        .slice(0, 5)
                        .map((lead) => (
                          <tr key={lead.id} className="hover:bg-neutral-50">
                            <td className="font-medium">{lead.propertyAddress}</td>
                            <td>{lead.ownerName}</td>
                            <td>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium status-pill-${lead.status}`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="text-right">{formatCurrency(lead.estimatedValue || 0)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Performance Analytics Tab */}
          <TabsContent value="performance" className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Activity Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Metrics</CardTitle>
                  <CardDescription>Call and appointment statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Total Calls Made</span>
                      <span className="font-medium">{calls.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Scheduled Appointments</span>
                      <span className="font-medium">{scheduledCalls.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Call to Appointment Ratio</span>
                      <span className="font-medium">
                        {calls.length > 0 
                          ? `${Math.round((scheduledCalls.length / calls.length) * 100)}%` 
                          : "0%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Avg. Calls Per Lead</span>
                      <span className="font-medium">
                        {leads.length > 0 
                          ? (calls.length / leads.length).toFixed(1) 
                          : "0"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Lead progression through pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>New Leads</span>
                        <span className="font-medium">{leads.filter(lead => lead.status === "new").length}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ 
                          width: `${leads.length > 0 ? (leads.filter(lead => lead.status === "new").length / leads.length) * 100 : 0}%` 
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Contacted</span>
                        <span className="font-medium">{leads.filter(lead => lead.status === "contacted").length}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{ 
                          width: `${leads.length > 0 ? (leads.filter(lead => lead.status === "contacted").length / leads.length) * 100 : 0}%` 
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Negotiation</span>
                        <span className="font-medium">{leads.filter(lead => lead.status === "negotiation").length}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ 
                          width: `${leads.length > 0 ? (leads.filter(lead => lead.status === "negotiation").length / leads.length) * 100 : 0}%` 
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Under Contract</span>
                        <span className="font-medium">{leads.filter(lead => lead.status === "under-contract").length}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div className="bg-yellow-500 h-2.5 rounded-full" style={{ 
                          width: `${leads.length > 0 ? (leads.filter(lead => lead.status === "under-contract").length / leads.length) * 100 : 0}%` 
                        }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Closed</span>
                        <span className="font-medium">{leads.filter(lead => lead.status === "closed").length}</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ 
                          width: `${leads.length > 0 ? (leads.filter(lead => lead.status === "closed").length / leads.length) * 100 : 0}%` 
                        }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Team Performance - would pull from actual team data in a full implementation */}
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Team member productivity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full data-table">
                    <thead>
                      <tr>
                        <th>Team Member</th>
                        <th>Leads Assigned</th>
                        <th>Calls Made</th>
                        <th>Appointments</th>
                        <th>Deals Closed</th>
                        <th className="text-right">Deal Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-neutral-50">
                        <td className="font-medium">Admin User</td>
                        <td>12</td>
                        <td>45</td>
                        <td>8</td>
                        <td>3</td>
                        <td className="text-right">$420,000</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="font-medium">Benny Jelleh</td>
                        <td>8</td>
                        <td>32</td>
                        <td>5</td>
                        <td>1</td>
                        <td className="text-right">$175,000</td>
                      </tr>
                      <tr className="hover:bg-neutral-50">
                        <td className="font-medium">Kevin Ben</td>
                        <td>15</td>
                        <td>60</td>
                        <td>12</td>
                        <td>4</td>
                        <td className="text-right">$550,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}