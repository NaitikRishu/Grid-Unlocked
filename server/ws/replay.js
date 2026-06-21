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
    })
  );

  const cleanup = () => {
    if (activeInterval) {
      clearInterval(activeInterval);
      activeInterval = null;
    }
  };

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);
      const eventId = parsed.event_id;
      
      if (!eventId) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            message: "Missing event_id in request.",
          })
        );
        return;
      }

      cleanup(); // Cancel any ongoing streaming interval for this socket

      const data = getReplayData();
      const snapshots = data[eventId];

      if (!snapshots) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            event_id: eventId,
            message: `No precomputed replay data found for event ${eventId}.`,
          })
        );
        return;
      }

      ws.send(
        JSON.stringify({
          type: "ACK",
          event_id: eventId,
          total_steps: snapshots.length,
        })
      );

      // Stream snapshots sequentially without artificial delay for instant buffering
      for (let currentStep = 0; currentStep < snapshots.length; currentStep++) {
        const snapshot = snapshots[currentStep];
        ws.send(
          JSON.stringify({
            type: "SNAPSHOT",
            event_id: eventId,
            timestamp: snapshot.timestamp,
            zone_scores: snapshot.zone_scores,
            progress_percent: Math.round((currentStep / (snapshots.length - 1)) * 100),
          })
        );
      }

      ws.send(
        JSON.stringify({
          type: "COMPLETE",
          event_id: eventId,
        })
      );
    } catch (err) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          message: "Invalid JSON message or internal error",
        })
      );
    }
  });

  ws.on("close", () => {
    cleanup();
  });
};
