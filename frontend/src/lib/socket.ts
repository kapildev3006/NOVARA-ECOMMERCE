import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./api-config";

let socket: Socket | null = null;

// Lazy instantiation of the socket singleton
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false, // We'll let consumers connect when needed
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

// Expose a way to completely disconnect and cleanup if ever needed globally
export const cleanupSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
