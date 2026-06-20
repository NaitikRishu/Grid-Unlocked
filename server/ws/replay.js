const FASTAPI_BASE_URL = 'http://127.0.0.1:8000';

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

  ws.on('error', () => {
    cleanup();
  });
};
