import React, { useRef, useEffect, useState } from "react";
import { Camera, Upload, RotateCcw } from "lucide-react";

interface CameraViewProps {
  onCapture: (blob: Blob) => void;
  capturedPreview?: Blob | null;
  onRetake?: () => void;
}

const CameraView = ({ onCapture, capturedPreview, onRetake }: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setCameraError("Camera access denied. Try uploading a photo instead.");
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video && video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg", 0.9);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      onCapture(file);
    }
    e.target.value = "";
  };

  if (capturedPreview) {
    return (
      <div className="camera-view captured">
        <img
          src={URL.createObjectURL(capturedPreview)}
          alt="Captured"
          className="captured-image"
        />
        {onRetake && (
          <button type="button" onClick={onRetake} className="capture-btn retake">
            <RotateCcw size={14} /> Retake
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="camera-view">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="camera-preview"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />
      {cameraError && (
        <p className="camera-error text-sm text-destructive">{cameraError}</p>
      )}
      <div className="camera-controls">
        <button type="button" onClick={startCamera} className="capture-btn">
          <Camera size={16} /> Start Camera
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="capture-btn"
        >
          <Upload size={16} /> Upload Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload photo"
        />
        {stream && (
          <button type="button" onClick={capturePhoto} className="capture-btn primary">
            Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraView;
