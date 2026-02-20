/**
 * Canvas utilities for capturing try-on results as shareable images.
 */

/**
 * Capture an image element or blob as a PNG blob for sharing.
 */
export async function captureAsBlob(
  source: HTMLImageElement | string,
  format: "image/png" | "image/jpeg" = "image/png",
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = typeof source === "string" ? new Image() : null;
    const imageEl = typeof source === "string" ? img! : source;

    const draw = () => {
      const canvas = document.createElement("canvas");
      canvas.width = imageEl.naturalWidth || imageEl.width;
      canvas.height = imageEl.naturalHeight || imageEl.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(imageEl, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob creation failed"))),
        format,
        quality
      );
    };

    if (typeof source === "string") {
      img!.crossOrigin = "anonymous";
      img!.onload = draw;
      img!.onerror = () => reject(new Error("Failed to load image"));
      img!.src = source;
    } else {
      if (imageEl.complete && imageEl.naturalWidth) {
        draw();
      } else {
        imageEl.onload = draw;
        imageEl.onerror = () => reject(new Error("Failed to load image"));
      }
    }
  });
}

/**
 * Create a data URL from a blob (for preview or inline display).
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
