import { useState } from "react";
import PostGenerator, { type GeneratedPost } from "./PostGenerator";
import PlatformPreview from "./PlatformPreview";
import { useContentGenerator } from "@/hooks/useContentGenerator";
import { useWardrobe } from "@/hooks/useWardrobe";
import { DEMO_WARDROBE } from "@/lib/data";
import type { DailyOutfit } from "@/hooks/useRecommendation";

const ContentCreation = () => {
  const [selectedOutfit, setSelectedOutfit] = useState<DailyOutfit | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const { generateCaption, suggestHashtags, generateStyledImage } = useContentGenerator();
  const { items: wardrobeItems, isAuthenticated } = useWardrobe();
  const items = isAuthenticated ? wardrobeItems : DEMO_WARDROBE;

  // Create a simple outfit from first 3 items for demo
  const demoOutfit: DailyOutfit = {
    id: "demo",
    items: items.slice(0, 3).map((i) => ({
      id: i.id,
      name: i.name,
      imageUrl: i.imageUrl || "",
      extractedAttributes: { color: i.color, category: i.category },
    })),
    description: items.slice(0, 3).map((i) => i.name).join(", "),
    trendScore: 0.8,
  };

  const outfit = selectedOutfit || demoOutfit;

  const handleGenerate = async (tone: string, occasion: string, platform: string) => {
    const outfitDesc = outfit.items.map((i) => i.name).join(", ");
    const captionRes = await generateCaption(outfitDesc, tone, occasion);
    const hashtagsRes = await suggestHashtags(outfit.items[0]?.extractedAttributes);
    const imageBlob = await generateStyledImage(outfitDesc, "photorealistic");
    setGeneratedPost({
      caption: captionRes.caption,
      hashtags: hashtagsRes.hashtags || [],
      image: URL.createObjectURL(imageBlob),
      platform,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-display gradient-text">Content Studio</h2>
        <p className="text-muted-foreground mt-1">
          Generate AI-powered social media posts from your outfits
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PostGenerator
          outfit={outfit}
          onGenerate={handleGenerate}
          generatedPost={generatedPost}
        />
        {generatedPost && (
          <PlatformPreview post={generatedPost} />
        )}
      </div>
    </div>
  );
};

export default ContentCreation;
