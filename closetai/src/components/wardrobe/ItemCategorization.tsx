import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ManualTagging from "./ManualTagging";
import type { UploadedItem } from "./BatchUploader";
import { Sparkles } from "lucide-react";

const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;

interface ItemCategorizationProps {
  item: UploadedItem;
  onComplete: (updatedItem: UploadedItem) => void;
  total: number;
  current: number;
}

const ItemCategorization = ({ item, onComplete, total, current }: ItemCategorizationProps) => {
  const [category, setCategory] = useState(item.category || "");
  const [tags, setTags] = useState<string[]>(item.tags || []);
  const [attributes, setAttributes] = useState<Record<string, string>>(item.attributes || {});

  const handleAutoDetect = () => {
    // Simulate AI detection
    const detected = {
      category: "top",
      color: "blue",
      pattern: "solid",
      style: "casual",
    };
    setCategory(detected.category);
    setAttributes((prev) => ({ ...prev, ...detected }));
  };

  const handleSave = () => {
    onComplete({
      ...item,
      category: category || "top",
      attributes,
      tags,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="font-semibold text-lg">Item {current} of {total}</h3>
      </div>
      <div className="rounded-2xl overflow-hidden bg-muted aspect-square max-w-xs mx-auto">
        <img src={item.preview} alt="Clothing item" className="w-full h-full object-cover" />
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={handleAutoDetect}
        className="w-full rounded-full gap-2"
      >
        <Sparkles size={16} /> Auto-detect attributes
      </Button>
      <div className="space-y-4">
        <div>
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Color</Label>
          <Input
            value={attributes.color || ""}
            onChange={(e) => setAttributes({ ...attributes, color: e.target.value })}
            placeholder="e.g. blue"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Pattern</Label>
          <Input
            value={attributes.pattern || ""}
            onChange={(e) => setAttributes({ ...attributes, pattern: e.target.value })}
            placeholder="e.g. solid, striped"
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Style</Label>
          <Input
            value={attributes.style || ""}
            onChange={(e) => setAttributes({ ...attributes, style: e.target.value })}
            placeholder="e.g. casual, formal"
            className="rounded-xl mt-1"
          />
        </div>
        <ManualTagging tags={tags} onTagsChange={setTags} />
      </div>
      <Button onClick={handleSave} className="w-full rounded-full">
        Save & Next
      </Button>
    </div>
  );
};

export default ItemCategorization;
