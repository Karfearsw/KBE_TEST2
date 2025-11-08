import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LiveTime } from "@/components/ui/live-time";
import { useLocation } from "wouter";
import { 
  DollarSign, 
  Building, 
  TrendingUp, 
  Handshake, 
  Home, 
  Calendar 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestorPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-neutral-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary font-heading">Flipstackk</h1>
              <p className="text-neutral-500">Cash Buyer Portal</p>
            </div>
            <LiveTime />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-semibold">{user?.name?.[0] || user?.username?.[0] || "I"}</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name || user?.username}!</h2>
            <p className="text-lg text-neutral-600 mb-6">
              Thank you for being a valued cash buyer partner with Flipstackk
            </p>
            <p className="text-neutral-500 mb-8 max-w-2xl mx-auto">
              We're thrilled to have you as part of our exclusive network of real estate investors. 
              Your participation is crucial in helping us close deals efficiently and create win-win 
              opportunities in the real estate market.
            </p>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="ml-auto"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Why We Value Our Cash Buyers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium">Quick Closings</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  Your ability to close quickly allows us to offer competitive solutions to motivated sellers.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium">Reliable Partners</CardTitle>
                <Handshake className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  We count on your reliability and professionalism to maintain our reputation in the market.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-lg font-medium">Market Strength</CardTitle>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  Together, we create a stronger market presence that benefits all parties involved.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-6 md:mb-0 md:mr-8">
                <Building className="h-24 w-24 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Coming Soon: Exclusive Deal Access</h2>
                <p className="text-neutral-600 mb-4">
                  We're working on bringing you exclusive access to off-market properties before they're available to our wider network. 
                  As a registered cash buyer, you'll be among the first to receive notifications about new investment opportunities that 
                  match your criteria.
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                  <p className="text-sm text-blue-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <span>Stay tuned for our upcoming investor dashboard with direct access to deals.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <footer className="text-center text-neutral-500 py-6">
          <p>&copy; {new Date().getFullYear()} Flipstackk. All rights reserved.</p>
          <p className="text-sm mt-2">Connecting real estate investors with valuable opportunities.</p>
        </footer>
      </div>
    </div>
  );
}