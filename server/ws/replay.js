const fs = require("fs");
const path = require("path");

// Resolve replay data path
const replayDataPath = path.resolve(__dirname, "../../ml/data/processed/replay_data.json");
let replayData = null;

// Lazy load replay data to prevent blocking startup
function getReplayData() {
  if (replayData) return replayData;
  try {
    if (fs.existsSync(replayDataPath)) {
      console.log("Loading replay data in WS handler...");
      const raw = fs.readFileSync(replayDataPath, "utf-8");
      replayData = JSON.parse(raw);
      console.log(`Loaded replay data for ${Object.keys(replayData).length} events.`);
    } else {
      console.warn("Replay data file not found at:", replayDataPath);
      replayData = {};
    }
  } catch (err) {
    console.error("Failed to load replay data:", err);
    replayData = {};
  }
  return replayData;
}

module.exports = function replayHandler(ws) {
  let activeInterval = null;

  ws.send(
    JSON.stringify({
      type: "INFO",
      message: "Replay service is online.",
    }),
  );

  ws.on("message", (rawMessage) => {
    let parsed = {};

    try {
      parsed = JSON.parse(String(rawMessage));
    } catch {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Replay payload must be valid JSON.",
        }),
      );
      return;
    }

    const eventId = parsed.event_id;
    if (!eventId) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Missing event_id in request.",
        }),
      );
      return;
    }

    // Cancel any ongoing streaming interval for this socket
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }

    const data = getReplayData();
    const snapshots = data[eventId];

    if (!snapshots) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          event_id: eventId,
          message: `No precomputed replay data found for event ${eventId}.`,
        }),
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "ACK",
        event_id: eventId,
        total_steps: snapshots.length,
      }),
    );

    // Stream snapshots sequentially with a delay (e.g. 500ms per step)
    let currentStep = 0;
    activeInterval = setInterval(() => {
      if (currentStep >= snapshots.length) {
        ws.send(
          JSON.stringify({
            type: "COMPLETE",
            event_id: eventId,
          }),
        );
        clearInterval(activeInterval);
        activeInterval = null;
        return;
      }

      ws.send(
        JSON.stringify({
          type: "SNAPSHOT",
          event_id: eventId,
          step: currentStep,
          data: snapshots[currentStep],
        }),
      );
      currentStep++;
    }, 500); // 500ms interval
  });

  ws.on("close", () => {
    if (activeInterval) {
      clearInterval(activeInterval);
    }
  });
};
