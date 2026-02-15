import React, { useState, useEffect } from "react";
import {
  Instagram,
  Copy,
  Download,
  Sparkles,
  Hash,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { useContentGenerator } from "@/hooks/useContentGenerator";
import { toast } from "sonner";
import "./AdvancedContentGenerator.css";

const IMAGE_STYLES = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "sketch", label: "Sketch" },
  { id: "watercolor", label: "Watercolor" },
] as const;

const platforms = [
  { id: "instagram", name: "Instagram", icon: <Instagram size={18} />, charLimit: 2200 },
  { id: "tiktok", name: "TikTok", charLimit: 150 },
  { id: "pinterest", name: "Pinterest", charLimit: 500 },
  { id: "twitter", name: "X (Twitter)", charLimit: 280 },
];

interface AdvancedContentGeneratorProps {
  outfitDescription?: string;
  outfitAttributes?: Record<string, unknown>;
}

const AdvancedContentGenerator = ({
  outfitDescription = "White T-shirt, Blue Jeans, Leather Jacket",
  outfitAttributes = {},
}: AdvancedContentGeneratorProps) => {
  const {
    generateCaption,
    suggestHashtags,
    generateStyledImage,
  } = useContentGenerator();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [styledImage, setStyledImage] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState("instagram");
  const [tone, setTone] = useState("casual");
  const [occasion, setOccasion] = useState("casual");
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [editableCaption, setEditableCaption] = useState("");
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [imageStyle, setImageStyle] = useState<"photorealistic" | "sketch" | "watercolor">("photorealistic");

  const handleGenerateCaption = async () => {
    setLoading(true);
    try {
      const { caption: c } = await generateCaption(outfitDescription, tone, occasion);
      setCaption(c);
      setEditableCaption(c);
    } catch {
      toast.error("Caption generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestHashtags = async () => {
    setLoading(true);
    try {
      const { hashtags: h } = await suggestHashtags(outfitAttributes);
      setHashtags(h);
      setSelectedHashtags(h.slice(0, 5));
    } catch {
      toast.error("Hashtag suggestion failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    setImageLoading(true);
    try {
      const blob = await generateStyledImage(outfitDescription, imageStyle);
      setStyledImage((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch {
      toast.error("Image generation failed");
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(
    () => () => {
      if (styledImage) URL.revokeObjectURL(styledImage);
    },
    [styledImage]
  );

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadImage = () => {
    if (!styledImage) return;
    const link = document.createElement("a");
    link.href = styledImage;
    link.download = "closetai-styled.png";
    link.click();
  };

  const platform = platforms.find((p) => p.id === selectedPlatform);
  const finalPost = `${editableCaption}\n\n${selectedHashtags.join(" ")}`.slice(
    0,
    platform?.charLimit ?? 2200
  );

  return (
    <div className="advanced-content-generator">
      <h2>AI Content Studio</h2>

      <div className="controls">
        <div className="control-group">
          <label>Tone</label>
          <select value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="casual">Casual</option>
            <option value="funny">Funny</option>
            <option value="inspirational">Inspirational</option>
            <option value="professional">Professional</option>
          </select>
        </div>
        <div className="control-group">
          <label>Occasion</label>
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
            <option value="casual">Casual</option>
            <option value="party">Party</option>
            <option value="work">Work</option>
            <option value="date">Date</option>
          </select>
        </div>
        <div className="control-group">
          <label>Image Style</label>
          <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value as typeof imageStyle)}>
            {IMAGE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleGenerateCaption}
          disabled={loading}
          className="btn-generate"
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
          Generate Caption
        </button>
        <button
          type="button"
          onClick={handleSuggestHashtags}
          disabled={loading}
          className="btn-generate"
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Hash size={16} />}
          Suggest Hashtags
        </button>
        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={imageLoading}
          className="btn-generate"
        >
          {imageLoading ? <Loader2 size={16} className="spin" /> : <ImageIcon size={16} />}
          Create Styled Image
        </button>
      </div>

      <div className="preview-area">
        <div className="caption-editor">
          <h3>Caption</h3>
          <textarea
            value={editableCaption}
            onChange={(e) => setEditableCaption(e.target.value)}
            rows={4}
            placeholder="Your caption will appear here..."
          />
          <small className="char-count">{editableCaption.length} characters</small>
          <button
            type="button"
            onClick={() => copyToClipboard(editableCaption)}
          >
            <Copy size={14} /> Copy
          </button>
        </div>

        <div className="hashtag-panel">
          <h3>Hashtags</h3>
          <div className="hashtag-list">
            {hashtags.map((tag) => (
              <span
                key={tag}
                role="button"
                tabIndex={0}
                className={`hashtag-chip ${selectedHashtags.includes(tag) ? "selected" : ""}`}
                onClick={() => toggleHashtag(tag)}
                onKeyDown={(e) =>
                  e.key === "Enter" && toggleHashtag(tag)
                }
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(selectedHashtags.join(" "))}
          >
            <Copy size={14} /> Copy Selected
          </button>
        </div>

        <div className="image-preview">
          <h3>AI-Styled Image</h3>
          {imageLoading ? (
            <div className="image-loading">
              <Loader2 size={32} className="spin" />
              <span>Creating styled image...</span>
            </div>
          ) : styledImage ? (
            <>
              <img src={styledImage} alt="AI styled fashion" />
              <button type="button" onClick={downloadImage}>
                <Download size={14} /> Download
              </button>
            </>
          ) : (
            <p className="image-placeholder">Click &quot;Create Styled Image&quot; to generate</p>
          )}
        </div>
      </div>

      <div className="platform-preview">
        <h3>Preview</h3>
        <div className="platform-tabs">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              className={selectedPlatform === p.id ? "active" : ""}
              onClick={() => setSelectedPlatform(p.id)}
            >
              {p.icon ?? p.name[0]} {p.name}
            </button>
          ))}
        </div>
        <div className="preview-card">
          {styledImage && (
            <img src={styledImage} alt="post" className="preview-image" />
          )}
          <p className="preview-text">{finalPost}</p>
          <small>
            {finalPost.length} / {platform?.charLimit ?? 2200} characters
          </small>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(finalPost)}
        >
          <Copy size={14} /> Copy Full Post
        </button>
      </div>
    </div>
  );
};

export default AdvancedContentGenerator;
