const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const corsMiddleware = require("./middleware/cors");
const proxyRouter = require("./routes/proxy");
const replayHandler = require("./ws/replay");
const { port, fastApiBaseUrl } = require("./config");

const app = express();
app.use(corsMiddleware);
app.use("/api", proxyRouter);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "grid-unlocked-server",
    fastApiBaseUrl,
  });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/replay" });
wss.on("connection", replayHandler);

server.listen(port, () => {
  console.log(`Gridlock server listening on http://localhost:${port}`);
});

// Debug endpoint to fetch Python logs
const fs = require('fs');
app.get('/python-log', (req, res) => {
  try {
    const logs = fs.readFileSync('../python.log', 'utf8');
    res.type('text/plain').send(logs);
  } catch (e) {
    res.status(500).send('Log file not found or unreadable: ' + e.message);
  }
});
