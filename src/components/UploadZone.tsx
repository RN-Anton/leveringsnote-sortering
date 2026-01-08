import { useCallback, useState } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

// Security: Allowed MIME types
const ALLOWED_MIME_TYPES = ["application/pdf"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Security: Sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s.-]/g, "_") // Replace special chars
    .replace(/\.{2,}/g, ".") // Prevent directory traversal
    .replace(/^\.+/, "") // Remove leading dots
    .slice(0, 255); // Limit length
}

export function UploadZone({ onFileSelect, isProcessing }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Security: MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Filtypen understøttes ikke. Kun PDF-filer er tilladt.";
    }

    // Security: File size validation (DoS prevention)
    if (file.size > MAX_FILE_SIZE) {
      return "Filen er for stor. Maksimum filstørrelse er 20MB.";
    }

    // Basic filename validation
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return "Filen skal have en .pdf-filendelse.";
    }

    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      setSuccess(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Create a new file with sanitized name
      const sanitizedName = sanitizeFilename(file.name);
      const sanitizedFile = new File([file], sanitizedName, {
        type: file.type,
      });

      setSuccess(`"${sanitizedName}" er klar til behandling`);
      onFileSelect(sanitizedFile);
    },
    [validateFile, onFileSelect]
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

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <label
        className={cn(
          "upload-zone cursor-pointer",
          isDragging && "drag-over",
          isProcessing && "pointer-events-none opacity-60"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="sr-only"
          disabled={isProcessing}
        />

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
                ? "Behandler PDF..."
                : isDragging
                ? "Slip filen her"
                : "Træk en PDF-fil hertil"}
            </p>
            <p className="text-sm text-muted-foreground">
              eller klik for at vælge en fil (maks. 20MB)
            </p>
          </div>
        </div>
      </label>

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
