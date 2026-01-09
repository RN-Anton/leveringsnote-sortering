export interface PDFDocument {
  id: string;
  originalFilename: string;
  uploadDate: Date;
  fileHash?: string;
  pageCount: number;
  file?: File;
}

export interface UploadedFile {
  file: File;
  id?: string;
  filename: string;
  status: 'pending' | 'uploading' | 'ready' | 'processing' | 'done' | 'error';
  error?: string;
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
  displayName: string;
  companyName: string;
  deliveryDate?: string;
  deliveryNoteNumber?: string;
  shippingId?: string;
  customerNumber?: string;
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

export interface BatchProcessingProgress {
  status: 'idle' | 'analyzing' | 'processing_file' | 'completed' | 'error' | 'warning';
  current_file?: string;
  currentFile?: string;
  page?: number;
  total_pages?: number;
  file_index?: number;
  fileIndex?: number;
  total_files?: number;
  totalFiles?: number;
  progress: number;
  message?: string;
}
