import { format } from "date-fns";
import { da } from "date-fns/locale";
import { FileText, Building2, Calendar, Layers, Undo2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/services/api";
import type { DeliveryNote } from "@/types/pdf";

interface DeliveryNoteCardProps {
  note: DeliveryNote;
  onUndo?: (noteId: string) => void;
  showUndo?: boolean;
}

export function DeliveryNoteCard({
  note,
  onUndo,
  showUndo = false,
}: DeliveryNoteCardProps) {
  const formatDate = (date: Date) => {
    return format(date, "d. MMMM yyyy 'kl.' HH:mm", { locale: da });
  };

  const pageRange = () => {
    const sorted = [...note.pageNumbers].sort((a, b) => a - b);
    if (sorted.length === 1) return `Side ${sorted[0]}`;
    if (sorted.length <= 3) return `Side ${sorted.join(", ")}`;
    return `Side ${sorted[0]}-${sorted[sorted.length - 1]} (${sorted.length} sider)`;
  };

  return (
    <div className="dashboard-card group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          {/* Title */}
          <h3 className="truncate text-lg font-semibold text-foreground">
            {note.displayName}
          </h3>

          {/* Meta info */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {note.companyName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(note.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              {pageRange()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <a href={getDownloadUrl(note.id)} download>
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          </Button>

          {showUndo && onUndo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUndo(note.id)}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Undo2 className="h-4 w-4" />
              Fortryd
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
