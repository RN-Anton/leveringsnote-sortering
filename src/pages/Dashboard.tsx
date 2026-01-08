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
} from "lucide-react";
import { Header } from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getDeliveryNotes, getDownloadUrl } from "@/services/api";
import type { DeliveryNote } from "@/types/pdf";

type SortField = "createdAt" | "displayName" | "companyName";
type SortDirection = "asc" | "desc";

const Dashboard = () => {
  const [notes, setNotes] = useState<DeliveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.displayName.toLowerCase().includes(query) ||
          note.companyName.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "createdAt":
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case "displayName":
          comparison = a.displayName.localeCompare(b.displayName, "da");
          break;
        case "companyName":
          comparison = a.companyName.localeCompare(b.companyName, "da");
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

        {/* Search and Sort controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Søg efter navn eller firma..."
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
            <SortButton field="createdAt" label="Dato" icon={Calendar} />
            <SortButton field="displayName" label="Navn" icon={FileText} />
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
                className="dashboard-card flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground">
                    {note.displayName}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {note.companyName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(note.createdAt, "d. MMM yyyy", { locale: da })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {note.pageNumbers.length}{" "}
                      {note.pageNumbers.length === 1 ? "side" : "sider"}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="shrink-0 gap-2" asChild>
                  <a href={getDownloadUrl(note.id)} download>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
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
      </main>
    </div>
  );
};

export default Dashboard;
