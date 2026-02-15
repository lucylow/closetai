import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Upload, CheckCircle, Sparkles, Scan, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shoppingAnalysis } from "@/lib/data";
import { DEMO_WARDROBE } from "@/lib/data";

const Shopping = () => {
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof shoppingAnalysis | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult(shoppingAnalysis);
    setAnalyzing(false);
  };

  const handleTryOn = (garmentIds: string[]) => {
    navigate("/tryon", { state: { garmentIds, newItemPreview: uploadPreview } });
  };

  return (
    <div className="page shopping space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">
          Shopping Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload a screenshot of an item you&apos;re considering. AI analyzes how it matches your wardrobe and lets you virtual try-on with 3 outfit combinations.
        </p>
      </div>

      <div className="glass-card p-8 space-y-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={analyzing}
            />
            <div
              className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden ${
                analyzing
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {uploadPreview && !analyzing ? (
                <img src={uploadPreview} alt="Upload" className="w-full h-full object-cover" />
              ) : analyzing ? (
                <Sparkles size={32} className="text-primary animate-pulse" />
              ) : (
                <Upload size={32} className="text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">
                {analyzing ? "Analyzing..." : "Upload screenshot"}
              </span>
            </div>
          </label>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Take a screenshot of an item you&apos;re considering, then upload it here.
          </p>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-6 border-t border-border/50"
          >
            {/* Style match score - prominent */}
            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle size={32} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-display">Analysis Complete</h3>
                  <p className="text-3xl font-bold text-primary mt-1">
                    {result.score}% match with your style
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Purchase decision with confidence
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Detected attributes
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {result.attributes.category}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {result.attributes.color}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {result.attributes.pattern}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium capitalize">
                  {result.attributes.style}
                </span>
              </div>
            </div>

            {/* Virtual try-on with 3 outfit combinations */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Scan size={16} /> Virtual try-on with 3 outfit combinations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {result.recommendations.map((rec, i) => {
                  const garmentIds = (rec as { garmentIds?: string[] }).garmentIds ?? [];
                  const items = garmentIds
                    .map((id) => DEMO_WARDROBE.find((w) => w.id === id))
                    .filter(Boolean);
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-2xl bg-muted/50 space-y-3"
                    >
                      <div className="flex gap-2 flex-wrap">
                        {uploadPreview && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-primary">
                            <img src={uploadPreview} alt="New item" className="w-full h-full object-cover" />
                          </div>
                        )}
                        {items.slice(0, 3).map((item) => (
                          <div key={item?.id} className="w-12 h-12 rounded-lg overflow-hidden bg-card">
                            {item?.imageUrl ? (
                              <img src={item.imageUrl} alt={item?.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">{item?.image}</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm font-medium">{rec.description}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full gap-1 text-xs"
                        onClick={() => handleTryOn(garmentIds.length ? garmentIds : ["item-001", "item-002"])}
                      >
                        <Scan size={12} /> Try on
                        <ChevronRight size={12} />
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {!result && !analyzing && (
          <div className="text-center py-4">
            <ShoppingBag size={48} className="mx-auto text-primary/30 mb-2" />
            <p className="text-muted-foreground text-sm">
              Upload a screenshot to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopping;
