import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Instagram, Twitter, Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_WARDROBE, generatedCaption, suggestedHashtags } from "@/lib/data";
import AdvancedContentGenerator from "@/components/content/AdvancedContentGenerator";
import PostTemplates from "@/components/content/PostTemplates";
import { useWardrobe } from "@/hooks/useWardrobe";
import { useContent } from "@/hooks/useContent";

const captionTones = ["casual", "funny", "inspirational", "professional"] as const;
type CaptionTone = (typeof captionTones)[number];

const Content = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [localCaption, setLocalCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [captionTone, setCaptionTone] = useState<CaptionTone>("casual");

  const { items: wardrobeItems, isAuthenticated } = useWardrobe();
  const { caption: apiCaption, hashtags, loading: isGenerating, error, generateCaption: apiGenerateCaption, suggestHashtags: apiSuggestHashtags } = useContent();
  const items = isAuthenticated ? wardrobeItems : DEMO_WARDROBE;
  const caption = isAuthenticated ? apiCaption : localCaption;

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const selectedItemsData = items.filter((i) => selectedItems.includes(i.id));
  const outfitDescription = selectedItemsData.map((i) => i.name).join(", ") || "White T-shirt, Blue Jeans";
  const outfitAttributes = selectedItemsData.length
    ? (() => {
        const categories = [...new Set(selectedItemsData.map((i) => i.category).filter(Boolean))];
        const colors = [...new Set(selectedItemsData.map((i) => i.color).filter(Boolean))];
        const patterns = [...new Set(selectedItemsData.map((i) => i.pattern).filter(Boolean))];
        return {
          category: categories[0],
          color: colors[0],
          pattern: patterns[0],
          style: (selectedItemsData[0] as { style?: string }).style,
        };
      })()
    : {};

  const generateCaption = async () => {
    if (selectedItems.length === 0) return;
    if (isAuthenticated) {
      await apiGenerateCaption(outfitDescription, captionTone, "casual");
      if (Object.keys(outfitAttributes).length) {
        const attrs = Object.fromEntries(
          Object.entries(outfitAttributes).filter(([, v]) => v != null && v !== "")
        ) as Record<string, string>;
        if (Object.keys(attrs).length) void apiSuggestHashtags(attrs);
      }
    } else {
      await new Promise((r) => setTimeout(r, 800));
      setLocalCaption(generatedCaption[captionTone] || generatedCaption.casual);
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">Content Generator</h1>
        <p className="text-muted-foreground mt-1">Generate Instagram‑ready captions from your outfits.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Caption tone:</span>
        {captionTones.map((t) => (
          <button
            key={t}
            onClick={() => setCaptionTone(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              captionTone === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground border border-border/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 glass-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Select Outfit Items</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`rounded-2xl p-3 text-center transition-all border-2 ${
                  selectedItems.includes(item.id)
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-card hover:shadow-sm"
                }`}
              >
                <div className="mb-1 aspect-square rounded-lg overflow-hidden bg-muted">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">{item.image}</div>
                  )}
                </div>
                <span className="text-[10px] font-medium block truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <Instagram size={18} className="text-primary" /> Post Preview
            </h3>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="flex items-center gap-3 p-3 border-b border-border/30">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  AI
                </div>
                <span className="text-sm font-semibold">closetai_user</span>
              </div>
              <div className="bg-muted h-48 flex items-center justify-center gap-3">
                <AnimatePresence>
                  {selectedItems.length > 0 ? (
                    selectedItems.map((id, i) => {
                      const item = items.find((w) => w.id === id);
                      return item ? (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-16 h-16 rounded-xl overflow-hidden"
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-muted">{item.image}</div>
                          )}
                        </motion.div>
                      ) : null;
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm">Select items to preview</p>
                  )}
                </AnimatePresence>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex gap-3">
                  <Share2 size={18} className="text-muted-foreground" />
                  <Twitter size={18} className="text-muted-foreground" />
                </div>
                {caption ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm leading-relaxed">
                    {caption}
                  </motion.p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Your AI caption will appear here...</p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={generateCaption}
            disabled={selectedItems.length === 0 || isGenerating}
            className="w-full rounded-full gap-2"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? "Generating..." : "Generate Caption"}
          </Button>

          {caption && (
            <>
              <div className="flex flex-wrap gap-2">
                {(isAuthenticated ? hashtags : suggestedHashtags).slice(0, 6).map((tag) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <Button variant="outline" onClick={copyCaption} className="w-full rounded-full gap-2 border-primary/30">
                {copied ? <CheckCircle size={16} className="text-accent" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy Caption"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Platform-specific Post Templates */}
      <div className="mt-12 border-t border-border pt-8">
        <PostTemplates
          outfitItems={outfitDescription}
          occasion="casual"
        />
      </div>

      {/* Advanced Content Generator */}
      <div className="mt-12 border-t border-border pt-8">
        <AdvancedContentGenerator
          outfitDescription={outfitDescription}
          outfitAttributes={outfitAttributes}
        />
      </div>
    </div>
  );
};

export default Content;
