import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PageSelectionState } from "@/types/pdf";

interface PageThumbnailProps {
  pageNumber: number;
  state: PageSelectionState;
  onClick: () => void;
  allocatedToNote?: string;
}

export function PageThumbnail({
  pageNumber,
  state,
  onClick,
  allocatedToNote,
}: PageThumbnailProps) {
  const isAllocated = state === "allocated";
  const isSelected = state === "selected";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isAllocated}
      className={cn(
        "page-thumbnail group relative aspect-[3/4] w-full",
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
      {/* Page preview placeholder */}
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-secondary/50 to-secondary p-4">
        {/* Page lines simulation */}
        <div className="w-full space-y-2 opacity-30">
          <div className="h-2 w-3/4 rounded bg-muted-foreground" />
          <div className="h-2 w-full rounded bg-muted-foreground" />
          <div className="h-2 w-5/6 rounded bg-muted-foreground" />
          <div className="h-2 w-2/3 rounded bg-muted-foreground" />
        </div>
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
  );
}
