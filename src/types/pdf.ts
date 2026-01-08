export interface PDFDocument {
  id: string;
  originalFilename: string;
  uploadDate: Date;
  fileHash?: string;
  pageCount: number;
  file?: File;
}

export interface PDFPage {
  id: string;
  documentId: string;
  pageNumber: number;
  thumbnailUrl?: string;
  isAllocated: boolean;
  allocatedTo?: string; // delivery note id
}

export interface DeliveryNote {
  id: string;
  documentId: string;
  displayName: string; // Navn
  companyName: string; // Firma
  createdAt: Date;
  pageNumbers: number[];
}

export type PageSelectionState = 'available' | 'selected' | 'allocated';

export interface UploadState {
  isDragging: boolean;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}
