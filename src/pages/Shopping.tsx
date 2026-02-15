import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Upload, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shoppingAnalysis } from "@/lib/data";

const Shopping = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof shoppingAnalysis | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult(shoppingAnalysis);
    setAnalyzing(false);
  };

  return (
    <div className="page shopping space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">
          Shopping Assistant
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered shopping recommendations based on your wardrobe. Upload a
          screenshot of an item to see if it fits your style.
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
              className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                analyzing
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              {analyzing ? (
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
            Take a screenshot of an item you&apos;re considering, then upload it
            here. Our AI will analyze how well it fits your wardrobe.
          </p>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-6 border-t border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold font-display">Analysis Complete</h3>
                <p className="text-2xl font-bold text-primary">
                  {result.score}% match
                </p>
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

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Pairs well with
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li
                    key={rec.id}
                    className="flex items-start gap-2 p-3 rounded-xl bg-muted/50"
                  >
                    <ShoppingBag size={16} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{rec.description}</span>
                  </li>
                ))}
              </ul>
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
