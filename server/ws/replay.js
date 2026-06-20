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

module.exports = function(ws) {
  let interval = null;

  // Clear interval safely to avoid leaks
  const cleanup = () => {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const event_id = data.event_id;

      if (!event_id) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Missing event_id' }));
        return;
      }

      cleanup(); // clean up any existing interval on this socket

      let snapshots = [];
      try {
        const response = await fetch(`${FASTAPI_BASE_URL}/api/replay/${event_id}`);
        if (response.status === 404) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Replay not found' }));
          return;
        } else if (!response.ok) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'FastAPI unavailable or server error' }));
          return;
        }
        snapshots = await response.json();
      } catch (err) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'FastAPI unavailable or server error' }));
        return;
      }

      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        ws.send(JSON.stringify({ type: 'DONE' }));
        return;
      }

      let i = 0;
      interval = setInterval(() => {
        if (i >= snapshots.length) {
          ws.send(JSON.stringify({ type: 'DONE' }));
          cleanup();
          return;
        }

        const snapshot = snapshots[i];
        
        ws.send(JSON.stringify({
          type: 'SNAPSHOT',
          timestamp: snapshot.timestamp,
          zone_scores: snapshot.zone_scores,
          progress_percent: Math.round((i / snapshots.length) * 100)
        }));

        i++;
      }, 800);

    } catch (err) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid JSON message or internal error' }));
    }
  });

  ws.on('close', () => {
    cleanup();
  });

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
