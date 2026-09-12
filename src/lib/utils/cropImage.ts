export interface CropRect {
  x: number;
  y: number;
  size: number;
}

export async function cropImageToDataUrl(
  imageUrl: string,
  crop: CropRect,
  containerWidth: number,
  containerHeight: number,
  rotation = 0,
  mirrored = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }

      const scaleX = img.naturalWidth / containerWidth;
      const scaleY = img.naturalHeight / containerHeight;
      const sx = crop.x * scaleX;
      const sy = crop.y * scaleY;
      const sSize = crop.size * Math.max(scaleX, scaleY);

      canvas.width = sSize;
      canvas.height = sSize;

      if (mirrored) {
        ctx.translate(sSize, 0);
        ctx.scale(-1, 1);
      }
      if (rotation) {
        ctx.translate(sSize / 2, sSize / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-sSize / 2, -sSize / 2);
      }

      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, sSize, sSize);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}
