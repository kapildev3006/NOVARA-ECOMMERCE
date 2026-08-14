import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { config } from "../config/env";
import { verifyAccessToken } from "../utils/jwt";
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "./events";
import { User } from "../models/User";

let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const initializeSocket = (server: HttpServer) => {
  const corsOrigin =
    config.NODE_ENV === "production"
      ? config.FRONTEND_URL
      : config.FRONTEND_URL || "http://localhost:3000";

  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = verifyAccessToken(token);
      
      // Optionally verify user is active
      const user = await User.findById(decoded.userId).select("status");
      if (!user || user.status !== "Active") {
        return next(new Error("Authentication error: User inactive or not found"));
      }

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role as any;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // Connection Handler
  io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
    const { userId, role } = socket.data;
    
    if (config.NODE_ENV === "development") {
      console.log(`Socket connected: User ${userId} (${role}) - Socket ${socket.id}`);
    }

    // Assign rooms based on identity
    socket.join(`user:${userId}`);

    if (role === "Admin") {
      socket.join("admins");
    }

    if (role === "SuperAdmin") {
      socket.join("superadmins");
      // SuperAdmins might also need to listen to Admin events
      socket.join("admins");
    }

    socket.on("disconnect", () => {
      if (config.NODE_ENV === "development") {
        console.log(`Socket disconnected: User ${userId} (${role}) - Socket ${socket.id}`);
      }
    });
  });

  return io;
};

// --- Emission Helpers ---

export const emitToUser = <Ev extends keyof ServerToClientEvents>(
  userId: string,
  event: Ev,
  payload: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  if (io) {
    (io.to(`user:${userId}`).emit as any)(event, payload);
  }
};

export const emitToAdmins = <Ev extends keyof ServerToClientEvents>(
  event: Ev,
  payload: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  if (io) {
    (io.to("admins").emit as any)(event, payload);
  }
};

export const emitToSuperAdmins = <Ev extends keyof ServerToClientEvents>(
  event: Ev,
  payload: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  if (io) {
    (io.to("superadmins").emit as any)(event, payload);
  }
};

export const emitToOrder = <Ev extends keyof ServerToClientEvents>(
  orderId: string,
  event: Ev,
  payload: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  if (io) {
    (io.to(`order:${orderId}`).emit as any)(event, payload);
  }
};

export const emitToAll = <Ev extends keyof ServerToClientEvents>(
  event: Ev,
  payload: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  if (io) {
    (io.emit as any)(event, payload);
  }
};
