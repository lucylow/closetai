import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet, useLocation } from "react-router-dom";
import { ThemeToggle } from "../theme-toggle";
import { HelpCircle } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import GuidedTour from "@/components/onboarding/GuidedTour";
import StyleCoach from "@/components/ai/StyleCoach";
import { useAuth } from "@/contexts/AuthContext";
import { KendoFloatingBadge } from "@/components/KendoPoweredBadge";

export default function Layout() {
  const [tourOpen, setTourOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  } as React.CSSProperties;

  const getPageTitle = () => {
    const path = location.pathname.split("/").filter(Boolean).pop();
    if (!path) return "Home";
    return path.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen w-full bg-background/50 backdrop-blur-3xl">
        <AppSidebar />
        <div className="flex flex-col flex-1 w-full min-w-0">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 hover-elevate" />
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">ClosetAI</span>
                <span className="text-sm text-muted-foreground/40">/</span>
                <span className="text-sm font-semibold">
                  {getPageTitle()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto w-full max-w-7xl animate-in fade-in duration-700 p-6">
              <Outlet />
            </div>
          </main>
          
          <button
            type="button"
            className="fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            onClick={() => setTourOpen(true)}
            aria-label="Start guided tour"
          >
            <HelpCircle size={24} />
          </button>
          {user && <StyleCoach />}
          <GuidedTour isOpen={tourOpen} onClose={() => setTourOpen(false)} />
          <KendoFloatingBadge />
        </div>
      </div>
    </SidebarProvider>
  );
}
