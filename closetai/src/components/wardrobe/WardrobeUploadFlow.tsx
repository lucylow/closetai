import { useState } from "react";
import BatchUploader, { type UploadedItem } from "./BatchUploader";
import ItemCategorization from "./ItemCategorization";
import { useWardrobe } from "@/hooks/useWardrobe";

interface WardrobeUploadFlowProps {
  onNext: (data: { wardrobe: UploadedItem[] }) => void;
  onBack: () => void;
}

const WardrobeUploadFlow = ({ onNext, onBack }: WardrobeUploadFlowProps) => {
  const [uploadedItems, setUploadedItems] = useState<UploadedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { addItem } = useWardrobe();

  const handleUploadComplete = (items: UploadedItem[]) => {
    setUploadedItems(items);
    setCurrentIndex(0);
  };

  const handleCategorizationComplete = async (updatedItem: UploadedItem) => {
    const newItems = [...uploadedItems];
    newItems[currentIndex] = updatedItem;
    setUploadedItems(newItems);

    if (currentIndex < uploadedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All items processed – save to wardrobe via API
      await Promise.all(
        newItems.map((item) => addItem({ file: item.file, tags: item.tags }))
      ).catch(() => {
        // Continue even if some uploads fail (e.g. not logged in)
      });
      onNext({ wardrobe: newItems });
    }
  };

  if (uploadedItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold font-display">Upload Your Wardrobe</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Add up to 20 clothing photos. We&apos;ll help you categorize each item.
          </p>
        </div>
        <BatchUploader onUploadComplete={handleUploadComplete} />
      </div>
    );
  }

  return (
    <ItemCategorization
      item={uploadedItems[currentIndex]}
      onComplete={handleCategorizationComplete}
      total={uploadedItems.length}
      current={currentIndex + 1}
    />
  );
};

export default WardrobeUploadFlow;
