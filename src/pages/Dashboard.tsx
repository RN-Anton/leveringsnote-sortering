import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import {
  Search,
  ArrowUpDown,
  Calendar,
  FileText,
  Building2,
  FolderOpen,
  Download,
  Loader2,
  Eye,
  X,
  Truck,
  Hash,
  User,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDeliveryNotes, getDownloadUrl, getPreviewUrl } from "@/services/api";
import type { DeliveryNote } from "@/types/pdf";

type SortField = "deliveryDate" | "deliveryNoteNumber" | "shippingId" | "customerNumber" | "companyName";
type SortDirection = "asc" | "desc";

const Dashboard = () => {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("deliveryDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);

  // Fetch notes from API on mount
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await getDeliveryNotes();
        setNotes(data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast.error("Kunne ikke hente følgesedler");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedNotes = useMemo(() => {
    let result = [...notes];

    // Filter by search query across all relevant fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          (note.deliveryNoteNumber?.toLowerCase() || "").includes(query) ||
          (note.shippingId?.toLowerCase() || "").includes(query) ||
          (note.customerNumber?.toLowerCase() || "").includes(query) ||
          (note.companyName?.toLowerCase() || "").includes(query) ||
          (note.deliveryDate?.toLowerCase() || "").includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "deliveryDate":
          comparison = (a.deliveryDate || "").localeCompare(b.deliveryDate || "");
          break;
        case "deliveryNoteNumber":
          comparison = (a.deliveryNoteNumber || "").localeCompare(b.deliveryNoteNumber || "", "da");
          break;
        case "shippingId":
          comparison = (a.shippingId || "").localeCompare(b.shippingId || "", "da");
          break;
        case "customerNumber":
          comparison = (a.customerNumber || "").localeCompare(b.customerNumber || "", "da");
          break;
        case "companyName":
          comparison = (a.companyName || "").localeCompare(b.companyName || "", "da");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [notes, searchQuery, sortField, sortDirection]);

  const SortButton = ({
    field,
    label,
    icon: Icon,
  }: {
    field: SortField;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <Button
      variant={sortField === field ? "secondary" : "ghost"}
      size="sm"
      onClick={() => handleSort(field)}
      className="gap-2"
    >
      <Icon className="h-4 w-4" />
      {label}
      {sortField === field && (
        <ArrowUpDown
          className={`h-3 w-3 transition-transform ${
            sortDirection === "desc" ? "rotate-180" : ""
          }`}
        />
      )}
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Oversigt over følgesedler
          </h1>
          <p className="text-muted-foreground">
            Søg og sorter i alle oprettede følgesedler
          </p>
        </div>

        {/* Main content with optional preview panel */}
        <div className="flex gap-6">
          {/* PDF Preview Panel - shown when a note is selected */}
          {selectedNote && (
            <div className="hidden w-[400px] shrink-0 lg:block">
              <div className="sticky top-8 rounded-lg border bg-card">
                {/* Preview header */}
                <div className="flex items-center justify-between border-b p-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">
                      {selectedNote.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Side 1 af {selectedNote.pageNumbers.length}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedNote(null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* PDF embed */}
                <div className="aspect-[3/4] w-full">
                  <iframe
                    src={getPreviewUrl(selectedNote.id)}
                    className="h-full w-full rounded-b-lg"
                    title={`Preview af ${selectedNote.displayName}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes list */}
          <div className="min-w-0 flex-1">
            {/* Search and Sort controls */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Søg i dato, følgeseddel, forsendelse, kunde, firma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort buttons */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center text-sm text-muted-foreground">
                  Sorter efter:
                </span>
                <SortButton field="deliveryDate" label="Dato" icon={Calendar} />
                <SortButton field="deliveryNoteNumber" label="Følgeseddel" icon={FileText} />
                <SortButton field="shippingId" label="Forsendelse" icon={Truck} />
                <SortButton field="customerNumber" label="Kunde" icon={User} />
                <SortButton field="companyName" label="Firma" icon={Building2} />
              </div>
            </div>

            {/* Loading state */}
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Henter følgesedler...</p>
              </div>
            ) : filteredAndSortedNotes.length > 0 ? (
              <div className="space-y-3">
                {filteredAndSortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`dashboard-card flex cursor-pointer items-center justify-between gap-4 transition-colors hover:bg-muted/50 ${
                      selectedNote?.id === note.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">
                        {note.deliveryNoteNumber || note.displayName || "Ukendt"}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {note.deliveryDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {note.deliveryDate}
                          </span>
                        )}
                        {note.companyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            {note.companyName}
                          </span>
                        )}
                        {note.shippingId && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" />
                            {note.shippingId}
                          </span>
                        )}
                        {note.customerNumber && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {note.customerNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {/* View button - opens in new tab */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getDownloadUrl(note.id), "_blank");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Vis
                      </Button>

                      {/* Download button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={getDownloadUrl(note.id)} download>
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg text-muted-foreground">
                  {searchQuery
                    ? "Ingen følgesedler matcher din søgning"
                    : "Ingen følgesedler endnu"}
                </p>
                {searchQuery && (
                  <Button
                    variant="link"
                    onClick={() => setSearchQuery("")}
                    className="mt-2"
                  >
                    Ryd søgning
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
