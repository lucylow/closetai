import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Instagram, Twitter, Sparkles, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_WARDROBE, TRENDS } from "@/lib/data";

const templates = [
  (items: string[], trend: string) =>
    `✨ Today's #OOTD: ${items.join(" + ")}. Loving the ${trend.toLowerCase()} vibe! #AIstylist #ClosetAI #fashion #sustainablestyle`,
  (items: string[], trend: string) =>
    `Styled by AI 🤖 My ${items.join(", ")} look inspired by the ${trend.toLowerCase()} trend. Would you wear this? 🔥 #ClosetAI #fashiontech`,
  (items: string[], trend: string) =>
    `Less thinking, more styling 💅 ${items.join(" × ")} — the ${trend.toLowerCase()} edit. #AIoutfit #ClosetAI #wardrobe`,
];

const SocialPage = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const generateCaption = async () => {
    if (selectedItems.length === 0) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    const names = SAMPLE_WARDROBE.filter(i => selectedItems.includes(i.id)).map(i => i.name);
    const trend = TRENDS[Math.floor(Math.random() * TRENDS.length)].name;
    const template = templates[Math.floor(Math.random() * templates.length)];
    setCaption(template(names, trend));
    setIsGenerating(false);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display gradient-text">Social Content</h1>
        <p className="text-muted-foreground mt-1">Generate Instagram‑ready captions from your outfits.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Item picker */}
        <div className="flex-1 glass-card p-6 space-y-4">
          <h3 className="font-semibold font-display">Select Outfit Items</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {SAMPLE_WARDROBE.map(item => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`rounded-2xl p-3 text-center transition-all border-2 ${
                  selectedItems.includes(item.id)
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-card hover:shadow-sm"
                }`}
              >
                <div className="text-2xl mb-1">{item.image}</div>
                <span className="text-[10px] font-medium block truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content preview */}
        <div className="flex-1 space-y-4">
          {/* Phone mockup */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold font-display flex items-center gap-2">
              <Instagram size={18} className="text-primary" /> Post Preview
            </h3>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              {/* Fake post header */}
              <div className="flex items-center gap-3 p-3 border-b border-border/30">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">AI</div>
                <span className="text-sm font-semibold">closetai_user</span>
              </div>
              {/* Post image area */}
              <div className="bg-muted h-48 flex items-center justify-center gap-3">
                <AnimatePresence>
                  {selectedItems.length > 0 ? (
                    selectedItems.map((id, i) => {
                      const item = SAMPLE_WARDROBE.find(w => w.id === id);
                      return item ? (
                        <motion.span
                          key={id}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-5xl"
                        >
                          {item.image}
                        </motion.span>
                      ) : null;
                    })
                  ) : (
                    <p className="text-muted-foreground text-sm">Select items to preview</p>
                  )}
                </AnimatePresence>
              </div>
              {/* Caption */}
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

          {/* Actions */}
          <Button
            onClick={generateCaption}
            disabled={selectedItems.length === 0 || isGenerating}
            className="w-full rounded-full gap-2"
          >
            {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? "Generating..." : "Generate Caption"}
          </Button>

          {caption && (
            <Button variant="outline" onClick={copyCaption} className="w-full rounded-full gap-2 border-primary/30">
              {copied ? <CheckCircle size={16} className="text-accent" /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Caption"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SocialPage;
