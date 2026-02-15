import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Grid3X3, List, TrendingUp, Trash2, X, Upload, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_WARDROBE, CATEGORY_LABELS, type ClothingItem } from "@/lib/data";
import { useWardrobe } from "@/hooks/useWardrobe";
import AdvancedImageUpload from "@/components/upload/AdvancedImageUpload";
import AdvancedWardrobe from "@/components/wardrobe/AdvancedWardrobe";

const categories = ["all", "top", "bottom", "outerwear", "dress", "shoes", "accessory"];

const Wardrobe = () => {
  const navigate = useNavigate();
  const { items: apiItems, isLoading, stats: apiStats, addItem: apiAddItem, addLoading, deleteItem: apiDeleteItem, isAuthenticated } = useWardrobe();
  const [localItems, setLocalItems] = useState<ClothingItem[]>([]);
  const items = isAuthenticated ? apiItems : (localItems.length ? localItems : DEMO_WARDROBE);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newItem, setNewItem] = useState({ name: "", category: "top" as ClothingItem["category"], color: "", pattern: "" });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchCat = activeCategory === "all" || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, search, activeCategory]);

  const stats = useMemo(() => {
    const catCounts: Record<string, number> = isAuthenticated && apiStats?.categoryBreakdown
      ? apiStats.categoryBreakdown
      : {};
    if (!isAuthenticated || !apiStats) {
      items.forEach((i) => {
        catCounts[i.category] = (catCounts[i.category] || 0) + 1;
      });
    }
    const avgTrend = items.length ? Math.round(items.reduce((s, i) => s + i.trendScore, 0) / items.length) : 0;
    return {
      total: isAuthenticated && apiStats ? apiStats.totalItems : items.length,
      catCounts,
      avgTrend,
      wornLast30Days: apiStats?.wornLast30Days ?? 0,
      avgWearCount: apiStats?.avgWearCount ?? 0,
    };
  }, [items, isAuthenticated, apiStats]);

  const addItem = async (file?: File) => {
    setAddError("");
    if (isAuthenticated && file) {
      try {
        await apiAddItem(file);
        setShowAddModal(false);
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Upload failed");
      }
      return;
    }
    if (!isAuthenticated && newItem.name) {
      const emojis: Record<string, string> = { top: "👕", bottom: "👖", outerwear: "🧥", dress: "👗", shoes: "👟", accessory: "🧢" };
      setLocalItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}`,
          name: newItem.name,
          category: newItem.category,
          color: newItem.color || "Black",
          pattern: newItem.pattern || "Solid",
          trendScore: Math.floor(Math.random() * 40) + 50,
          image: emojis[newItem.category] || "👕",
          addedAt: new Date().toISOString().slice(0, 10),
        },
      ]);
      setNewItem({ name: "", category: "top", color: "", pattern: "" });
      setShowAddModal(false);
    }
  };

  const removeItem = async (id: string) => {
    if (isAuthenticated) {
      try {
        await apiDeleteItem(id);
      } catch {
        // ignore
      }
    } else {
      setLocalItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display gradient-text">My Wardrobe</h1>
          <p className="text-muted-foreground mt-1">
            {stats.total} items · Avg trend {stats.avgTrend}
            {isAuthenticated && stats.wornLast30Days !== undefined && (
              <> · {stats.wornLast30Days} worn in 30 days · Avg {stats.avgWearCount.toFixed(1)} wears/item</>
            )}
          </p>
        </div>
        <Button className="rounded-full gap-2" onClick={() => setShowAddModal(true)} disabled={isLoading}>
          <Plus size={16} /> {isLoading ? "Loading..." : "Add Item"}
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
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate("/tryon", { state: { garmentIds: [item.id] } })}
                    className="p-1 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    title="Try on"
                  >
                    <Shirt size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mb-3 aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{item.image}</div>
                  )}
                </div>
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
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <span className="text-2xl">{item.image}</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.color} · {item.pattern} · {CATEGORY_LABELS[item.category]}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  <TrendingUp size={12} className="text-accent" /> {item.trendScore}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => navigate("/tryon", { state: { garmentIds: [item.id] } })}
                    className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                    title="Try on"
                  >
                    <Shirt size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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

      {/* Advanced Upload & Wardrobe */}
      <div className="mt-12 space-y-8 border-t border-border pt-8">
        <div>
          <h2 className="text-xl font-semibold font-display mb-4">Upload & Process</h2>
          <AdvancedImageUpload />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-display mb-4">Advanced Wardrobe Management</h2>
          <AdvancedWardrobe />
        </div>
      </div>

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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-display">Add New Item</h2>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              {isAuthenticated ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) addItem(f);
                    }}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={40} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload a photo of your item</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, HEIC</p>
                  </div>
                  {addError && <p className="text-sm text-destructive">{addError}</p>}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={addLoading}
                    className="w-full rounded-full"
                  >
                    {addLoading ? "Uploading..." : "Choose Image"}
                  </Button>
                </>
              ) : (
                <>
                  <Input
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl"
                  />
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value as ClothingItem["category"] }))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Color"
                      value={newItem.color}
                      onChange={(e) => setNewItem((p) => ({ ...p, color: e.target.value }))}
                      className="rounded-xl"
                    />
                    <Input
                      placeholder="Pattern"
                      value={newItem.pattern}
                      onChange={(e) => setNewItem((p) => ({ ...p, pattern: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <Button onClick={() => addItem()} className="w-full rounded-full">
                    Add to Wardrobe
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wardrobe;
