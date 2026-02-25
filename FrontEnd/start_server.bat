@echo off
echo Starting local web server...
echo ----------------------------------------------------
echo PLEASE NAVIGATE TO: http://localhost:8000
echo ----------------------------------------------------
echo IMPORTANT: Google Sign-In requires you to access the page 
echo using "http://localhost:8000" rather than "127.0.0.1" or "file://".
echo.
python -m http.server 8000
pause
