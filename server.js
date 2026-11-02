const app = require("./app");

const startServer = (port) => {
  const PORT = port || process.env.PORT || 3000;

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
  });

  // Handle Graceful Shutdown
  const shutdown = () => {
    console.log("Closing HTTP server...");
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return server;
};

module.exports = startServer;
