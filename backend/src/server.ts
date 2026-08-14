import http from "http";
import app from "./app";
import { connectDB } from "./config/database";
import { config, validateEnv } from "./config/env";
import { initializeSocket } from "./realtime/socket";

const startServer = async () => {
  validateEnv();
  
  await connectDB();

  const server = http.createServer(app);
  
  // Initialize Socket.IO on the same HTTP server
  initializeSocket(server);

  server.listen(config.PORT, () => {
    console.log(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
  });
};

startServer();
