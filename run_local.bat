@echo off
echo ==================================================
echo            Grid Unlocked - Local Launcher
echo ==================================================

echo.
echo [1/4] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js (v18+) to run this project.
    pause
    exit /b 1
)
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Python is not installed. Please install Python 3 (v3.9+) to run this project.
    pause
    exit /b 1
)
echo Node.js found.
echo Python found.

echo.
echo [2/4] Setting up Python virtual environment...
cd ml
if not exist venv (
    echo Creating virtual environment 'venv'...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt
cd ..

echo.
echo [3/4] Installing Node dependencies...
echo Installing Server dependencies...
cd server
call npm install
cd ..

echo Installing Frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Starting all services...
echo Starting FastAPI on port 8000...
cd ml
start /B venv\Scripts\python -m uvicorn api.main:app --host 127.0.0.1 --port 8000 > ..\fastapi.log 2>&1
cd ..

echo Starting Express Server on port 3001...
cd server
start /B node index.js > ..\express.log 2>&1
cd ..

echo Starting Vite Dev Server on port 5173...
cd frontend
start /B npm run dev > ..\vite.log 2>&1
cd ..

echo.
echo ==================================================
echo              SERVICES STARTED IN BACKGROUND
echo ==================================================
echo Access the frontend dashboard: http://localhost:5173
echo FastAPI Backend API docs:      http://localhost:8000/docs
echo Express proxy/WS Gateway:      http://localhost:3001
echo Logs are written to fastapi.log, express.log, vite.log
echo.
echo Close this window or press Ctrl+C to stop services (processes might require task manager clean up if not terminated properly).
echo.
pause
