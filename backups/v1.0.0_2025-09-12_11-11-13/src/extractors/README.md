# Job Extraction System

This folder contains the job extraction system for the JOT Snatcher Chrome extension.

## Structure

```
src/
├── extractors/
│   ├── index.ts              # Main extraction coordinator
│   └── README.md            # This file
├── sites/
│   ├── index.ts             # Site-specific exports
│   ├── linkedin.ts          # LinkedIn-specific extraction
│   ├── indeed.ts            # Indeed-specific extraction
│   └── ...                  # Other site-specific files
├── utils/
│   ├── siteDetector.ts      # Site detection and configuration
│   └── jobExtractor.ts      # Core extraction engine
└── config/
    └── sites.json           # Site configuration file
```

## How It Works

1. **Site Detection**: The system automatically detects which job site you're on
2. **Selector Matching**: Uses site-specific CSS selectors to find job data
3. **Data Extraction**: Extracts job information using the appropriate selectors
4. **Fallback Handling**: Falls back to mock data if extraction fails

## Adding New Sites

To add support for a new job site:

1. Add the site configuration to `src/config/sites.json`
2. Create a site-specific extractor in `src/sites/[sitename].ts`
3. Export the configuration in `src/sites/index.ts`
4. Update the site detector in `src/utils/siteDetector.ts`

## Site Configuration

Each site configuration includes:
- `name`: Display name for the site
- `domain`: Domain to match against
- `enabled`: Whether extraction is enabled for this site
- `selectors`: CSS selectors for different job data fields

## Supported Sites

- LinkedIn Jobs
- Indeed
- Glassdoor
- ZipRecruiter
- Monster

## Usage

```typescript
import { extractionManager } from '@/extractors';

// Extract job data from current page
const jobData = extractionManager.extractCurrentJob();

// Check if current site is supported
const isSupported = extractionManager.isSiteSupported();

// Get current site name
const siteName = extractionManager.getCurrentSite();
```
