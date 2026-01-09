import { FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { BatchProcessingProgress } from "@/types/pdf";

interface ProcessingProgressProps {
  progress: BatchProcessingProgress;
}

export function ProcessingProgress({ progress }: ProcessingProgressProps) {
  // Normalize snake_case from backend to camelCase
  const status = progress.status;
  const currentFile = progress.current_file || progress.currentFile;
  const page = progress.page;
  const totalPages = progress.total_pages;
  const fileIndex = progress.file_index || progress.fileIndex;
  const totalFiles = progress.total_files || progress.totalFiles;
  const percent = progress.progress;
  const message = progress.message;

  if (status === "idle") return null;

  const isProcessing = status === "analyzing" || status === "processing_file";

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm animate-fade-in">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {status === "completed" ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : status === "error" ? (
            <AlertTriangle className="h-6 w-6 text-destructive" />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          )}
          <div>
            <h3 className="font-semibold text-foreground">
              {status === "completed"
                ? "AI-analyse fuldført"
                : status === "error"
                ? "Fejl under behandling"
                : "Analyserer PDF-filer..."}
            </h3>
            {isProcessing && totalFiles && totalFiles > 1 && (
              <p className="text-sm text-muted-foreground">
                Fil {fileIndex} af {totalFiles}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={percent} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{percent}%</span>
            {currentFile && isProcessing && (
              <span className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                {currentFile}
              </span>
            )}
          </div>
        </div>

        {/* Page-level progress */}
        {isProcessing && page && totalPages && (
          <div className="text-sm text-muted-foreground text-center">
            Analyserer side {page} af {totalPages}
          </div>
        )}

        {/* Warning/Error message */}
        {(status === "warning" || status === "error") && message && (
          <div
            className={`rounded-md p-3 text-sm ${
              status === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-warning/10 text-warning"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
