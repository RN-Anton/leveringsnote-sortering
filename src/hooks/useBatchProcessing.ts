import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { DeliveryNote, BatchProcessingProgress } from "@/types/pdf";
import * as api from "@/services/api";

export function useBatchProcessing() {
  const [files, setFiles] = useState<File[]>([]);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [progress, setProgress] = useState<BatchProcessingProgress>({
    status: "idle",
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Add files to queue
  const addFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setProgress({ status: "idle", progress: 0 });
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setProgress({ status: "idle", progress: 0 });
  }, []);

  // Start batch processing
  const startProcessing = useCallback(async () => {
    if (files.length === 0) {
      toast.error("Ingen filer at behandle");
      return;
    }

    setIsProcessing(true);
    setProgress({ status: "analyzing", progress: 0, totalFiles: files.length });

    try {
      await api.batchProcessFiles(files, (progressData) => {
        setProgress(progressData);

        if (progressData.status === "warning") {
          toast.warning(progressData.message);
        }
      });

      // Fetch the created notes after processing completes
      try {
        const notes = await api.getDeliveryNotes();
        setDeliveryNotes(notes);
        toast.success(`AI-analyse fuldført - ${notes.length} følgesedler fundet`);
      } catch (fetchError) {
        console.error("Error fetching notes after processing:", fetchError);
        toast.warning("Behandling fuldført, men kunne ikke hente resultater");
      }

      setFiles([]);
      setProgress({ status: "completed", progress: 100 });
    } catch (error) {
      console.error("Batch processing error:", error);
      setProgress({
        status: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Ukendt fejl",
      });
      toast.error(error instanceof Error ? error.message : "Behandling fejlede");
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  // Refresh notes from backend
  const refreshNotes = useCallback(async () => {
    try {
      const notes = await api.getDeliveryNotes();
      setDeliveryNotes(notes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Kunne ikke hente følgesedler");
    }
  }, []);

  // Delete a note
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      await api.deleteDeliveryNote(noteId);
      setDeliveryNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Følgeseddel slettet");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke slette følgeseddel");
    }
  }, []);

  // Update a note (for inline editing)
  const updateNote = useCallback((noteId: string, updates: Partial<DeliveryNote>) => {
    setDeliveryNotes((prev) =>
      prev.map((note) => (note.id === noteId ? { ...note, ...updates } : note))
    );
    // TODO: Implement backend update when endpoint is available
    toast.success("Felt opdateret");
  }, []);

  return {
    files,
    deliveryNotes,
    progress,
    isProcessing,
    addFiles,
    clearFiles,
    startProcessing,
    refreshNotes,
    deleteNote,
    updateNote,
  };
}
