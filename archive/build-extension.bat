@echo off
echo Building JOT Snatcher Chrome Extension...
echo.

echo Running TypeScript compilation...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo TypeScript compilation failed!
    pause
    exit /b 1
)

echo Running Vite build...
npm run build
if %errorlevel% neq 0 (
    echo Vite build failed!
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo Extension files are in the 'dist' folder
echo.
echo To load the extension in Chrome:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable "Developer mode"
echo 3. Click "Load unpacked"
echo 4. Select the 'dist' folder
echo.
pause
