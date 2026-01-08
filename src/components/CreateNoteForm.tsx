import { useState } from "react";
import { FileText, Building2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateNoteFormProps {
  selectedCount: number;
  onSubmit: (data: { displayName: string; companyName: string }) => void;
  onClearSelection: () => void;
  isSubmitting: boolean;
}

// Security: XSS protection - sanitize user input
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
    .slice(0, 200); // Limit length
}

export function CreateNoteForm({
  selectedCount,
  onSubmit,
  onClearSelection,
  isSubmitting,
}: CreateNoteFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errors, setErrors] = useState<{ name?: string; company?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { name?: string; company?: string } = {};

    if (!displayName.trim()) {
      newErrors.name = "Navn er påkrævet";
    } else if (displayName.trim().length < 2) {
      newErrors.name = "Navnet skal være mindst 2 tegn";
    }

    if (!companyName.trim()) {
      newErrors.company = "Firmanavn er påkrævet";
    } else if (companyName.trim().length < 2) {
      newErrors.company = "Firmanavnet skal være mindst 2 tegn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCount === 0) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Security: Sanitize inputs before submission
    onSubmit({
      displayName: sanitizeInput(displayName),
      companyName: sanitizeInput(companyName),
    });

    // Reset form
    setDisplayName("");
    setCompanyName("");
    setErrors({});
  };

  const hasNoSelection = selectedCount === 0;

  return (
    <div className="form-section animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Opret Følgeseddel</h2>
        {selectedCount > 0 && (
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
            {selectedCount} {selectedCount === 1 ? "side valgt" : "sider valgt"}
          </span>
        )}
      </div>

      {hasNoSelection && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-accent p-4 text-accent-foreground">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            Hov! Du har ikke valgt nogen sider endnu. Klik på siderne ovenfor
            for at vælge dem.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Display Name field */}
        <div className="space-y-2">
          <Label
            htmlFor="displayName"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            Hvad skal følgesedlen kaldes?
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder="F.eks. Levering marts 2024"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={200}
            className={errors.name ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        {/* Company Name field */}
        <div className="space-y-2">
          <Label
            htmlFor="companyName"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Hvilket firma er det fra?
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="F.eks. Nordjysk Handel A/S"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            maxLength={200}
            className={errors.company ? "border-destructive" : ""}
            disabled={isSubmitting}
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button
            type="submit"
            variant="danish"
            disabled={hasNoSelection || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Opretter..." : "Opret følgeseddel"}
          </Button>

          {selectedCount > 0 && (
            <Button
              type="button"
              variant="clear"
              onClick={onClearSelection}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              Ryd valg
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
