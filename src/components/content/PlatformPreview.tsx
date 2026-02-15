import { Button } from "@/components/ui/button";
import type { GeneratedPost } from "./PostGenerator";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const PLATFORM_TEMPLATES: Record<string, string> = {
  instagram: "{caption}\n\n{hashtags}",
  tiktok: "{caption} {hashtags}",
  pinterest: "{caption}\n\n{hashtags}",
  twitter: "{caption} {hashtags}",
};

interface PlatformPreviewProps {
  post: GeneratedPost;
}

const PlatformPreview = ({ post }: PlatformPreviewProps) => {
  const [copied, setCopied] = useState(false);
  const template = PLATFORM_TEMPLATES[post.platform] || PLATFORM_TEMPLATES.instagram;
  const fullText = template
    .replace("{caption}", post.caption)
    .replace("{hashtags}", post.hashtags.join(" "));

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Preview on {post.platform}</h3>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-4">
          <p className="text-sm whitespace-pre-wrap">{fullText}</p>
        </div>
      </div>
      <Button
        variant="outline"
        onClick={copyToClipboard}
        className="rounded-full gap-2 w-full"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied!" : "Copy to clipboard"}
      </Button>
    </div>
  );
};

export default PlatformPreview;
