import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutGrid, List, Filter, Trash2, Pencil, Sparkles } from "lucide-react";
import { useAdvancedWardrobe } from "@/hooks/useAdvancedWardrobe";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ItemDetailsModal from "./ItemDetailsModal";
import "./AdvancedWardrobe.css";

const AdvancedWardrobe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    wardrobe,
    loading,
    fetchWardrobe,
    deleteItem,
    bulkDelete,
    updateItem,
  } = useAdvancedWardrobe();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    category: "",
    color: "",
    tags: [] as string[],
  });
  const [sortBy, setSortBy] = useState<
    "createdAt" | "wearCount" | "purchaseDate"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<
    (typeof wardrobe)[0] | null
  >(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchWardrobe();
  }, [fetchWardrobe]);

  const filteredAndSortedItems = () => {
    let items = [...wardrobe];
    if (filters.category) {
      items = items.filter(
        (i) => i.extractedAttributes?.category === filters.category
      );
    }
    if (filters.color) {
      items = items.filter(
        (i) => i.extractedAttributes?.color === filters.color
      );
    }
    if (filters.tags.length) {
      items = items.filter((i) =>
        filters.tags.every((tag) => i.userTags?.includes(tag))
      );
    }
    items.sort((a, b) => {
      let aVal: number | Date | string;
      let bVal: number | Date | string;
      if (sortBy === "wearCount") {
        aVal = a.wearCount ?? 0;
        bVal = b.wearCount ?? 0;
      } else if (sortBy === "purchaseDate") {
        aVal = new Date(a.purchaseDate ?? 0).getTime();
        bVal = new Date(b.purchaseDate ?? 0).getTime();
      } else {
        aVal = a.createdAt ?? a.addedAt ?? "";
        bVal = b.createdAt ?? b.addedAt ?? "";
      }
      const cmp =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : (aVal as number) > (bVal as number)
            ? 1
            : -1;
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return items;
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const items = filteredAndSortedItems();
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedItems.length} items?`)) {
      try {
        await bulkDelete(selectedItems);
        toast.success("Items deleted");
        setSelectedItems([]);
        fetchWardrobe();
      } catch {
        toast.error("Delete failed");
      }
    }
  };

  const handleItemClick = (item: (typeof wardrobe)[0]) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleSaveItem = async (
    id: string,
    updates: Parameters<typeof updateItem>[1]
  ) => {
    await updateItem(id, updates);
  };

  const categories = [
    ...new Set(
      wardrobe.map((i) => i.extractedAttributes?.category).filter(Boolean)
    ),
  ] as string[];
  const colors = [
    ...new Set(
      wardrobe.map((i) => i.extractedAttributes?.color).filter(Boolean)
    ),
  ] as string[];
  const allTags = [
    ...new Set(wardrobe.flatMap((i) => i.userTags ?? [])),
  ] as string[];

  const items = filteredAndSortedItems();

  return (
    <div className="advanced-wardrobe">
      <div className="wardrobe-toolbar">
        <div className="view-toggle">
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
          >
            <List size={16} />
          </button>
        </div>

        <button
          type="button"
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={14} /> Filter
        </button>

        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "createdAt" | "wearCount" | "purchaseDate")
            }
          >
            <option value="createdAt">Date Added</option>
            <option value="wearCount">Wear Count</option>
            <option value="purchaseDate">Purchase Date</option>
          </select>
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>

        {selectedItems.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedItems.length} selected</span>
            <button
              type="button"
              className="danger-btn"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <motion.div
          className="filters-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
        >
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Color</label>
            <select
              value={filters.color}
              onChange={(e) =>
                setFilters({ ...filters, color: e.target.value })
              }
            >
              <option value="">All</option>
              {colors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Tags</label>
            <div className="tag-filters">
              {allTags.map((tag) => (
                <label key={tag} className="tag-checkbox">
                  <input
                    type="checkbox"
                    checked={filters.tags.includes(tag)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({
                          ...filters,
                          tags: [...filters.tags, tag],
                        });
                      } else {
                        setFilters({
                          ...filters,
                          tags: filters.tags.filter((t) => t !== tag),
                        });
                      }
                    }}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="clear-filters"
            onClick={() =>
              setFilters({ category: "", color: "", tags: [] })
            }
          >
            Clear Filters
          </button>
        </motion.div>
      )}

      {loading && (
        <div className="loading-spinner">Loading wardrobe...</div>
      )}

      {viewMode === "grid" ? (
        <div className="wardrobe-grid">
          <div className="grid-header">
            <input
              type="checkbox"
              checked={
                items.length > 0 &&
                selectedItems.length === items.length
              }
              onChange={handleSelectAll}
            />
            <span>Select All</span>
          </div>
          <div className="grid-items">
            {items.map((item) => (
              <motion.div
                key={item.id}
                className={`wardrobe-card ${selectedItems.includes(item.id) ? "selected" : ""}`}
                whileHover={{ y: -4 }}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                />
                <img
                  src={
                    item.imageUrl ||
                    `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`
                  }
                  alt={item.name}
                  onClick={() => handleItemClick(item)}
                />
                {user && (
                  <button
                    type="button"
                    className="style-explorer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/style/${item.id}`);
                    }}
                    title="Get styling ideas"
                  >
                    <Sparkles size={14} />
                  </button>
                )}
                <div className="card-info">
                  <h4 onClick={() => handleItemClick(item)}>
                    {item.extractedAttributes?.color ?? item.color}{" "}
                    {item.extractedAttributes?.category ?? item.category}
                  </h4>
                  <p>Worn: {item.wearCount ?? 0} times</p>
                  <p>Last worn: {item.lastWornDate || "Never"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <table className="wardrobe-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    items.length > 0 &&
                    selectedItems.length === items.length
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>Image</th>
              <th>Category</th>
              <th>Color</th>
              <th>Tags</th>
              <th>Wear Count</th>
              <th>Last Worn</th>
              <th>Purchase Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                  />
                </td>
                <td>
                  <img
                    src={
                      item.imageUrl ||
                      `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`
                    }
                    alt={item.name}
                    className="table-thumb"
                    onClick={() => handleItemClick(item)}
                  />
                </td>
                <td>{item.extractedAttributes?.category ?? item.category}</td>
                <td>{item.extractedAttributes?.color ?? item.color}</td>
                <td>{item.userTags?.join(", ") ?? "-"}</td>
                <td>{item.wearCount ?? 0}</td>
                <td>{item.lastWornDate ?? "-"}</td>
                <td>{item.purchaseDate ?? "-"}</td>
                <td>
                  {user && (
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => navigate(`/style/${item.id}`)}
                      title="Get styling ideas"
                    >
                      <Sparkles size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleItemClick(item)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setModalOpen(false)}
          onUpdate={fetchWardrobe}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
};

export default AdvancedWardrobe;
