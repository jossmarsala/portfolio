/**
 * Loads the About portrait and re-encodes it as JPEG for the PDF renderer.
 * react-pdf only handles raster formats it can decode reliably, so WebP is
 * normalised here. Returns null when the image cannot be fetched, letting the
 * PDF fall back to an empty framed portrait instead of failing the download.
 */
export async function loadPortraitAsJpeg(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!response.ok) return null;

    const blob = await response.blob();
    const source = await decodeImage(blob);
    if (!source) return null;

    const maxEdge = 1200;
    const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);

    if (source instanceof ImageBitmap) source.close();

    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* fall through to the <img> path */
    }
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    image.src = objectUrl;
  });
}
