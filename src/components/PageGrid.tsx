import { PageThumbnail } from "./PageThumbnail";
import type { PageSelectionState } from "@/types/pdf";

interface PageGridProps {
  totalPages: number;
  selectedPages: Set<number>;
  allocatedPages: Map<number, string>; // pageNumber -> noteId
  onPageClick: (pageNumber: number) => void;
}

export function PageGrid({
  totalPages,
  selectedPages,
  allocatedPages,
  onPageClick,
}: PageGridProps) {
  const getPageState = (pageNumber: number): PageSelectionState => {
    if (allocatedPages.has(pageNumber)) return "allocated";
    if (selectedPages.has(pageNumber)) return "selected";
    return "available";
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
        <PageThumbnail
          key={pageNumber}
          pageNumber={pageNumber}
          state={getPageState(pageNumber)}
          onClick={() => onPageClick(pageNumber)}
          allocatedToNote={allocatedPages.get(pageNumber)}
        />
      ))}
    </div>
  );
}
