import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  UserSearch,
  Phone,
  Users,
  MoreHorizontal,
  Map
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

export function MobileNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const mainNavItems = [
    { href: "/dashboard", icon: <LayoutDashboard className="text-xl" />, label: "Dashboard" },
    { href: "/leads", icon: <UserSearch className="text-xl" />, label: "Leads" },
    { href: "/calls", icon: <Phone className="text-xl" />, label: "Calls" },
    { href: "/map", icon: <Map className="text-xl" />, label: "Map" },
  ];
  
  return (
    <div className="mobile-nav fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-neutral-200 z-20 md:hidden">
      <div className="flex items-center justify-around">
        {mainNavItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex flex-col items-center p-3 cursor-pointer ${
                location === item.href ? "text-primary" : "text-neutral-600"
              }`}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center p-3 text-neutral-600">
            <MoreHorizontal className="text-xl" />
            <span className="text-xs mt-1">More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/analytics">
                <div className="w-full cursor-pointer">Analytics</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <div className="w-full cursor-pointer">Settings</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
