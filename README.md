# JOT Snatcher Chrome Extension

A modern Chrome extension for job collection with full Supabase integration and subscription management.

## Version 1.0.0 - Working Release

This is a **stable, working version** with the following features:

### ✅ Core Features
- **Full Supabase Integration** - All subscription data pulled from database
- **Dynamic Subscription Tiers** - No hardcoded limits, all data from Supabase
- **Proper Authentication** - Direct Supabase auth with session management
- **Job Data Collection** - Extract job data from major job sites
- **Usage Tracking** - Real-time usage monitoring and limits
- **Modern UI** - React/TypeScript with Tailwind CSS
- **Theme Support** - Light/Dark mode switching

### 🔧 Technical Stack
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for building
- **Chrome Extension Manifest V3**
- **Supabase** for backend services

### 📁 Project Structure
```
src/
├── components/          # React components
├── services/           # Supabase and API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── content/            # Content scripts
```

### 🚀 Installation

1. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```

2. **Install in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### 📋 Key Fixes Applied

- ✅ **Subscription Tier Fix** - Correctly displays user's actual subscription tier
- ✅ **Database Integration** - Pulls all data from Supabase, no hardcoded values
- ✅ **Sign Out Fix** - Properly clears UI state and returns to login screen
- ✅ **Usage Counter Fix** - Displays correct usage limits and remaining jobs
- ✅ **Authentication Flow** - Seamless login/logout with proper state management

### 🔒 Version Control

This version is tagged as `v1.0.0` and represents a stable, working state. All extra files and test scripts have been moved to the `archive/` folder to keep the project clean.

### 📝 Archive

All development files, test scripts, and documentation have been moved to the `archive/` folder for reference but are not part of the core extension.

---

**Status**: ✅ Production Ready  
**Last Updated**: September 12, 2025  
**Version**: 1.0.0
