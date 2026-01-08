import { useState, useCallback } from "react";
import type { DeliveryNote, PDFDocument } from "@/types/pdf";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

// Generate unique ID (in production, use uuid or backend-generated IDs)
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useDeliveryNotes() {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [allocatedPages, setAllocatedPages] = useState<Map<number, string>>(
    new Map()
  );
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      // Read actual page count from PDF
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;

      const newDocument: PDFDocument = {
        id: generateId(),
        originalFilename: file.name,
        uploadDate: new Date(),
        pageCount,
        file,
      };

      // Reset all state for new document
      setDocument(newDocument);
      setSelectedPages(new Set());
      setAllocatedPages(new Map());
      setRemovedPages(new Set());
      setDeliveryNotes([]);
      setLastCreatedNoteId(null);
    } catch (error) {
      console.error("Error loading PDF:", error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Remove entire document
  const removeDocument = useCallback(() => {
    setDocument(null);
    setSelectedPages(new Set());
    setAllocatedPages(new Map());
    setRemovedPages(new Set());
    setDeliveryNotes([]);
    setLastCreatedNoteId(null);
  }, []);

  // Remove single page
  const removePage = useCallback(
    (pageNumber: number) => {
      if (allocatedPages.has(pageNumber)) return; // Can't remove allocated pages

      setRemovedPages((prev) => {
        const next = new Set(prev);
        next.add(pageNumber);
        return next;
      });

      // Also remove from selection if selected
      setSelectedPages((prev) => {
        const next = new Set(prev);
        next.delete(pageNumber);
        return next;
      });
    },
    [allocatedPages]
  );

  // Restore removed page
  const restorePage = useCallback((pageNumber: number) => {
    setRemovedPages((prev) => {
      const next = new Set(prev);
      next.delete(pageNumber);
      return next;
    });
  }, []);

  // Get visible pages (not removed)
  const visiblePages = document
    ? Array.from({ length: document.pageCount }, (_, i) => i + 1).filter(
        (p) => !removedPages.has(p)
      )
    : [];

  // Toggle page selection
  const togglePageSelection = useCallback(
    (pageNumber: number) => {
      if (allocatedPages.has(pageNumber) || removedPages.has(pageNumber)) return;

      setSelectedPages((prev) => {
        const next = new Set(prev);
        if (next.has(pageNumber)) {
          next.delete(pageNumber);
        } else {
          next.add(pageNumber);
        }
        return next;
      });
    },
    [allocatedPages, removedPages]
  );

  // Clear current selection
  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  // Create delivery note
  const createDeliveryNote = useCallback(
    (data: { displayName: string; companyName: string }) => {
      if (!document || selectedPages.size === 0) return;

      const noteId = generateId();
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);

      const newNote: DeliveryNote = {
        id: noteId,
        documentId: document.id,
        displayName: data.displayName,
        companyName: data.companyName,
        createdAt: new Date(),
        pageNumbers,
      };

      // Update allocated pages
      setAllocatedPages((prev) => {
        const next = new Map(prev);
        pageNumbers.forEach((page) => next.set(page, noteId));
        return next;
      });

      // Add note to list
      setDeliveryNotes((prev) => [newNote, ...prev]);

      // Clear selection
      setSelectedPages(new Set());

      // Track for undo
      setLastCreatedNoteId(noteId);

      return noteId;
    },
    [document, selectedPages]
  );

  // Undo last created note
  const undoLastNote = useCallback(() => {
    if (!lastCreatedNoteId) return;

    const noteToUndo = deliveryNotes.find((n) => n.id === lastCreatedNoteId);
    if (!noteToUndo) return;

    // Remove from allocated pages
    setAllocatedPages((prev) => {
      const next = new Map(prev);
      noteToUndo.pageNumbers.forEach((page) => next.delete(page));
      return next;
    });

    // Remove note
    setDeliveryNotes((prev) => prev.filter((n) => n.id !== lastCreatedNoteId));

    // Clear undo tracking
    setLastCreatedNoteId(null);
  }, [lastCreatedNoteId, deliveryNotes]);

  // Undo specific note
  const undoNote = useCallback(
    (noteId: string) => {
      const noteToUndo = deliveryNotes.find((n) => n.id === noteId);
      if (!noteToUndo) return;

      // Remove from allocated pages
      setAllocatedPages((prev) => {
        const next = new Map(prev);
        noteToUndo.pageNumbers.forEach((page) => next.delete(page));
        return next;
      });

      // Remove note
      setDeliveryNotes((prev) => prev.filter((n) => n.id !== noteId));

      if (lastCreatedNoteId === noteId) {
        setLastCreatedNoteId(null);
      }
    },
    [deliveryNotes, lastCreatedNoteId]
  );

  return {
    document,
    deliveryNotes,
    selectedPages,
    allocatedPages,
    removedPages,
    visiblePages,
    isProcessing,
    lastCreatedNoteId,
    handleFileUpload,
    removeDocument,
    removePage,
    restorePage,
    togglePageSelection,
    clearSelection,
    createDeliveryNote,
    undoLastNote,
    undoNote,
  };
}
