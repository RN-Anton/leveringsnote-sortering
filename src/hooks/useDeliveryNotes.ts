import { useState, useCallback } from "react";
import { pdfjsLib } from "@/lib/pdfWorker";
import { toast } from "sonner";
import type { DeliveryNote, PDFDocument } from "@/types/pdf";
import * as api from "@/services/api";

export function useDeliveryNotes() {
  const [document, setDocument] = useState<PDFDocument | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [allocatedPages, setAllocatedPages] = useState<Map<number, string>>(new Map());
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);

  // Handle file upload - uploads to backend
  const handleFileUpload = useCallback(async (file: File) => {
    setIsProcessing(true);

    try {
      // Upload to backend
      const uploadedDoc = await api.uploadDocument(file);

      // Also get page count locally for thumbnail rendering
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const newDocument: PDFDocument = {
        ...uploadedDoc,
        pageCount: pdf.numPages,
        file,
      };

      // Reset all state for new document
      setDocument(newDocument);
      setSelectedPages(new Set());
      setAllocatedPages(new Map());
      setRemovedPages(new Set());
      setDeliveryNotes([]);
      setLastCreatedNoteId(null);

      toast.success("PDF uploadet successfully");
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke uploade PDF");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Remove entire document from backend
  const clearDocument = useCallback(async () => {
    if (document) {
      try {
        await api.deleteDocument(document.id);
        toast.success("PDF slettet");
      } catch (error) {
        console.error("Error deleting document:", error);
        // Still clear locally even if backend fails
      }
    }
    
    setDocument(null);
    setSelectedPages(new Set());
    setAllocatedPages(new Map());
    setRemovedPages(new Set());
    setDeliveryNotes([]);
    setLastCreatedNoteId(null);
  }, [document]);

  // Finish with document - clear view but keep notes on backend
  const finishDocument = useCallback(() => {
    setDocument(null);
    setSelectedPages(new Set());
    setAllocatedPages(new Map());
    setRemovedPages(new Set());
    setDeliveryNotes([]);
    setLastCreatedNoteId(null);
    toast.success("Færdig - følgesedler gemt");
  }, []);

  // Remove a single page (hide it from selection - local only)
  const removePage = useCallback((pageNumber: number) => {
    if (allocatedPages.has(pageNumber)) return;

    setRemovedPages((prev) => {
      const next = new Set(prev);
      next.add(pageNumber);
      return next;
    });

    setSelectedPages((prev) => {
      const next = new Set(prev);
      next.delete(pageNumber);
      return next;
    });
  }, [allocatedPages]);

  // Restore a removed page
  const restorePage = useCallback((pageNumber: number) => {
    setRemovedPages((prev) => {
      const next = new Set(prev);
      next.delete(pageNumber);
      return next;
    });
  }, []);

  // Restore all removed pages
  const restoreAllPages = useCallback(() => {
    setRemovedPages(new Set());
  }, []);

  // Toggle page selection
  const togglePageSelection = useCallback(
    (pageNumber: number) => {
      if (allocatedPages.has(pageNumber)) return;

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
    [allocatedPages]
  );

  // Clear current selection
  const clearSelection = useCallback(() => {
    setSelectedPages(new Set());
  }, []);

  // Create delivery note via API
  const createDeliveryNote = useCallback(
    async (data: { displayName: string; companyName: string }) => {
      if (!document || selectedPages.size === 0) return;

      setIsSubmitting(true);
      const pageNumbers = Array.from(selectedPages).sort((a, b) => a - b);

      try {
        const noteId = await api.createDeliveryNote({
          documentId: document.id,
          displayName: data.displayName,
          companyName: data.companyName,
          pageNumbers,
        });

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

        toast.success("Følgeseddel oprettet");
        return noteId;
      } catch (error) {
        console.error("Error creating delivery note:", error);
        toast.error(error instanceof Error ? error.message : "Kunne ikke oprette følgeseddel");
      } finally {
        setIsSubmitting(false);
      }
    },
    [document, selectedPages]
  );

  // Undo/delete a delivery note via API
  const undoLastNote = useCallback(async () => {
    if (!lastCreatedNoteId) return;

    const noteToUndo = deliveryNotes.find((n) => n.id === lastCreatedNoteId);
    if (!noteToUndo) return;

    try {
      await api.deleteDeliveryNote(lastCreatedNoteId);

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

      toast.success("Følgeseddel fortrudt");
    } catch (error) {
      console.error("Error undoing note:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke fortryde følgeseddel");
    }
  }, [lastCreatedNoteId, deliveryNotes]);

  // Undo specific note
  const undoNote = useCallback(
    async (noteId: string) => {
      const noteToUndo = deliveryNotes.find((n) => n.id === noteId);
      if (!noteToUndo) return;

      try {
        await api.deleteDeliveryNote(noteId);

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

        toast.success("Følgeseddel slettet");
      } catch (error) {
        console.error("Error deleting note:", error);
        toast.error(error instanceof Error ? error.message : "Kunne ikke slette følgeseddel");
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
    isProcessing,
    isSubmitting,
    lastCreatedNoteId,
    handleFileUpload,
    clearDocument,
    finishDocument,
    removePage,
    restorePage,
    restoreAllPages,
    togglePageSelection,
    clearSelection,
    createDeliveryNote,
    undoLastNote,
    undoNote,
  };
}
