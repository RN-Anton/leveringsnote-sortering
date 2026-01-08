import { useEffect, useRef, useState } from "react";
import { Check, Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSelectionState } from "@/types/pdf";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

interface PdfThumbnailProps {
  pageNumber: number;
  state: PageSelectionState;
  onClick: () => void;
  onRemove?: () => void;
  allocatedToNote?: string;
  pdfFile?: File;
}

export function PdfThumbnail({
  pageNumber,
  state,
  onClick,
  onRemove,
  allocatedToNote,
  pdfFile,
}: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [renderError, setRenderError] = useState(false);

  const isAllocated = state === "allocated";
  const isSelected = state === "selected";

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!pdfFile || !canvasRef.current) return;

      try {
        setIsRendering(true);
        setRenderError(false);

        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(pageNumber);

        if (cancelled) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Calculate scale to fit thumbnail
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.min(200 / viewport.width, 280 / viewport.height);
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) {
          setIsRendering(false);
        }
      } catch (error) {
        console.error("Error rendering PDF page:", error);
        if (!cancelled) {
          setRenderError(true);
          setIsRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfFile, pageNumber]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={isAllocated}
        className={cn(
          "page-thumbnail group relative aspect-[3/4] w-full overflow-hidden",
          isSelected && "selected",
          isAllocated && "allocated"
        )}
        aria-label={
          isAllocated
            ? `Side ${pageNumber} - Allerede gemt`
            : isSelected
            ? `Side ${pageNumber} - Valgt`
            : `Side ${pageNumber} - Klik for at vælge`
        }
      >
        {/* PDF Canvas or Loading State */}
        <div className="flex h-full w-full items-center justify-center bg-white">
          {isRendering ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs text-muted-foreground">Indlæser...</span>
            </div>
          ) : renderError ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <div className="h-2 w-3/4 rounded bg-muted-foreground/30" />
              <div className="h-2 w-full rounded bg-muted-foreground/30" />
              <div className="h-2 w-5/6 rounded bg-muted-foreground/30" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* Page number badge */}
        <div
          className={cn(
            "absolute bottom-2 left-2 flex h-7 min-w-[28px] items-center justify-center rounded-md px-2 text-xs font-bold transition-colors",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground shadow-soft"
          )}
        >
          {pageNumber}
        </div>

        {/* Selection checkmark */}
        {isSelected && (
          <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-medium animate-scale-in">
            <Check className="h-4 w-4" strokeWidth={3} />
          </div>
        )}

        {/* Allocated badge */}
        {isAllocated && (
          <div className="absolute inset-x-2 top-2 flex items-center justify-center gap-1.5 rounded-md bg-muted py-1.5 text-xs font-medium text-muted-foreground">
            <Lock className="h-3 w-3" />
            Allerede gemt
          </div>
        )}

        {/* Hover indicator for available pages */}
        {!isAllocated && !isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-opacity group-hover:bg-primary/5 group-hover:opacity-100">
            <div className="rounded-full bg-primary/10 p-3">
              <Check className="h-5 w-5 text-primary" />
            </div>
          </div>
        )}
      </button>

      {/* Remove page button */}
      {onRemove && !isAllocated && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md transition-transform hover:scale-110"
          aria-label={`Fjern side ${pageNumber}`}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
