import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DailyOutfit } from "@/hooks/useRecommendation";
import { Sparkles } from "lucide-react";

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
  image?: string;
  platform: string;
}

interface PostGeneratorProps {
  outfit: DailyOutfit;
  onGenerate: (tone: string, occasion: string, platform: string) => void;
  generatedPost: GeneratedPost | null;
}

const PostGenerator = ({ outfit, onGenerate, generatedPost }: PostGeneratorProps) => {
  const [tone, setTone] = useState("casual");
  const [occasion, setOccasion] = useState("casual");
  const [platform, setPlatform] = useState("instagram");

  const handleGenerate = () => {
    onGenerate(tone, occasion, platform);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Generate content for your outfit</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Tone</Label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="funny">Funny</SelectItem>
              <SelectItem value="inspirational">Inspirational</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Occasion</Label>
          <Select value={occasion} onValueChange={setOccasion}>
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="party">Party</SelectItem>
              <SelectItem value="work">Work</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="rounded-xl mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="pinterest">Pinterest</SelectItem>
              <SelectItem value="twitter">X (Twitter)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleGenerate} className="w-full rounded-full gap-2">
        <Sparkles size={16} /> Generate Post
      </Button>
      {generatedPost && (
        <div className="space-y-2 p-4 rounded-xl bg-muted/50">
          <p>
            <strong>Caption:</strong> {generatedPost.caption}
          </p>
          <p>
            <strong>Hashtags:</strong> {generatedPost.hashtags.join(" ")}
          </p>
          {generatedPost.image && (
            <img
              src={generatedPost.image}
              alt="Styled outfit"
              className="max-w-[200px] rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PostGenerator;
