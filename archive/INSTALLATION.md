# JOT Snatcher - Installation Guide

## Quick Start

1. **Build the extension:**
   ```bash
   npm install
   npm run build
   ```

2. **Install in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project
   - The extension will be loaded and ready to use!

## What's Included

### ✅ Complete Migration from Original Project
- **Popup Interface**: Modern React/TypeScript popup with Tailwind CSS
- **Floating Button**: Non-intrusive floating action button for job collection
- **Iframe Content**: Iframe-based interface matching original design
- **Options Page**: Settings page with theme switching
- **Dark/Light Theme**: Full theme support with persistent storage

### ✅ Modern Tech Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for consistent, responsive styling
- **Vite** for fast development and optimized builds
- **Chrome Extension Manifest V3** for modern extension architecture

### ✅ Features Preserved
- All original functionality maintained
- Same visual design and user experience
- Job data collection and management
- Theme switching (light/dark)
- Floating button with expandable interface
- Status indicators and usage tracking

## File Structure

```
dist/                    # Built extension (ready to install)
├── manifest.json       # Chrome extension manifest
├── icons/              # Extension icons
├── popup.html          # Popup interface
├── iframe.html         # Iframe interface  
├── options.html        # Options page
├── background.js       # Background script
├── content-script.js   # Content script
└── assets/             # CSS and JS bundles

src/                    # Source code
├── components/         # React components
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Utility functions
├── styles/             # Global styles
└── background/         # Background script source
```

## Development

- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Type checking**: `npm run type-check`

## Original vs New

| Feature | Original | JOT Snatcher |
|---------|----------|--------------|
| UI Framework | Vanilla HTML/CSS | React + TypeScript |
| Styling | Custom CSS | Tailwind CSS |
| Theme System | CSS Variables | Tailwind Dark Mode |
| Build Tool | None | Vite |
| Type Safety | None | Full TypeScript |
| Component Architecture | Monolithic | Modular Components |
| Bundle Size | Large | Optimized |

## Troubleshooting

1. **Build fails**: Make sure all dependencies are installed with `npm install`
2. **Extension won't load**: Check that you selected the `dist` folder, not the root project folder
3. **Icons missing**: Ensure the `icons` folder is copied to the `dist` directory
4. **TypeScript errors**: Run `npm run type-check` to see detailed error messages

## Next Steps

The extension is now ready to use! You can:
- Install it in Chrome using the steps above
- Customize the styling by modifying Tailwind classes
- Add new features using React components
- Extend functionality with TypeScript types
