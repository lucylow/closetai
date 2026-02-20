import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shirt, Footprints, Crown, Sparkles, RotateCcw, Flame, CheckCircle, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClothingItem {
  id: number;
  name: string;
  icon: typeof Shirt;
  category: string;
  trend: number;
}

const items: ClothingItem[] = [
  { id: 1, name: "White T-shirt", icon: Shirt, category: "top", trend: 85 },
  { id: 2, name: "Blue Jeans", icon: Footprints, category: "bottom", trend: 62 },
  { id: 3, name: "Leather Jacket", icon: Crown, category: "outerwear", trend: 94 },
  { id: 4, name: "Floral Dress", icon: Shirt, category: "dress", trend: 78 },
  { id: 5, name: "Sneakers", icon: Footprints, category: "shoes", trend: 70 },
  { id: 6, name: "Beanie", icon: Crown, category: "accessory", trend: 45 },
  { id: 7, name: "Plaid Shirt", icon: Shirt, category: "top", trend: 88 },
  { id: 8, name: "Khaki Chinos", icon: Footprints, category: "bottom", trend: 59 },
];

const trends = ["oversized blazers", "wide-leg trousers", "sustainable linen", "90s vintage"];

const InteractiveDemo = () => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [outfit, setOutfit] = useState<{ names: string[]; trend: string } | null>(null);

  const toggleItem = useCallback((id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const generate = () => {
    if (selected.size === 0) return;
    const picked = items.filter(i => selected.has(i.id));
    setOutfit({
      names: picked.map(i => i.name.toLowerCase()),
      trend: trends[Math.floor(Math.random() * trends.length)],
    });
  };

  const reset = () => {
    setSelected(new Set());
    setOutfit(null);
  };

  return (
    <section id="demo" className="container py-20">
      <div className="glass p-8 md:p-14" style={{ borderRadius: "3rem" }}>
        <h2 className="text-center text-3xl md:text-4xl font-bold font-display mb-2">✨ Interactive demo</h2>
        <p className="text-center text-muted-foreground text-lg mb-10">
          Click on items from your virtual closet, then generate an AI outfit.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Closet */}
          <div className="flex-[2] bg-card/70 backdrop-blur rounded-3xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold font-display mb-5">
              <Shirt size={20} className="text-primary" /> Your closet
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`rounded-2xl p-4 text-center shadow-sm transition-all cursor-pointer border-2 ${
                    selected.has(item.id)
                      ? "border-primary bg-primary/10 scale-[1.02]"
                      : "border-transparent bg-card hover:shadow-md"
                  }`}
                >
                  <item.icon size={28} className="mx-auto mb-1 text-primary-light" strokeWidth={1.5} />
                  <span className="text-xs font-medium">{item.name}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
              <Info size={12} /> Click items to select (max 3)
            </p>
          </div>

          {/* Outfit panel */}
          <div className="flex-1 bg-card/70 backdrop-blur rounded-3xl p-6 flex flex-col">
            <h3 className="flex items-center gap-2 text-lg font-semibold font-display mb-5">
              <Sparkles size={20} className="text-secondary" /> AI outfit
            </h3>

            <div className="bg-card rounded-3xl p-5 shadow-sm mb-5 flex-1">
              {outfit ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Shirt size={28} className="text-primary" />
                    <span className="text-muted-foreground">+</span>
                    <Footprints size={28} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium text-center">
                    Your {outfit.names.join(", ")} styled with a {outfit.trend} vibe.
                  </p>
                  <div className="flex justify-center">
                    <span className="trend-badge"><Flame size={12} /> trend: {outfit.trend}</span>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle size={12} className="text-accent" /> virtual try‑on ready
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <Shirt size={28} className="text-primary/40" />
                    <span className="text-muted-foreground">+</span>
                    <Footprints size={28} className="text-primary/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Select items and click generate</p>
                  <span className="trend-badge"><Flame size={12} /> trend: oversized blazers</span>
                </div>
              )}
            </div>

            <Button onClick={generate} disabled={selected.size === 0} className="rounded-full w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Sparkles size={16} /> Generate outfit
            </Button>
            <Button variant="outline" onClick={reset} className="rounded-full w-full mt-3 border-primary/30 gap-2">
              <RotateCcw size={14} /> Reset selection
            </Button>
            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
              <Search size={12} /> trend data via You.com
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;
