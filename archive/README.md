# JOT Snatcher

A modern Chrome extension for job collection built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern UI**: Built with Tailwind CSS for a clean, responsive design
- 🌙 **Dark/Light Theme**: Automatic theme switching with persistent storage
- 📱 **Responsive Design**: Works on all screen sizes
- 🔧 **TypeScript**: Full type safety and better development experience
- ⚡ **Fast Performance**: Optimized with Vite bundling
- 🎯 **Floating Button**: Non-intrusive floating action button for job collection
- 📊 **Job Tracking**: Collect and manage job information efficiently

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Chrome Extension Manifest V3** - Extension platform

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Chrome Extension Setup

1. Build the project:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode"

4. Click "Load unpacked" and select the `dist` folder

5. The extension will be loaded and ready to use

## Project Structure

```
src/
├── components/          # React components
│   ├── Popup/          # Popup interface components
│   ├── FloatingButton/ # Floating action button
│   ├── Iframe/         # Iframe content
│   └── Options/        # Options page
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # Global styles
├── background/         # Chrome extension background script
├── content/            # Content scripts
├── popup/              # Popup entry point
├── iframe/             # Iframe entry point
└── options/            # Options page entry point
```

## Features

### Job Collection
- Extract job information from web pages
- Store job data with all relevant details
- Export job data in various formats

### Theme System
- Light and dark theme support
- Persistent theme selection
- Smooth transitions between themes

### Floating Button
- Non-intrusive floating action button
- Expandable interface
- Context-aware job collection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
