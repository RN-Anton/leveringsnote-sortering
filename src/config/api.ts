// API Configuration
// In production: Set VITE_SERVER_IP and VITE_SERVER_PORT as GitLab CI/CD variables
// For testing: Values are set in .env file

const SERVER_IP = import.meta.env.VITE_SERVER_IP;
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT;

export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

// API endpoints
export const API_ENDPOINTS = {
  // Documents
  uploadDocument: `${API_BASE_URL}/api/documents/upload`,
  getDocument: (id: string) => `${API_BASE_URL}/api/documents/${id}`,
  deleteDocument: (id: string) => `${API_BASE_URL}/api/documents/${id}`,
  
  // Delivery Notes
  deliveryNotes: `${API_BASE_URL}/api/delivery-notes`,
  getDeliveryNote: (id: string) => `${API_BASE_URL}/api/delivery-notes/${id}`,
  deleteDeliveryNote: (id: string) => `${API_BASE_URL}/api/delivery-notes/${id}`,
  downloadDeliveryNote: (id: string) => `${API_BASE_URL}/api/delivery-notes/${id}/download`,
  
  // Health
  health: `${API_BASE_URL}/api/health`,
} as const;
