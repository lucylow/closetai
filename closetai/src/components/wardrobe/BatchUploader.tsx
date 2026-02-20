import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

export interface UploadedItem {
  id: string;
  file: File;
  preview: string;
  category: string;
  attributes: Record<string, string>;
  tags: string[];
}

interface BatchUploaderProps {
  onUploadComplete: (items: UploadedItem[]) => void;
}

const BatchUploader = ({ onUploadComplete }: BatchUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const items: UploadedItem[] = acceptedFiles.slice(0, 20).map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        category: "unknown",
        attributes: {},
        tags: [],
      }));
      onUploadComplete(items);
    },
    [onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".heic", ".webp"] },
    maxFiles: 20,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
        `}
      >
        <input {...getInputProps()} />
        <Upload size={40} className="mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive ? "Drop your photos here..." : "Drag & drop up to 20 photos, or click to select"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Supported: JPG, PNG, HEIC, WebP</p>
      </div>
    </div>
  );
};

export default BatchUploader;
