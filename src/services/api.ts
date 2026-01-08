import { API_ENDPOINTS } from "@/config/api";
import type { DeliveryNote, PDFDocument } from "@/types/pdf";

// API Response types
interface UploadResponse {
  id: string;
  originalFilename: string;
  uploadDate: string;
  fileHash: string;
  pageCount: number;
}

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
    createdAt: string;
    pageNumbers: number[];
  }>;
  total: number;
}

// Upload a PDF document
export async function uploadDocument(file: File): Promise<PDFDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(API_ENDPOINTS.uploadDocument, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Upload fejlede" }));
    throw new Error(error.detail || "Upload fejlede");
  }

  const data: UploadResponse = await response.json();

  return {
    id: data.id,
    originalFilename: data.originalFilename,
    uploadDate: new Date(data.uploadDate),
    fileHash: data.fileHash,
    pageCount: data.pageCount,
    file, // Keep the file reference for thumbnail rendering
  };
}

// Create a delivery note
export async function createDeliveryNote(params: {
  documentId: string;
  displayName: string;
  companyName: string;
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

  const data: GetNotesResponse = await response.json();

  return data.notes.map((note) => ({
    id: note.id,
    documentId: note.documentId,
    displayName: note.displayName,
    companyName: note.companyName,
    createdAt: new Date(note.createdAt),
    pageNumbers: note.pageNumbers,
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
