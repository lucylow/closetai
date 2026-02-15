import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { WardrobeItem } from "@/hooks/useAdvancedWardrobe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ItemDetailsModalProps {
  item: WardrobeItem | null;
  onClose: () => void;
  onUpdate: () => void;
  onSave?: (id: string, updates: Partial<WardrobeItem>) => Promise<void>;
}

const ItemDetailsModal = ({
  item,
  onClose,
  onUpdate,
  onSave,
}: ItemDetailsModalProps) => {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name ?? "",
    color: item?.extractedAttributes?.color ?? item?.color ?? "",
    category: item?.extractedAttributes?.category ?? item?.category ?? "top",
  });

  if (!item) return null;

  const handleSave = async () => {
    if (onSave) {
      await onSave(item.id, {
        name: formData.name,
        extractedAttributes: {
          ...item.extractedAttributes,
          color: formData.color,
          category: formData.category,
        },
      });
      onUpdate();
    }
    setEditing(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card rounded-3xl p-6 w-full max-w-md shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Item Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-4">
          <img
            src={item.imageUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`}
            alt={item.name}
            className="w-24 h-24 object-cover rounded-xl"
          />
          <div className="flex-1 space-y-2">
            {editing ? (
              <>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Item name"
                  className="rounded-xl"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, color: e.target.value }))
                  }
                  placeholder="Color"
                  className="rounded-xl"
                />
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
                >
                  <option value="top">Tops</option>
                  <option value="bottom">Bottoms</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="dress">Dresses</option>
                  <option value="shoes">Shoes</option>
                  <option value="accessory">Accessories</option>
                </select>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="rounded-full">
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    size="sm"
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.extractedAttributes?.color} ·{" "}
                  {item.extractedAttributes?.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  Worn: {item.wearCount ?? 0} times
                </p>
                <p className="text-xs text-muted-foreground">
                  Last worn: {item.lastWornDate || "Never"}
                </p>
                {onSave && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: item.name,
                        color: item.extractedAttributes?.color ?? item.color,
                        category:
                          item.extractedAttributes?.category ?? item.category,
                      });
                      setEditing(true);
                    }}
                    className="rounded-full"
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ItemDetailsModal;
