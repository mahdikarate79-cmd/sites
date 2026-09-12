export interface CropRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function fullCropRect(width: number, height: number): CropRect {
  return { left: 0, top: 0, right: width, bottom: height };
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
      const sx = crop.left * scaleX;
      const sy = crop.top * scaleY;
      const sw = (crop.right - crop.left) * scaleX;
      const sh = (crop.bottom - crop.top) * scaleY;

      canvas.width = sw;
      canvas.height = sh;

      if (mirrored) {
        ctx.translate(sw, 0);
        ctx.scale(-1, 1);
      }
      if (rotation) {
        ctx.translate(sw / 2, sh / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-sw / 2, -sh / 2);
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}
