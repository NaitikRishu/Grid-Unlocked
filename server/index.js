const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");
const corsMiddleware = require("./middleware/cors");
const proxyRouter = require("./routes/proxy");
const replayHandler = require("./ws/replay");
const { port, fastApiBaseUrl } = require("./config");

const app = express();
app.use(express.json());
app.use(corsMiddleware);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "grid-unlocked-server",
    fastApiBaseUrl,
  });
});

app.use("/api", proxyRouter);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/replay" });
wss.on("connection", replayHandler);

server.listen(port, () => {
  console.log(`Gridlock server listening on http://localhost:${port}`);
});
