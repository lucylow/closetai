import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="container flex items-center justify-between py-5">
      <span className="logo-gradient text-2xl font-bold font-display tracking-tight">ClosetAI</span>
      
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-10">
        <a href="#" className="text-foreground font-medium hover:text-primary transition-colors">Home</a>
        <a href="#features" className="text-foreground font-medium hover:text-primary transition-colors">Features</a>
        <a href="#demo" className="text-foreground font-medium hover:text-primary transition-colors">Demo</a>
        <a href="#how" className="text-foreground font-medium hover:text-primary transition-colors">How it works</a>
        <Button variant="outline" size="sm" className="rounded-full border-primary/30 hover:border-primary hover:bg-primary/5">
          Join waitlist
        </Button>
      </div>

      {/* Mobile toggle */}
      <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 z-50 glass mx-4 p-6 flex flex-col gap-4 md:hidden">
          <a href="#" className="text-foreground font-medium" onClick={() => setMobileOpen(false)}>Home</a>
          <a href="#features" className="text-foreground font-medium" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#demo" className="text-foreground font-medium" onClick={() => setMobileOpen(false)}>Demo</a>
          <a href="#how" className="text-foreground font-medium" onClick={() => setMobileOpen(false)}>How it works</a>
          <Button variant="outline" size="sm" className="rounded-full border-primary/30 w-fit">Join waitlist</Button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
