import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

interface ScreenshotUploaderProps {
  onUpload: (file: File) => void;
}

const ScreenshotUploader = ({ onUpload }: ScreenshotUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
      `}
    >
      <input {...getInputProps()} />
      <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">
        Upload a screenshot of an item you&apos;re considering
      </p>
      <p className="text-xs text-muted-foreground mt-1">Click or drag & drop</p>
    </div>
  );
};

export default ScreenshotUploader;
