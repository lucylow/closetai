import { useState } from "react";
import { Outlet } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import Navbar from "./Navbar";
import GuidedTour from "@/components/onboarding/GuidedTour";
import StyleCoach from "@/components/ai/StyleCoach";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const [tourOpen, setTourOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <main className="main-content container">
        <Outlet />
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
    </>
  );
};
export default Layout;
