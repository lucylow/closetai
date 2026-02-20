import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  resultImageBlob: Blob | null;
  onShare?: (blob: Blob) => Promise<{ url: string }>;
  disabled?: boolean;
}

const ShareButton = ({
  resultImageBlob,
  onShare,
  disabled = false,
}: ShareButtonProps) => {
  const [shareUrl, setShareUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!resultImageBlob || !onShare) return;
    setLoading(true);
    try {
      const { url } = await onShare(resultImageBlob);
      setShareUrl(url);
      toast.success("Shareable link created!");
    } catch {
      toast.error("Share failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="share-section">
      <Button
        onClick={handleShare}
        disabled={loading || disabled || !resultImageBlob}
        variant="outline"
        className="share-btn"
      >
        {loading ? (
          "Sharing…"
        ) : (
          <>
            <Share2 size={16} /> Share result
          </>
        )}
      </Button>
      {shareUrl && (
        <div className="share-url">
          <p className="text-sm font-medium">Share this link:</p>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-all text-sm"
          >
            {shareUrl}
          </a>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="copy-btn"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
