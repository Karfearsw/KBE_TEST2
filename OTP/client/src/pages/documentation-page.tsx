import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ChevronRight, FileText, Lightbulb, Users, Home, Calculator, Phone, PieChart, Table, Settings, Landmark } from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation & Training"
        description="Learn how to use FlipStackk effectively"
      />
      
      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-5 mb-6">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="lead-management">Lead Management</TabsTrigger>
          <TabsTrigger value="deal-pipeline">Deal Pipeline</TabsTrigger>
          <TabsTrigger value="call-tracking">Call Tracking</TabsTrigger>
          <TabsTrigger value="roles">User Roles</TabsTrigger>
        </TabsList>
        
        {/* Getting Started Content */}
        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-5 w-5 mr-2" />
                Getting Started with FlipStackk
              </CardTitle>
              <CardDescription>
                An introduction to the FlipStackk real estate deal management platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Welcome to FlipStackk</h3>
                    <p>
                      FlipStackk is a comprehensive real estate deal management platform 
                      designed to help real estate investors, wholesalers, and teams manage 
                      leads, track deals, and optimize their deal pipeline.
                    </p>
                    
                    <div className="rounded-md bg-blue-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Key Features
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc space-y-1 pl-5">
                              <li>Comprehensive lead management</li>
                              <li>Deal pipeline visualization</li>
                              <li>Integrated calling system</li>
                              <li>Team collaboration tools</li>
                              <li>Performance analytics</li>
                              <li>Deal map for geographic insights</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Navigating the Dashboard</h3>
                    <p>
                      The dashboard is your central hub for accessing all FlipStackk features. 
                      Here's what each section provides:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Home className="h-4 w-4 mr-2" />
                            Dashboard
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Overview of key metrics, active deals, and recent activities.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Leads
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Manage all property leads with filtering and search capabilities.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Calls
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Track all communications with property owners and schedule follow-ups.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Calculator className="h-4 w-4 mr-2" />
                            Calculator
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Evaluate deals with built-in investment calculators.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <PieChart className="h-4 w-4 mr-2" />
                            Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Visualize performance metrics and identify opportunities.
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Team
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            Manage team members and track individual performance.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">First Steps</h3>
                    <ol className="list-decimal space-y-4 pl-5">
                      <li>
                        <strong>Add your first lead</strong>
                        <p className="mt-1">
                          Go to the Leads page and click "Add New Lead". Fill out the property 
                          details and owner information to start tracking a potential deal.
                        </p>
                      </li>
                      <li>
                        <strong>Make a call</strong>
                        <p className="mt-1">
                          From a lead's details, click "Schedule Call" to use the integrated 
                          calling system. All calls are logged automatically for reference.
                        </p>
                      </li>
                      <li>
                        <strong>Update lead status</strong>
                        <p className="mt-1">
                          As you progress with a lead, update its status to move it through 
                          your pipeline (New → Contacted → Negotiating → Under Contract → Closed).
                        </p>
                      </li>
                      <li>
                        <strong>Check your analytics</strong>
                        <p className="mt-1">
                          Visit the Analytics page to track your performance metrics and 
                          identify areas for improvement.
                        </p>
                      </li>
                    </ol>
                  </section>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Previous</Button>
                    <Button>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Lead Management Content */}
        <TabsContent value="lead-management">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Lead Management
              </CardTitle>
              <CardDescription>
                Learn how to effectively manage and organize your property leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Understanding Lead Management</h3>
                    <p>
                      Lead management is the core of FlipStackk. Every property opportunity starts 
                      as a lead and is tracked through the entire deal lifecycle.
                    </p>
                    
                    <div className="rounded-md bg-blue-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Lead Statuses
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc space-y-1 pl-5">
                              <li><strong>New</strong> - Recently added leads that haven't been contacted</li>
                              <li><strong>Contacted</strong> - Leads you've reached out to but haven't qualified</li>
                              <li><strong>Interested</strong> - Property owners showing interest in selling</li>
                              <li><strong>Negotiating</strong> - Active price or terms discussions</li>
                              <li><strong>Under Contract</strong> - Deals with signed purchase agreements</li>
                              <li><strong>Closed</strong> - Successfully completed transactions</li>
                              <li><strong>Cold</strong> - Leads not interested at this time but worth following up later</li>
                              <li><strong>Dead</strong> - Leads that are no longer viable opportunities</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Adding and Importing Leads</h3>
                    
                    <h4 className="font-medium">Manually Adding Leads</h4>
                    <p>
                      To add a single lead, navigate to the Leads page and click "Add New Lead". 
                      Fill out the property details, owner information, and any other relevant data.
                    </p>
                    
                    <h4 className="font-medium">Importing Leads in Bulk</h4>
                    <p>
                      For bulk additions, use the "Import Leads" button on the Leads page. 
                      Prepare a CSV file with your lead data and upload it through the import dialog.
                    </p>
                    
                    <div className="rounded-md bg-amber-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-amber-800">
                            Pro Tip: Required Fields
                          </h3>
                          <div className="mt-2 text-sm text-amber-700">
                            <p>
                              At minimum, each lead requires:
                            </p>
                            <ul className="list-disc space-y-1 pl-5 mt-2">
                              <li>Property address</li>
                              <li>City</li>
                              <li>State</li>
                              <li>Zip code</li>
                              <li>Owner name</li>
                            </ul>
                            <p className="mt-2">
                              Other fields like phone, email, and property details enhance your ability to qualify and work the lead effectively.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Filtering and Searching Leads</h3>
                    <p>
                      FlipStackk provides powerful filtering capabilities to help you focus on the right leads.
                    </p>
                    
                    <h4 className="font-medium">Available Filters</h4>
                    <ul className="list-disc space-y-2 pl-5">
                      <li>
                        <strong>Status Filter</strong> - Filter leads by their current stage in the pipeline
                      </li>
                      <li>
                        <strong>Assigned To</strong> - View leads assigned to specific team members
                      </li>
                      <li>
                        <strong>Added By</strong> - Filter by who created or imported the lead
                      </li>
                      <li>
                        <strong>Search</strong> - Find leads by property address, owner name, or contact information
                      </li>
                      <li>
                        <strong>Sort Options</strong> - Arrange leads by date added, value, or other attributes
                      </li>
                    </ul>
                  </section>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Previous</Button>
                    <Button>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Deal Pipeline Content */}
        <TabsContent value="deal-pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Landmark className="h-5 w-5 mr-2" />
                Deal Pipeline
              </CardTitle>
              <CardDescription>
                Understanding the deal pipeline and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">The FlipStackk Deal Pipeline</h3>
                    <p>
                      The deal pipeline visualizes your leads' progression from initial contact to closed deal.
                      It helps you track conversion rates and identify bottlenecks in your process.
                    </p>
                    
                    <div className="rounded-md bg-blue-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Pipeline Stages
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ol className="list-decimal space-y-2 pl-5">
                              <li><strong>New Leads</strong> - Recently added properties</li>
                              <li><strong>Contacted</strong> - Leads you've reached out to</li>
                              <li><strong>Interested</strong> - Owners showing intent to sell</li>
                              <li><strong>Negotiating</strong> - Active price/term discussions</li>
                              <li><strong>Under Contract</strong> - Deals with signed agreements</li>
                              <li><strong>Closed</strong> - Successfully completed deals</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Pipeline Value Calculation</h3>
                    <p>
                      FlipStackk calculates pipeline value based on the estimated value or contract
                      price of deals at each stage.
                    </p>
                    
                    <h4 className="font-medium">How Values Are Calculated</h4>
                    <ul className="list-disc space-y-2 pl-5">
                      <li>
                        <strong>Deal Value</strong> - For early-stage leads, this is the estimated property value or ARV
                      </li>
                      <li>
                        <strong>Conversion Probability</strong> - Different stages have different probabilities of closing
                      </li>
                      <li>
                        <strong>Weighted Value</strong> - Value adjusted by probability (helps forecast revenue)
                      </li>
                    </ul>
                  </section>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Previous</Button>
                    <Button>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Call Tracking Content */}
        <TabsContent value="call-tracking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Call Tracking
              </CardTitle>
              <CardDescription>
                How to use the integrated calling system and track communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">The Calling System</h3>
                    <p>
                      FlipStackk includes an integrated calling system that logs all communications
                      with property owners, providing a comprehensive record of interactions.
                    </p>
                    
                    <div className="rounded-md bg-blue-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Key Features
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc space-y-1 pl-5">
                              <li>Make calls directly from the platform</li>
                              <li>Automatic call logging with duration and notes</li>
                              <li>Schedule follow-up calls with reminders</li>
                              <li>View comprehensive call history for each lead</li>
                              <li>Team performance metrics for calls</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Making Calls</h3>
                    
                    <h4 className="font-medium">From a Lead Profile</h4>
                    <p>
                      The easiest way to call a property owner is directly from their lead profile.
                      Click the call button next to their phone number to initiate a call.
                    </p>
                    
                    <h4 className="font-medium">Scheduled Calls</h4>
                    <p>
                      Navigate to the Calls page to see your list of scheduled calls for the day.
                      Click the call button to connect with the property owner at the scheduled time.
                    </p>
                  </section>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Previous</Button>
                    <Button>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Roles Content */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Roles & Permissions
              </CardTitle>
              <CardDescription>
                Understanding the different user roles in FlipStackk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] w-full pr-4">
                <div className="space-y-6">
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Role Structure</h3>
                    <p>
                      FlipStackk employs a role-based access control system to ensure each team
                      member has appropriate permissions for their responsibilities.
                    </p>
                    
                    <div className="rounded-md bg-blue-50 p-4 mt-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Available Roles
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <ul className="list-disc space-y-1 pl-5">
                              <li><strong>Administrator</strong> - Full system access</li>
                              <li><strong>Manager</strong> - Team and deal oversight, limited admin functions</li>
                              <li><strong>Acquisitions</strong> - Lead management and negotiations</li>
                              <li><strong>Caller</strong> - Focused on lead generation and initial contact</li>
                              <li><strong>Analyst</strong> - Deal analysis and reporting</li>
                              <li><strong>Viewer</strong> - Read-only access (for investors or partners)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  
                  <section className="space-y-4">
                    <h3 className="text-lg font-semibold">Role Workflows</h3>
                    
                    <h4 className="font-medium">Administrator</h4>
                    <p>
                      Administrators manage the overall system, including user accounts, 
                      permissions, and global settings. They typically:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Set up the system and configure settings</li>
                      <li>Create and manage user accounts</li>
                      <li>Define team structures and assign roles</li>
                      <li>Oversee all deals and team performance</li>
                      <li>Manage integrations with other systems</li>
                    </ul>
                    
                    <h4 className="font-medium">Manager</h4>
                    <p>
                      Managers supervise team operations and deal flow. They typically:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Assign leads to team members</li>
                      <li>Review and approve deals at critical stages</li>
                      <li>Monitor team performance metrics</li>
                      <li>Oversee daily operations</li>
                      <li>Provide coaching and support to team members</li>
                    </ul>
                    
                    <h4 className="font-medium">Acquisitions</h4>
                    <p>
                      Acquisitions specialists focus on evaluating and negotiating deals. They typically:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Evaluate potential deals using calculators</li>
                      <li>Negotiate with property owners</li>
                      <li>Prepare and present offers</li>
                      <li>Coordinate due diligence</li>
                      <li>Work deals through to closing</li>
                    </ul>
                    
                    <h4 className="font-medium">Caller</h4>
                    <p>
                      Callers focus on outreach and initial qualification. They typically:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>Make initial contact with new leads</li>
                      <li>Qualify leads based on motivation and basic criteria</li>
                      <li>Schedule appointments for acquisitions specialists</li>
                      <li>Follow up with leads on a regular schedule</li>
                      <li>Log detailed call notes and update lead status</li>
                    </ul>
                  </section>
                  
                  <div className="flex justify-end">
                    <Button variant="outline" className="mr-2">Previous</Button>
                    <Button>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}