#!/bin/bash

# Exit on absolute failures, but let us handle cleanup
trap cleanup EXIT INT TERM

cleanup() {
    echo -e "\n\033[1;31mStopping all services...\033[0m"
    # Kill background jobs spawned by this script
    if [ -n "$FASTAPI_PID" ]; then kill $FASTAPI_PID 2>/dev/null; fi
    if [ -n "$EXPRESS_PID" ]; then kill $EXPRESS_PID 2>/dev/null; fi
    if [ -n "$VITE_PID" ]; then kill $VITE_PID 2>/dev/null; fi
    exit
}

echo -e "\033[1;36m==================================================\033[0m"
echo -e "\033[1;36m           Grid Unlocked - Local Launcher         \033[0m"
echo -e "\033[1;36m==================================================\033[0m"

# 1. Check prerequisites
echo -e "\n\033[1;33m[1/4] Checking prerequisites...\033[0m"
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js (v18+) to run this project."
    exit 1
fi
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3 (v3.9+) to run this project."
    exit 1
fi
echo "✓ Node.js $(node -v) found"
echo "✓ Python $(python3 --version) found"

# 2. Setup Python environment
echo -e "\n\033[1;33m[2/4] Setting up Python virtual environment...\033[0m"
cd ml
if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing Python dependencies (this might take a minute)..."
pip install -r requirements.txt
cd ..

# 3. Setup Node environments
echo -e "\n\033[1;33m[3/4] Installing Node dependencies...\033[0m"
echo "Installing Server dependencies..."
cd server
npm install
cd ..

echo "Installing Frontend dependencies..."
cd frontend
npm install
cd ..

# 4. Start services
echo -e "\n\033[1;33m[4/4] Starting all services...\033[0m"

# Start FastAPI
echo "Starting FastAPI on port 8000..."
cd ml
PYTHONPATH=. ../ml/venv/bin/python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 > ../fastapi.log 2>&1 &
FASTAPI_PID=$!
cd ..

# Start Express Server (ws / proxy)
echo "Starting Express Server on port 3001..."
cd server
node index.js > ../express.log 2>&1 &
EXPRESS_PID=$!
cd ..

# Start React Dev Server (Vite)
echo "Starting Vite Dev Server on port 5173..."
cd frontend
npm run dev > ../vite.log 2>&1 &
VITE_PID=$!
cd ..

# Wait a moment for ports to bind
sleep 3

echo -e "\n\033[1;32m==================================================\033[0m"
echo -e "\033[1;32m             ALL SERVICES ARE RUNNING!            \033[0m"
echo -e "\033[1;32m==================================================\033[0m"
echo -e "Access the frontend dashboard: \033[1;34mhttp://localhost:5173\033[0m"
echo -e "FastAPI Backend API docs:      \033[1;34mhttp://localhost:8000/docs\033[0m"
echo -e "Express proxy/WS Gateway:      \033[1;34mhttp://localhost:3001\033[0m"
echo -e "Logs are being written to: \033[1;35mfastapi.log, express.log, vite.log\033[0m"
echo -e "\nPress [Ctrl+C] to stop all services."

# Keep script running to monitor background jobs
while true; do
    sleep 1
    # Check if any process died
    if ! kill -0 $FASTAPI_PID 2>/dev/null; then
        echo -e "\n\033[1;31mFastAPI service stopped unexpectedly. See fastapi.log\033[0m"
        exit 1
    fi
    if ! kill -0 $EXPRESS_PID 2>/dev/null; then
        echo -e "\n\033[1;31mExpress service stopped unexpectedly. See express.log\033[0m"
        exit 1
    fi
    if ! kill -0 $VITE_PID 2>/dev/null; then
        echo -e "\n\033[1;31mVite dev server stopped unexpectedly. See vite.log\033[0m"
        exit 1
    fi
done
