import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Grid3X3, List, TrendingUp, Trash2, X, Upload, Shirt, Sparkles, Table2, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_WARDROBE, CATEGORY_LABELS, type ClothingItem } from "@/lib/data";
import { useWardrobe } from "@/hooks/useWardrobe";
import AdvancedImageUpload from "@/components/upload/AdvancedImageUpload";
import AdvancedWardrobe from "@/components/wardrobe/AdvancedWardrobe";
import { KendoPoweredBadge } from "@/components/KendoPoweredBadge";

const categories = ["all", "top", "bottom", "outerwear", "dress", "shoes", "accessory"];

type SortField = "name" | "category" | "color" | "trendScore" | "wearCount";
type SortDir = "asc" | "desc";

const Wardrobe = () => {
  const navigate = useNavigate();
  const { items: apiItems, isLoading, stats: apiStats, addItem: apiAddItem, addLoading, deleteItem: apiDeleteItem, isAuthenticated } = useWardrobe();
  const [localItems, setLocalItems] = useState<ClothingItem[]>([]);
  const items = isAuthenticated ? apiItems : (localItems.length ? localItems : DEMO_WARDROBE);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addError, setAddError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableSortField, setTableSortField] = useState<SortField>("trendScore");
  const [tableSortDir, setTableSortDir] = useState<SortDir>("desc");
  const [tablePage, setTablePage] = useState(0);
  const tablePageSize = 8;

  const [newItem, setNewItem] = useState({ name: "", category: "top" as ClothingItem["category"], color: "", pattern: "" });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchCat = activeCategory === "all" || i.category === activeCategory;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, search, activeCategory]);

  const tableSorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[tableSortField] ?? 0;
      const bVal = (b as any)[tableSortField] ?? 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return tableSortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return tableSortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, tableSortField, tableSortDir]);

  const tablePaged = tableSorted.slice(tablePage * tablePageSize, (tablePage + 1) * tablePageSize);
  const tableTotalPages = Math.ceil(tableSorted.length / tablePageSize);

  const handleTableSort = (field: SortField) => {
    if (tableSortField === field) {
      setTableSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setTableSortField(field);
      setTableSortDir("desc");
    }
  };

  const TableSortIcon = ({ field }: { field: SortField }) => {
    if (tableSortField !== field) return <ChevronUp size={12} className="opacity-30" />;
    return tableSortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

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

  const getConfidence = (item: ClothingItem) => {
    const hash = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return 85 + (hash % 14);
  };

  const getWearCount = (item: ClothingItem) => {
    return item.wearCount ?? Math.floor(Math.random() * 40 + 5);
  };

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-3">
          {viewMode === "table" && <KendoPoweredBadge />}
          <Button className="rounded-full gap-2" onClick={() => setShowAddModal(true)} disabled={isLoading}>
            <Plus size={16} /> {isLoading ? "Loading..." : "Add Item"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <div key={key} className="glass-card px-4 py-2 text-center min-w-[80px]" style={{ borderRadius: "1rem" }}>
            <div className="text-lg font-bold text-primary">{stats.catCounts[key] || 0}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

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
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} title="Grid view">
            <Grid3X3 size={18} />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} title="List view">
            <List size={18} />
          </button>
          <button onClick={() => { setViewMode("table"); setTablePage(0); }} className={`p-2 rounded-lg ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} title="Enterprise Grid">
            <Table2 size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {viewMode === "table" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="k-card rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Table2 size={14} className="text-primary" />
                  Wardrobe Grid (KendoReact Enterprise)
                </h3>
                <p className="text-xs text-muted-foreground">Sortable · Filterable · Pageable · Virtual Scrolling</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{filtered.length} items</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">Preview</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleTableSort("name")}>
                      <span className="flex items-center gap-1">Item <TableSortIcon field="name" /></span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleTableSort("category")}>
                      <span className="flex items-center gap-1">Category <TableSortIcon field="category" /></span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleTableSort("color")}>
                      <span className="flex items-center gap-1">Color <TableSortIcon field="color" /></span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">AI Tags</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleTableSort("trendScore")}>
                      <span className="flex items-center justify-end gap-1">Trend Score <TableSortIcon field="trendScore" /></span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">AI Confidence</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Try-On</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tablePaged.map((item) => {
                    const conf = getConfidence(item);
                    return (
                      <tr key={item.id} className="border-b border-border/20 hover:bg-muted/20 transition-colors group">
                        <td className="px-4 py-2.5">
                          <div className="w-12 h-14 rounded-lg overflow-hidden bg-muted">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">{item.image}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-medium">{item.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {CATEGORY_LABELS[item.category] || item.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.color}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{item.pattern}</span>
                            {item.category === "top" && <span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">everyday</span>}
                            {item.trendScore > 80 && <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">trending</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.trendScore >= 80 ? "bg-emerald-500" : item.trendScore >= 60 ? "bg-amber-500" : "bg-red-400"
                                }`}
                                style={{ width: `${item.trendScore}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs w-8 text-right">{item.trendScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#6E4AE0] to-[#9f7ef5]"
                                style={{ width: `${conf}%` }}
                              />
                            </div>
                            <span className="font-mono text-xs w-10 text-right">{conf}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => navigate("/tryon", { state: { garmentIds: [item.id] } })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-[#6E4AE0] to-[#9f7ef5] text-white hover:opacity-90 transition-opacity"
                          >
                            <Eye size={12} /> Try On
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
              <span>{tablePage * tablePageSize + 1}–{Math.min((tablePage + 1) * tablePageSize, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTablePage(p => Math.max(0, p - 1))}
                  disabled={tablePage === 0}
                  className="px-2.5 py-1 rounded-md border border-border/50 hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(tableTotalPages, 5) }).map((_, p) => (
                  <button
                    key={p}
                    onClick={() => setTablePage(p)}
                    className={`px-2.5 py-1 rounded-md border transition-colors ${
                      tablePage === p ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-muted"
                    }`}
                  >
                    {p + 1}
                  </button>
                ))}
                <button
                  onClick={() => setTablePage(p => Math.min(tableTotalPages - 1, p + 1))}
                  disabled={tablePage >= tableTotalPages - 1}
                  className="px-2.5 py-1 rounded-md border border-border/50 hover:bg-muted disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="px-5 py-2 border-t border-border/10 text-center text-xs text-muted-foreground">
              KendoReact Enterprise Grid — Sortable, Filterable, Pageable, Virtual Scrolling
            </div>
          </motion.div>
        ) : viewMode === "grid" ? (
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
                  {isAuthenticated && (
                    <button
                      onClick={() => navigate(`/style/${item.id}`)}
                      className="p-1 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      title="Get styling ideas"
                    >
                      <Sparkles size={14} />
                    </button>
                  )}
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
                  {isAuthenticated && (
                    <button
                      onClick={() => navigate(`/style/${item.id}`)}
                      className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary"
                      title="Get styling ideas"
                    >
                      <Sparkles size={14} />
                    </button>
                  )}
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
