import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  UserSearch,
  Phone,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Map,
  Calculator,
  X,
  Clock,
  FileText,
  LifeBuoy,
  AlertTriangle
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import logoImage from "@/assets/logo.png";

// Helper to get user initials from name
const getInitials = (name: string | null | undefined) => {
  if (!name) return "U";
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard className="mr-3 text-lg" />, label: "Dashboard" },
    { href: "/leads", icon: <UserSearch className="mr-3 text-lg" />, label: "Leads" },
    { href: "/calls", icon: <Phone className="mr-3 text-lg" />, label: "Calls" },
    { href: "/team", icon: <Users className="mr-3 text-lg" />, label: "Team" },
    { href: "/map", icon: <Map className="mr-3 text-lg" />, label: "Property Map" },
    { href: "/calculator", icon: <Calculator className="mr-3 text-lg" />, label: "Calculator" },
    { href: "/timesheet", icon: <Clock className="mr-3 text-lg" />, label: "Timesheet" },
    { href: "/analytics", icon: <BarChart3 className="mr-3 text-lg" />, label: "Analytics" },
    { href: "/documentation", icon: <FileText className="mr-3 text-lg" />, label: "Documentation" },
    { href: "/error-guidance", icon: <AlertTriangle className="mr-3 text-lg" />, label: "Error Guidance" },
    { href: "/error-examples", icon: <LifeBuoy className="mr-3 text-lg" />, label: "Error Examples" },
    { href: "/settings", icon: <Settings className="mr-3 text-lg" />, label: "Settings" },
  ];
  
  return (
    <aside 
      className={cn(
        "sidebar w-64 bg-white dark:bg-neutral-900 shadow-md fixed inset-y-0 left-0 z-40 transform transition-transform duration-300",
        // On mobile, show only when open. On md screens and up, always show
        open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header and Close Button */}
        <div className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <h1 className="text-lg font-bold text-primary">FlipStackk</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 bg-primary text-white rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold">{user ? getInitials(user.username) : "??"}</span>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{user?.username || "User"}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize truncate">{user?.email || "No email"}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 scroll-smooth custom-scrollbar">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <div 
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                      location === item.href
                        ? "bg-primary bg-opacity-10 text-primary"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Theme & Logout */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme</span>
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <LogOut className="mr-3 text-lg" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
