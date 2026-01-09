import { API_ENDPOINTS } from "@/config/api";
import type { DeliveryNote, BatchProcessingProgress } from "@/types/pdf";

// API Response types
interface CreateNoteResponse {
  id: string;
  status: string;
}

interface DeleteNoteResponse {
  success: boolean;
  freedPages: number[];
}

interface GetNotesResponse {
  notes: Array<{
    id: string;
    documentId: string;
    displayName: string;
    companyName: string;
    deliveryDate?: string;
    delivery_date?: string;
    deliveryNoteNumber?: string;
    delivery_note_number?: string;
    shippingId?: string;
    shipping_id?: string;
    customerNumber?: string;
    customer_number?: string;
    createdAt: string;
    created_at?: string;
    pageNumbers: number[];
  }>;
  total: number;
}

// Batch process files with SSE streaming
export async function batchProcessFiles(
  files: File[],
  onProgress: (progress: BatchProcessingProgress) => void
): Promise<void> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(API_ENDPOINTS.batchProcess, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Batch behandling fejlede" }));
    throw new Error(error.detail || "Batch behandling fejlede");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Kunne ikke læse stream");
  }

  const decoder = new TextDecoder();
  let completed = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6)) as BatchProcessingProgress;
          onProgress(data);
          
          if (data.status === "completed") {
            completed = true;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  // Ensure we signal completion if stream ended without explicit completed status
  if (!completed) {
    onProgress({ status: "completed", progress: 100 });
  }
}

// Create a delivery note
export async function createDeliveryNote(params: {
  documentId: string;
  displayName: string;
  companyName: string;
  deliveryDate?: string;
  deliveryNoteNumber?: string;
  shippingId?: string;
  customerNumber?: string;
  pageNumbers: number[];
}): Promise<string> {
  const response = await fetch(API_ENDPOINTS.deliveryNotes, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Kunne ikke oprette følgeseddel" }));
    throw new Error(error.detail || "Kunne ikke oprette følgeseddel");
  }

  const data: CreateNoteResponse = await response.json();
  return data.id;
}

// Delete/undo a delivery note
export async function deleteDeliveryNote(noteId: string): Promise<number[]> {
  const response = await fetch(API_ENDPOINTS.deleteDeliveryNote(noteId), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Kunne ikke slette følgeseddel" }));
    throw new Error(error.detail || "Kunne ikke slette følgeseddel");
  }

  const data: DeleteNoteResponse = await response.json();
  return data.freedPages;
}

// Get all delivery notes for a document
export async function getDeliveryNotes(documentId?: string): Promise<DeliveryNote[]> {
  const url = new URL(API_ENDPOINTS.deliveryNotes);
  if (documentId) {
    url.searchParams.set("document_id", documentId);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Kunne ikke hente følgesedler" }));
    throw new Error(error.detail || "Kunne ikke hente følgesedler");
  }

  // Backend returns array directly, not wrapped in { notes: [] }
  const data = await response.json();
  const notes = Array.isArray(data) ? data : data.notes || [];

  return notes.map((note: Record<string, unknown>) => ({
    id: note.id as string,
    documentId: (note.documentId || note.document_id) as string,
    displayName: (note.displayName || note.display_name) as string,
    companyName: (note.companyName || note.company_name) as string,
    deliveryDate: (note.deliveryDate || note.delivery_date) as string | undefined,
    deliveryNoteNumber: (note.deliveryNoteNumber || note.delivery_note_number) as string | undefined,
    shippingId: (note.shippingId || note.shipping_id) as string | undefined,
    customerNumber: (note.customerNumber || note.customer_number) as string | undefined,
    createdAt: new Date((note.createdAt || note.created_at || new Date()) as string),
    pageNumbers: (note.pageNumbers || []) as number[],
  }));
}

// Delete a document
export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(API_ENDPOINTS.deleteDocument(documentId), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Kunne ikke slette dokument" }));
    throw new Error(error.detail || "Kunne ikke slette dokument");
  }
}

// Download delivery note as PDF
export function getDownloadUrl(noteId: string): string {
  return API_ENDPOINTS.downloadDeliveryNote(noteId);
}

// Preview delivery note (first page)
export function getPreviewUrl(noteId: string): string {
  return API_ENDPOINTS.previewDeliveryNote(noteId);
}
