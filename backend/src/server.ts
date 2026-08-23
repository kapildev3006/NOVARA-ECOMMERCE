import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { config, validateEnv } from "./config/env";
import { initializeSocket } from "./realtime/socket";
import { startScheduler } from "./utils/scheduler";

const startServer = async () => {
  validateEnv();
  
  await connectDB();

  const server = http.createServer(app);
  
  // Initialize Socket.IO on the same HTTP server
  initializeSocket(server);

  // Start background workers
  startScheduler();

  server.listen(config.PORT, () => {
    console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  });
};

startServer();
