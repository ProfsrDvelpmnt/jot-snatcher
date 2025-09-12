@echo off
echo Installing dependencies and building JOT Snatcher...
echo.

echo Installing npm dependencies...
call npm install

echo.
echo Building the extension...
call npm run build

echo.
echo Build complete! The extension is ready in the 'dist' folder.
echo.
echo To install in Chrome:
echo 1. Open chrome://extensions/
echo 2. Enable Developer mode
echo 3. Click "Load unpacked" and select the 'dist' folder
echo.
pause
