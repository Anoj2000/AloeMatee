@echo off
cd /d "%~dp0"
echo Starting AloeVeraMate Backend Server...
echo Server will be available at http://0.0.0.0:8000
echo Press Ctrl+C to stop the server
echo.
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
