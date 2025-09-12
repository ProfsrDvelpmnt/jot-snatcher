# JOT Snatcher Extension - Version Backup Script
# This script creates a backup of the current working version

param(
    [string]$Version = "v1.0.0",
    [string]$Description = "Working release backup"
)

Write-Host "Creating backup for version: $Version" -ForegroundColor Green

# Create backup directory with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backups\${Version}_${timestamp}"

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Copy essential files to backup
Write-Host "Backing up source code..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$backupDir\src" -Recurse -Force

Write-Host "Backing up configuration files..." -ForegroundColor Yellow
Copy-Item -Path "package.json" -Destination "$backupDir\" -Force
Copy-Item -Path "package-lock.json" -Destination "$backupDir\" -Force
Copy-Item -Path "tsconfig.json" -Destination "$backupDir\" -Force
Copy-Item -Path "tsconfig.node.json" -Destination "$backupDir\" -Force
Copy-Item -Path "vite.config.ts" -Destination "$backupDir\" -Force
Copy-Item -Path "tailwind.config.js" -Destination "$backupDir\" -Force
Copy-Item -Path "postcss.config.js" -Destination "$backupDir\" -Force
Copy-Item -Path ".gitignore" -Destination "$backupDir\" -Force

Write-Host "Backing up built extension..." -ForegroundColor Yellow
Copy-Item -Path "dist" -Destination "$backupDir\dist" -Recurse -Force

Write-Host "Creating version info..." -ForegroundColor Yellow
$versionInfo = @"
# Version Backup Information

**Version**: $Version
**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Description**: $Description

## What's Included
- Complete source code (`src/` folder)
- All configuration files
- Built extension ready for installation (`dist/` folder)
- Git repository with version tag

## Installation
1. Navigate to the backup folder
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Load the `dist/` folder in Chrome as an unpacked extension

## Git Commands
```bash
# Restore this version
git checkout $Version

# Create new branch from this version
git checkout -b new-feature-branch $Version
```

---
**Backup Created**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$versionInfo | Out-File -FilePath "$backupDir\VERSION_INFO.md" -Encoding UTF8

Write-Host "Backup created successfully at: $backupDir" -ForegroundColor Green
Write-Host "Version info saved to: $backupDir\VERSION_INFO.md" -ForegroundColor Green

# Show backup contents
Write-Host "`nBackup Contents:" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -Recurse | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
