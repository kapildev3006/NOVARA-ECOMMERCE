// Default backend API URL for standard local development setup
// In a real application, this would be read from process.env.NEXT_PUBLIC_API_URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// For Socket.IO, we need the origin (base host without /api/v1)
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
