import { Home, ClipboardList, Shirt, Sparkles, LayoutPanelLeft, ShoppingBag, Palette, MessageSquare, Cloud, BarChart3, Trash2, TrendingUp, Settings, ShieldCheck, Zap, Database, Users, CalendarDays } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Dashboard", url: "/dashboard", icon: LayoutPanelLeft },
  { title: "Wardrobe", url: "/wardrobe", icon: Shirt },
  { title: "Outfits", url: "/outfits", icon: ClipboardList },
  { title: "Color Analysis", url: "/skin-analysis", icon: Palette },
  { title: "Try-On", url: "/tryon", icon: Sparkles },
  { title: "Trends", url: "/trends", icon: TrendingUp },
  { title: "Content", url: "/content", icon: MessageSquare },
  { title: "Shopping", url: "/shopping", icon: ShoppingBag },
  { title: "Weather", url: "/weather", icon: Cloud },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: ShieldCheck },
  { title: "Billing", url: "/admin/billing", icon: Zap },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-color flex items-center justify-center text-white font-bold shrink-0">
            C
          </div>
          <span className="font-bold text-xl tracking-tight group-data-[collapsible=icon]:hidden">
            ClosetAI
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-muted/50 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium">Free Plan</span>
            <span className="text-[10px] text-muted-foreground">Upgrade for Pro</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
