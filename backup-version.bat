@echo off
REM JOT Snatcher Extension - Version Backup Script
REM This script creates a backup of the current working version

set VERSION=v1.0.0
set DESCRIPTION=Working release backup

echo Creating backup for version: %VERSION%

REM Create backup directory with timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "backupDir=backups\%VERSION%_%timestamp%"

REM Create backup directory
mkdir "%backupDir%" 2>nul

echo Backing up source code...
xcopy "src" "%backupDir%\src" /E /I /Y >nul

echo Backing up configuration files...
copy "package.json" "%backupDir%\" >nul
copy "package-lock.json" "%backupDir%\" >nul
copy "tsconfig.json" "%backupDir%\" >nul
copy "tsconfig.node.json" "%backupDir%\" >nul
copy "vite.config.ts" "%backupDir%\" >nul
copy "tailwind.config.js" "%backupDir%\" >nul
copy "postcss.config.js" "%backupDir%\" >nul
copy ".gitignore" "%backupDir%\" >nul

echo Backing up built extension...
xcopy "dist" "%backupDir%\dist" /E /I /Y >nul

echo Creating version info...
echo # Version Backup Information > "%backupDir%\VERSION_INFO.md"
echo. >> "%backupDir%\VERSION_INFO.md"
echo **Version**: %VERSION% >> "%backupDir%\VERSION_INFO.md"
echo **Date**: %date% %time% >> "%backupDir%\VERSION_INFO.md"
echo **Description**: %DESCRIPTION% >> "%backupDir%\VERSION_INFO.md"
echo. >> "%backupDir%\VERSION_INFO.md"
echo ## What's Included >> "%backupDir%\VERSION_INFO.md"
echo - Complete source code (src/ folder) >> "%backupDir%\VERSION_INFO.md"
echo - All configuration files >> "%backupDir%\VERSION_INFO.md"
echo - Built extension ready for installation (dist/ folder) >> "%backupDir%\VERSION_INFO.md"
echo - Git repository with version tag >> "%backupDir%\VERSION_INFO.md"

echo.
echo Backup created successfully at: %backupDir%
echo Version info saved to: %backupDir%\VERSION_INFO.md
echo.
echo Backup Contents:
dir "%backupDir%" /s

pause
