module.exports = {
  port: Number(process.env.PORT || 3001),
  fastApiBaseUrl: process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000",
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3001",
        "https://grid-unlocked-1782050398.netlify.app",
      ],
};
