import { motion } from "framer-motion";
import { Sparkles, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Placeholder hero image - replace with hero-preview.jpg when available
const HERO_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop";

const HeroSection = () => {
  return (
    <section className="container py-16 md:py-24">
      <div className="flex flex-col lg:flex-row items-center gap-12">
        {/* Left content */}
        <motion.div
          className="flex-1 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="gradient-text text-4xl md:text-5xl lg:text-[3.5rem] font-bold font-display leading-tight">
            Your intelligent stylist, always in your pocket.
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg">
            Upload your clothes, get AI-powered outfit suggestions, virtual try‑on, and instant social content. Stop staring at a full closet with nothing to wear.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/25 gap-2">
              <Link to="/outfits"><Sparkles size={18} /> Try Outfits</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-primary/30 hover:border-primary gap-2">
              <Link to="/wardrobe"><Play size={18} /> Open Wardrobe</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 pt-2 text-sm font-medium text-foreground">
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-accent" /> 85% less decision time</span>
            <span className="flex items-center gap-2"><CheckCircle size={16} className="text-accent" /> 2x wardrobe utilization</span>
          </div>
        </motion.div>

        {/* Right image */}
        <motion.div
          className="flex-1 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass-card p-4 animate-float">
            <img
              src={HERO_IMAGE}
              alt="ClosetAI app preview - AI wardrobe stylist and virtual try-on"
              className="w-full rounded-2xl object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
