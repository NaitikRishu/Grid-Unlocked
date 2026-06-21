#!/bin/bash
# Start the Python ML API internally on port 8000
export PYTHONPATH=/app
cd ml
if [ ! -f "data/geo/bengaluru_graph.pkl" ]; then
    echo "Building graph..."
    python src/build_graph.py
fi
uvicorn api.main:app --host 127.0.0.1 --port 8000 > ../python.log 2>&1 &
cd ..

# Give FastAPI a moment to bind to the port
sleep 2

# Start the Node Express Gateway on port 7860 (Hugging Face default)
# Node will serve the WebSockets and proxy /api to the Python ML API
export PORT=7860
export FASTAPI_BASE_URL="http://127.0.0.1:8000"
export CORS_ORIGINS="https://grid-unlocked-1782050398.netlify.app"

cd server
node index.js
