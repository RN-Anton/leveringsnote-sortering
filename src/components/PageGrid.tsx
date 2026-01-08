import { PageThumbnail } from "./PageThumbnail";
import type { PageSelectionState } from "@/types/pdf";

interface PageGridProps {
  totalPages: number;
  selectedPages: Set<number>;
  allocatedPages: Map<number, string>; // pageNumber -> noteId
  removedPages: Set<number>;
  onPageClick: (pageNumber: number) => void;
  onRemovePage: (pageNumber: number) => void;
  file?: File | null;
}

export function PageGrid({
  totalPages,
  selectedPages,
  allocatedPages,
  removedPages,
  onPageClick,
  onRemovePage,
  file,
}: PageGridProps) {
  const getPageState = (pageNumber: number): PageSelectionState => {
    if (allocatedPages.has(pageNumber)) return "allocated";
    if (selectedPages.has(pageNumber)) return "selected";
    return "available";
  };

  // Filter out removed pages
  const visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (pageNumber) => !removedPages.has(pageNumber)
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {visiblePages.map((pageNumber) => (
        <PageThumbnail
          key={pageNumber}
          pageNumber={pageNumber}
          state={getPageState(pageNumber)}
          onClick={() => onPageClick(pageNumber)}
          onRemove={() => onRemovePage(pageNumber)}
          allocatedToNote={allocatedPages.get(pageNumber)}
          file={file}
        />
      ))}
    </div>
  );
}
