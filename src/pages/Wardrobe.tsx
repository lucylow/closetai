import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Filter, Grid3X3, List, TrendingUp, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SAMPLE_WARDROBE, CATEGORY_LABELS, type ClothingItem } from "@/lib/data";

const categories = ["all", "top", "bottom", "outerwear", "dress", "shoes", "accessory"];

const Wardrobe = () => {
  const [items, setItems] = useState<ClothingItem[]>(SAMPLE_WARDROBE);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add item form state
  const [newItem, setNewItem] = useState({ name: "", category: "top" as ClothingItem["category"], color: "", pattern: "" });

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchCat = activeCategory === "all" || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, search, activeCategory]);

  const stats = useMemo(() => {
    const catCounts: Record<string, number> = {};
    items.forEach(i => { catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
    const avgTrend = Math.round(items.reduce((s, i) => s + i.trendScore, 0) / items.length);
    return { total: items.length, catCounts, avgTrend };
  }, [items]);

  const addItem = () => {
    if (!newItem.name) return;
    const emojis: Record<string, string> = { top: "👕", bottom: "👖", outerwear: "🧥", dress: "👗", shoes: "👟", accessory: "🧢" };
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category,
      color: newItem.color || "Black",
      pattern: newItem.pattern || "Solid",
      trendScore: Math.floor(Math.random() * 40) + 50,
      image: emojis[newItem.category] || "👕",
      addedAt: new Date().toISOString().slice(0, 10),
    }]);
    setNewItem({ name: "", category: "top", color: "", pattern: "" });
    setShowAddModal(false);
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display gradient-text">My Wardrobe</h1>
          <p className="text-muted-foreground mt-1">{stats.total} items · Avg trend score {stats.avgTrend}</p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Item
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="glass-card px-4 py-2 text-center min-w-[80px]" style={{ borderRadius: "1rem" }}>
            <div className="text-lg font-bold text-primary">{stats.catCounts[key] || 0}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-card border-border/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
              }`}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <Grid3X3 size={18} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Items */}
      <AnimatePresence mode="popLayout">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card p-5 text-center relative group"
              >
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
                <div className="text-4xl mb-3">{item.image}</div>
                <h3 className="text-sm font-semibold truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.color} · {item.pattern}</p>
                <div className="flex items-center justify-center gap-1 mt-2 text-xs">
                  <TrendingUp size={12} className="text-accent" />
                  <span className="font-medium">{item.trendScore}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="glass-card flex items-center gap-4 p-4 group"
                style={{ borderRadius: "1rem" }}
              >
                <span className="text-2xl">{item.image}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.color} · {item.pattern} · {CATEGORY_LABELS[item.category]}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <TrendingUp size={12} className="text-accent" /> {item.trendScore}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Filter size={40} className="mx-auto mb-3 opacity-40" />
          <p>No items found. Try a different filter or add new items.</p>
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display">Add New Item</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
              </div>
              <Input placeholder="Item name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
              <select
                value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value as ClothingItem["category"] }))}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <Input placeholder="Color" value={newItem.color} onChange={e => setNewItem(p => ({ ...p, color: e.target.value }))} className="rounded-xl" />
                <Input placeholder="Pattern" value={newItem.pattern} onChange={e => setNewItem(p => ({ ...p, pattern: e.target.value }))} className="rounded-xl" />
              </div>
              <Button onClick={addItem} className="w-full rounded-full">Add to Wardrobe</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wardrobe;
