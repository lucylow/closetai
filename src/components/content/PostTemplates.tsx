import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Video, Pin, MessageCircle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PostType = "ootd" | "style-tips" | "wardrobe-remix" | "sustainable";

const PLATFORM_TEMPLATES = [
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    postType: "Photo carousel",
    templates: [
      {
        type: "ootd" as PostType,
        label: "Outfit of the Day",
        template: (items: string, occasion: string) =>
          `Today I'm wearing ${items} styled for ${occasion}. What do you think? 👗✨`,
      },
      {
        type: "style-tips" as PostType,
        label: "Style Tips",
        template: () => "3 ways to style your white blouse 💡 Swipe for more! #StyleTips #FashionHacks",
      },
      {
        type: "wardrobe-remix" as PostType,
        label: "Wardrobe Remix",
        template: (items: string) => `Same dress, 5 different looks! ${items} ✨ #WardrobeRemix #CapsuleWardrobe`,
      },
      {
        type: "sustainable" as PostType,
        label: "Sustainable Fashion",
        template: () => "My #30Wears challenge with this jacket 🌱 Style doesn't have to cost the planet. #SustainableFashion",
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: Video,
    postType: "15-second video",
    templates: [
      {
        type: "ootd" as PostType,
        label: "Outfit transition",
        template: (items: string) => `POV: Your outfit today 👀 ${items} #OOTD #GetReadyWithMe`,
      },
      {
        type: "style-tips" as PostType,
        label: "Quick styling hack",
        template: () => "This one trick changed how I style my blazer 👀 #FashionTok #StyleHack",
      },
    ],
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: Pin,
    postType: "Style board",
    templates: [
      {
        type: "ootd" as PostType,
        label: "Summer capsule wardrobe",
        template: (items: string) => `Summer capsule wardrobe essentials: ${items} 📌 Save for later!`,
      },
      {
        type: "wardrobe-remix" as PostType,
        label: "One piece, many looks",
        template: () => "One dress, 5 different ways to wear it. Pin your favorite! 📌",
      },
    ],
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    icon: MessageCircle,
    postType: "Text + image",
    templates: [
      {
        type: "ootd" as PostType,
        label: "Weekend look",
        template: (items: string) => `Found the perfect weekend look: ${items} ✨`,
      },
      {
        type: "sustainable" as PostType,
        label: "Sustainable pick",
        template: () => "Investing in pieces I'll wear 30+ times. Quality over quantity. 🌱",
      },
    ],
  },
];

interface PostTemplatesProps {
  outfitItems?: string;
  occasion?: string;
}

export default function PostTemplates({ outfitItems = "White T-shirt, Blue Jeans", occasion = "casual" }: PostTemplatesProps) {
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [copied, setCopied] = useState<string | null>(null);

  const platform = PLATFORM_TEMPLATES.find((p) => p.id === selectedPlatform);
  const [selectedTemplate, setSelectedTemplate] = useState(0);

  const template = platform?.templates[selectedTemplate];
  const generatedText = template
    ? typeof template.template === "function"
      ? template.template(outfitItems, occasion)
      : ""
    : "";

  const copyPost = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied! Ready to paste in your post.");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold font-display">Post Templates by Platform</h3>
      <p className="text-sm text-muted-foreground">
        Auto-generated posts for each platform. Customize and share.
      </p>

      <div className="flex flex-wrap gap-2">
        {PLATFORM_TEMPLATES.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPlatform(p.id); setSelectedTemplate(0); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedPlatform === p.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <p.icon size={16} />
            {p.name}
          </button>
        ))}
      </div>

      {platform && (
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 space-y-4"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{platform.postType}</p>
          <div className="flex flex-wrap gap-2">
            {platform.templates.map((t, i) => (
              <button
                key={i}
                onClick={() => setSelectedTemplate(i)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  selectedTemplate === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm">{generatedText}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-2"
            onClick={() => copyPost(generatedText, `${platform.id}-${selectedTemplate}`)}
          >
            {copied === `${platform.id}-${selectedTemplate}` ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} />
            )}
            Copy for {platform.name}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
