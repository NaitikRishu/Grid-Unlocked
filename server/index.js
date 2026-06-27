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

app.get("/", (_req, res) => {
  res.type("text/html").send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Grid Unlocked - API Gateway</title>
      <style>
        body {
          background-color: #0d0f12;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .container {
          text-align: center;
          border: 1px solid #1e293b;
          padding: 2.5rem;
          border-radius: 12px;
          background-color: #11141a;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        h1 {
          color: #38bdf8;
          font-size: 1.8rem;
          margin-bottom: 0.5rem;
        }
        p {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }
        a {
          color: #0ea5e9;
          text-decoration: none;
          font-weight: 500;
          border: 1px solid #0ea5e9;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        a:hover {
          background-color: #0ea5e9;
          color: #0d0f12;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Grid Unlocked</h1>
        <p>API Gateway & WebSocket Server is Online.</p>
        <a href="https://grid-unlocked-1782050398.netlify.app" target="_blank">Open Dashboard UI</a>
      </div>
    </body>
    </html>
  `);
});

app.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nDisallow: /");
});

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
