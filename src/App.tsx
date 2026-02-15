import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";

import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Wardrobe from "./pages/Wardrobe";
import Outfits from "./pages/Outfits";
import Trends from "./pages/Trends";
import Content from "./pages/Content";
import Shopping from "./pages/Shopping";
import Business from "./pages/Business";
import TryOn from "./pages/TryOn";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const App = () => (
  <AuthProvider>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/onboarding" element={<Onboarding />} />

            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="wardrobe" element={<Wardrobe />} />
              <Route path="outfits" element={<Outfits />} />
              <Route path="trends" element={<Trends />} />
              <Route path="content" element={<Content />} />
              <Route path="shopping" element={<Shopping />} />
              <Route path="tryon" element={<TryOn />} />
              <Route path="business" element={<Business />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </AuthProvider>
);

export default App;
