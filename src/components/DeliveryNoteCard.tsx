import { useState } from "react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import {
  Building2,
  Calendar,
  Layers,
  Undo2,
  Download,
  Hash,
  Truck,
  User,
  AlertCircle,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDownloadUrl } from "@/services/api";
import { cn } from "@/lib/utils";
import type { DeliveryNote } from "@/types/pdf";

interface DeliveryNoteCardProps {
  note: DeliveryNote;
  onUndo?: (noteId: string) => void;
  onUpdate?: (noteId: string, updates: Partial<DeliveryNote>) => void;
  showUndo?: boolean;
}

interface EditableFieldProps {
  value?: string;
  placeholder: string;
  icon: React.ReactNode;
  label: string;
  isMissing: boolean;
  onSave: (value: string) => void;
}

function EditableField({ value, placeholder, icon, label, isMissing, onSave }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {icon}
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="h-7 w-32 text-xs"
          autoFocus
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
          <Check className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted",
        isMissing && "border border-dashed border-warning bg-warning/5 text-warning"
      )}
      title={isMissing ? `Klik for at udfylde ${label}` : `Klik for at redigere ${label}`}
    >
      {icon}
      {value || (
        <span className="flex items-center gap-1 italic">
          <AlertCircle className="h-3 w-3" />
          Mangler
        </span>
      )}
      {!isMissing && <Pencil className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100" />}
    </button>
  );
}

export function DeliveryNoteCard({
  note,
  onUndo,
  onUpdate,
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

  const handleFieldUpdate = (field: keyof DeliveryNote, value: string) => {
    onUpdate?.(note.id, { [field]: value });
  };

  const hasMissingFields =
    !note.deliveryDate ||
    !note.deliveryNoteNumber ||
    !note.shippingId ||
    !note.customerNumber ||
    !note.companyName;

  return (
    <div className={cn("dashboard-card group", hasMissingFields && "border-warning/50")}>
      <div className="space-y-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="truncate text-lg font-semibold text-foreground">
            {note.displayName || note.deliveryNoteNumber || "Følgeseddel"}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <a href={getDownloadUrl(note.id)} download>
                <Download className="h-4 w-4" />
                Download
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

        {/* Horizontal fields grid */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {/* Delivery Note Number */}
          <EditableField
            value={note.deliveryNoteNumber}
            placeholder="Følgeseddelnr."
            icon={<Hash className="h-4 w-4" />}
            label="følgeseddelnummer"
            isMissing={!note.deliveryNoteNumber}
            onSave={(v) => handleFieldUpdate("deliveryNoteNumber", v)}
          />

          {/* Company */}
          <EditableField
            value={note.companyName}
            placeholder="Firma"
            icon={<Building2 className="h-4 w-4" />}
            label="firma"
            isMissing={!note.companyName}
            onSave={(v) => handleFieldUpdate("companyName", v)}
          />

          {/* Delivery Date */}
          <EditableField
            value={note.deliveryDate}
            placeholder="Dato"
            icon={<Calendar className="h-4 w-4" />}
            label="dato"
            isMissing={!note.deliveryDate}
            onSave={(v) => handleFieldUpdate("deliveryDate", v)}
          />

          {/* Shipping ID */}
          <EditableField
            value={note.shippingId}
            placeholder="Forsendelse ID"
            icon={<Truck className="h-4 w-4" />}
            label="forsendelse ID"
            isMissing={!note.shippingId}
            onSave={(v) => handleFieldUpdate("shippingId", v)}
          />

          {/* Customer Number */}
          <EditableField
            value={note.customerNumber}
            placeholder="Kundenr."
            icon={<User className="h-4 w-4" />}
            label="kundenummer"
            isMissing={!note.customerNumber}
            onSave={(v) => handleFieldUpdate("customerNumber", v)}
          />

          {/* Page info (not editable) */}
          <span className="flex items-center gap-1.5 px-2 py-1">
            <Layers className="h-4 w-4" />
            {pageRange()}
          </span>
        </div>

        {/* Missing fields warning */}
        {hasMissingFields && (
          <div className="flex items-center gap-2 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
            <AlertCircle className="h-4 w-4" />
            <span>Nogle felter mangler - klik på dem for at udfylde</span>
          </div>
        )}

        {/* Creation date */}
        <div className="text-xs text-muted-foreground">
          Oprettet: {formatDate(note.createdAt)}
        </div>
      </div>
    </div>
  );
}
