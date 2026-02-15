import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Shirt, Sparkles, TrendingUp, Share2, Home, Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthDialog } from "@/components/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/wardrobe", icon: Shirt, label: "Wardrobe" },
  { to: "/styler", icon: Sparkles, label: "Styler" },
  { to: "/trends", icon: TrendingUp, label: "Trends" },
  { to: "/social", icon: Share2, label: "Social" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";
  const { user, logout } = useAuth();

  if (isLanding) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-50 glass border-b border-border/40" style={{ borderRadius: 0 }}>
        <div className="container flex items-center justify-between h-16">
          <NavLink to="/" className="logo-gradient text-xl font-bold font-display tracking-tight">
            ClosetAI
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.slice(1).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2 text-muted-foreground">
                <LogOut size={16} /> Sign out
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)} className="gap-2 rounded-full border-primary/30">
                <LogIn size={16} /> Sign in
              </Button>
            )}
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border/30 pb-3 px-4">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground w-full">
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <button onClick={() => { setAuthOpen(true); setMobileOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground w-full">
                <LogIn size={16} /> Sign in
              </button>
            )}
          </nav>
        )}
      </header>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />

      {/* Main content */}
      <main className="flex-1 container py-8">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
