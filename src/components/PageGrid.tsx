import { PdfThumbnail } from "./PdfThumbnail";
import type { PageSelectionState } from "@/types/pdf";

interface PageGridProps {
  visiblePages: number[];
  selectedPages: Set<number>;
  allocatedPages: Map<number, string>; // pageNumber -> noteId
  onPageClick: (pageNumber: number) => void;
  onRemovePage?: (pageNumber: number) => void;
  pdfFile?: File;
}

export function PageGrid({
  visiblePages,
  selectedPages,
  allocatedPages,
  onPageClick,
  onRemovePage,
  pdfFile,
}: PageGridProps) {
  const getPageState = (pageNumber: number): PageSelectionState => {
    if (allocatedPages.has(pageNumber)) return "allocated";
    if (selectedPages.has(pageNumber)) return "selected";
    return "available";
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {visiblePages.map((pageNumber) => (
        <PdfThumbnail
          key={pageNumber}
          pageNumber={pageNumber}
          state={getPageState(pageNumber)}
          onClick={() => onPageClick(pageNumber)}
          onRemove={onRemovePage ? () => onRemovePage(pageNumber) : undefined}
          allocatedToNote={allocatedPages.get(pageNumber)}
          pdfFile={pdfFile}
        />
      ))}
    </div>
  );
}
