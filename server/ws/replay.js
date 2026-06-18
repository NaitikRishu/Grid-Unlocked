module.exports = function replayHandler(ws) {
  ws.send(
    JSON.stringify({
      type: "INFO",
      message: "Replay service scaffold is online. Phase 9 streaming is not implemented yet.",
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

    ws.send(
      JSON.stringify({
        type: "ACK",
        event_id: parsed.event_id || null,
        message: "Replay request received, but streaming snapshots are not implemented yet.",
      }),
    );
  });
};
