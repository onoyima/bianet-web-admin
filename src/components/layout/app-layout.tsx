import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { ChatWidget } from "@/components/chat-widget";
import { Home, Shield, LogOut, FileCheck, Users, ScrollText, AlertTriangle, Wallet, Package, Building2, BookOpen, Truck, Bell, UserCog, Settings2, Activity, HeadphonesIcon, Cpu, Menu, DollarSign, ShoppingCart, Handshake, CreditCard, Store, Landmark } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Admin Dashboard", href: "/admin", icon: Shield },
  { name: "Analytics", href: "/admin/analytics", icon: Activity },
  { name: "Finance", href: "/admin/finance", icon: DollarSign },
  { name: "KYC Moderation", href: "/admin/kyc", icon: FileCheck },
  { name: "User Management", href: "/admin/users", icon: Users },
  { name: "Escrow Management", href: "/admin/escrow", icon: Wallet },
  { name: "Seed Listings", href: "/admin/seed-listings", icon: Package },
  { name: "Bartar Listings", href: "/admin/bartar-listings", icon: Building2 },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { name: "Deals", href: "/admin/deals", icon: Handshake },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Vendors", href: "/admin/vendors", icon: Store },
  { name: "Enterprises", href: "/admin/enterprises", icon: Landmark },
  { name: "Educational Content", href: "/admin/educational-content", icon: BookOpen },
  { name: "Logistics", href: "/admin/logistics", icon: Truck },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Roles & Permissions", href: "/admin/roles", icon: UserCog },
  { name: "Settings", href: "/admin/settings", icon: Settings2 },
  { name: "Audit Logs", href: "/admin/logs", icon: ScrollText },
];

const operationsNav = [
  { name: "Ops Dashboard", href: "/operations", icon: Activity },
  { name: "User Management", href: "/operations/users", icon: Users },
  { name: "Order Management", href: "/operations/orders", icon: Package },
  { name: "Fraud Review", href: "/operations/fraud-review", icon: AlertTriangle },
  { name: "Analytics", href: "/operations/analytics", icon: ScrollText },
];

const supportNav = [
  { name: "Support Dashboard", href: "/support", icon: HeadphonesIcon },
  { name: "Tickets", href: "/support/tickets", icon: FileCheck },
  { name: "Disputes", href: "/support/disputes", icon: AlertTriangle },
  { name: "User Lookup", href: "/support/user-lookup", icon: Users },
];

const aiControlNav = [
  { name: "AI Dashboard", href: "/ai-control", icon: Cpu },
  { name: "Moderation", href: "/ai-control/moderation", icon: Shield },
  { name: "Models", href: "/ai-control/models", icon: Activity },
  { name: "Training Data", href: "/ai-control/training-data", icon: BookOpen },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN_MODERATOR";

  function NavItem({ href, icon: Icon, name }: { href: string; icon: any; name: string }) {
    const isActive = location.startsWith(href);
    return (
      <Link href={href} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
        <Icon className="h-5 w-5" />
        {!collapsed && name}
      </Link>
    );
  }

  return (
    <div className="h-dvh overflow-hidden flex bg-background">
      <aside className={`${collapsed ? "w-16" : "w-64"} border-r border-border bg-sidebar flex-shrink-0 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          {!collapsed && <img src="/Bainet-logo.png" alt="Bia'net" className="h-8" />}
        </div>
        <ScrollArea className="flex-1">
          {!collapsed && (
            <>
              <div className="py-4 px-3 space-y-1">
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">General</p>
                {navigation.map((item) => <NavItem key={item.name} {...item} />)}
              </div>
              <Separator className="mx-3" />
              <div className="py-2 px-3 space-y-1">
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Operations</p>
                {operationsNav.map((item) => <NavItem key={item.name} {...item} />)}
              </div>
              <Separator className="mx-3" />
              <div className="py-2 px-3 space-y-1">
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Support</p>
                {supportNav.map((item) => <NavItem key={item.name} {...item} />)}
              </div>
              <Separator className="mx-3" />
              <div className="py-2 px-3 space-y-1">
                <p className="px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">AI Control</p>
                {aiControlNav.map((item) => <NavItem key={item.name} {...item} />)}
              </div>
            </>
          )}
          {collapsed && (
            <div className="py-4 px-3 space-y-1">
              {[...navigation, ...operationsNav, ...supportNav, ...aiControlNav].map((item) => (
                <NavItem key={item.name} {...item} />
              ))}
            </div>
          )}
        </ScrollArea>
        {!isAdmin && !collapsed && (
          <div className="px-3 py-2 mx-3 mb-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>View-only mode</span>
          </div>
        )}
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setCollapsed(!collapsed)}>
            <Menu className="h-5 w-5" />
            {!collapsed && <span className="ml-3">Collapse</span>}
          </Button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setCollapsed(!collapsed)} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
