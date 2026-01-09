import { useCallback, useState, useRef } from "react";
import { Upload, FolderOpen, AlertCircle, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onFilesSelect: (files: File[]) => void;
  isProcessing: boolean;
  selectedCount?: number;
}

// Security: Allowed MIME types
const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for batch

// Security: Sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s.-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .replace(/^\.+/, "")
    .slice(0, 255);
}

export function UploadZone({ onFilesSelect, isProcessing, selectedCount = 0 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      return `"${file.name}" understøttes ikke. Kun PDF-filer er tilladt.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" er for stor. Maksimum filstørrelse er 100MB.`;
    }

    return null;
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      setError(null);
      setSuccess(null);

      const files = Array.from(fileList);
      const pdfFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        // Skip non-PDF files silently in folder mode
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          continue;
        }

        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
          continue;
        }

        const sanitizedName = sanitizeFilename(file.name);
        const sanitizedFile = new File([file], sanitizedName, { type: "application/pdf" });
        pdfFiles.push(sanitizedFile);
      }

      if (errors.length > 0) {
        setError(errors[0]);
      }

      if (pdfFiles.length > 0) {
        setSuccess(
          pdfFiles.length === 1
            ? `"${pdfFiles[0].name}" er klar til læsning`
            : `${pdfFiles.length} PDF-filer er klar til læsning`
        );
        onFilesSelect(pdfFiles);
      } else if (errors.length === 0) {
        setError("Ingen PDF-filer fundet.");
      }
    },
    [validateFile, onFilesSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      const files: File[] = [];

      // Handle dropped files
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const openFolderDialog = () => {
    folderInputRef.current?.click();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileInput}
        className="sr-only"
        disabled={isProcessing}
      />
      <input
        ref={folderInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileInput}
        className="sr-only"
        disabled={isProcessing}
        {...{ webkitdirectory: "", directory: "" } as any}
      />

      {/* Drop zone */}
      <div
        className={cn(
          "upload-zone cursor-pointer",
          isDragging && "drag-over",
          isProcessing && "pointer-events-none opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full transition-colors",
              isDragging ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isProcessing ? (
              <FileText className="h-8 w-8 animate-pulse-soft text-primary" />
            ) : (
              <Upload
                className={cn(
                  "h-8 w-8",
                  isDragging ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">
              {isProcessing
                ? "Behandler..."
                : isDragging
                ? "Slip filerne her"
                : "Træk PDF-filer hertil"}
            </p>
            <p className="text-sm text-muted-foreground">
              eller klik for at vælge filer
            </p>
          </div>
        </div>
      </div>

      {/* Folder button */}
      <Button
        variant="outline"
        onClick={openFolderDialog}
        disabled={isProcessing}
        className="w-full gap-2"
      >
        <FolderOpen className="h-4 w-4" />
        Vælg mappe med PDF-filer
      </Button>

      {/* Selected count */}
      {selectedCount > 0 && !error && (
        <div className="text-center text-sm text-muted-foreground">
          {selectedCount} {selectedCount === 1 ? "fil" : "filer"} valgt
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && !error && (
        <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4 text-success animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}
    </div>
  );
}
