import { useState, useEffect } from "react";
import { pdfjsLib } from "@/lib/pdfWorker";

export function usePdfThumbnail(file: File | null, pageNumber: number) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setThumbnailUrl(null);
      return;
    }

    let cancelled = false;

    const renderThumbnail = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (cancelled) return;

        const page = await pdf.getPage(pageNumber);
        
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        if (cancelled) return;

        const url = canvas.toDataURL("image/png");
        setThumbnailUrl(url);
      } catch (error) {
        console.error("Error rendering PDF thumbnail:", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [file, pageNumber]);

  return { thumbnailUrl, isLoading };
}
