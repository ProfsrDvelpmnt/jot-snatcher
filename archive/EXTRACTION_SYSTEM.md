# Job Extraction System Architecture

## Overview
The JOT Snatcher extension now includes a sophisticated job extraction system that can identify different job sites and use tailored selectors for each one.

## New Folder Structure

```
src/
├── extractors/
│   ├── index.ts              # Main extraction coordinator
│   └── README.md            # Documentation
├── sites/
│   ├── index.ts             # Site-specific exports
│   ├── linkedin.ts          # LinkedIn-specific extraction
│   ├── indeed.ts            # Indeed-specific extraction
│   └── ...                  # Other site-specific files
├── utils/
│   ├── siteDetector.ts      # Site detection and configuration
│   └── jobExtractor.ts      # Core extraction engine
├── config/
│   └── sites.json           # Site configuration file
└── content/
    └── content-script.ts    # Updated to use extraction system
```

## How It Works

### 1. Site Detection
- Automatically detects which job site you're on
- Uses domain matching against configured sites
- Returns appropriate site configuration

### 2. Selector-Based Extraction
- Each site has its own CSS selectors
- Handles different HTML structures per site
- Fallback mechanisms for missing data

### 3. Real Data Extraction
- Extracts actual job data from web pages
- No more mock data (unless extraction fails)
- Site-specific extraction logic

## Supported Sites

| Site | Status | Selectors |
|------|--------|-----------|
| LinkedIn Jobs | ✅ | Complete |
| Indeed | ✅ | Complete |
| Glassdoor | ✅ | Complete |
| ZipRecruiter | ✅ | Complete |
| Monster | ✅ | Complete |

## Key Features

### Site-Specific Selectors
Each site has tailored CSS selectors for:
- Job title
- Company name
- Location
- Salary information
- Job description
- Posted date
- Work type
- Apply link

### Smart Extraction
- Handles different HTML structures
- Fallback selectors for robustness
- Data cleaning and validation
- Error handling with graceful degradation

### Easy Configuration
- JSON-based site configuration
- Easy to add new sites
- Enable/disable sites per configuration
- Centralized selector management

## Usage Examples

### Basic Extraction
```typescript
import { extractionManager } from '@/extractors';

// Extract job data from current page
const jobData = extractionManager.extractCurrentJob();

// Check if current site is supported
const isSupported = extractionManager.isSiteSupported();

// Get current site name
const siteName = extractionManager.getCurrentSite();
```

### Adding New Sites
1. Add configuration to `src/config/sites.json`
2. Create site-specific extractor in `src/sites/[sitename].ts`
3. Export in `src/sites/index.ts`
4. Update site detector

## Benefits

✅ **Real Data Extraction** - No more mock data  
✅ **Site-Specific Logic** - Tailored for each job site  
✅ **Organized Code** - Clean, maintainable structure  
✅ **Easy to Extend** - Simple to add new sites  
✅ **Robust Fallbacks** - Handles extraction failures gracefully  
✅ **Type Safety** - Full TypeScript support  

## Testing

The system is ready for testing on:
- LinkedIn Jobs
- Indeed
- Glassdoor
- ZipRecruiter
- Monster

Each site will use its specific selectors to extract real job data from the page.
