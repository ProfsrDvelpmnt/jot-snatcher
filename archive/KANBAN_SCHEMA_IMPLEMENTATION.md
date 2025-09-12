# Kanban Board Schema Implementation

This document describes the implementation of the exact schema the JOT Snatcher extension uses to send job data to the kanban board webapp.

## 📋 Schema Overview

The extension now implements the exact schema the webapp expects for job data submission, ensuring seamless integration between the extension and the kanban board.

### Required Fields (Minimum for Basic Functionality)
- `organization`: Company name (string, required)
- `position`: Job title (string, required)

### Optional Basic Fields
- `salary`: Salary text (string, optional)
- `location`: Job location (string, optional)
- `type`: Employment type (string, optional) - "Full Time", "Part Time", "Contract", etc.
- `environment`: Work environment (string, optional) - "Remote", "Hybrid", "On-site"

### Enhanced Fields (New Features)
- `salary_type`: Type of salary (string, optional) - "annual", "hourly", "monthly", "contract"
- `salary_min`: Minimum salary as integer (number, optional)
- `salary_max`: Maximum salary as integer (number, optional)
- `source`: Job source (string, optional) - "indeed", "linkedin", "glassdoor", etc.
- `job_site`: Job site display name (string, optional) - "Indeed", "LinkedIn", "Glassdoor", etc.

## 🚀 Implementation Files

### 1. Core Schema (`src/utils/kanbanSchema.ts`)
Contains the main implementation with:
- `KanbanJobData` interface
- `KanbanApiResponse` interface
- Helper functions for parsing and conversion
- API submission functions
- Validation functions

### 2. Updated API Service (`src/services/api.ts`)
Modified to use the kanban schema format when submitting jobs.

### 3. Enhanced Job Extractor (`src/utils/jobExtractor.ts`)
Added methods to extract and convert job data to kanban format.

### 4. Examples (`src/examples/kanbanIntegrationExample.ts`)
Comprehensive examples showing how to use the kanban schema.

## 🔧 Usage Examples

### Basic Job Submission
```typescript
import { submitExtensionJobToKanban } from '../utils/kanbanSchema';

const jobData = {
  organization: 'Tech Corp',
  position: 'Senior Software Engineer',
  salary: '$120,000 - $150,000',
  location: 'San Francisco, CA',
  type: 'Full Time',
  environment: 'Hybrid'
};

const result = await submitExtensionJobToKanban(
  jobData, 
  'http://localhost:8080/api', 
  userId
);
```

### Manual Kanban Data Creation
```typescript
import { convertToKanbanFormat, validateKanbanJobData } from '../utils/kanbanSchema';

const extensionJobData = extractJobData(); // Your existing extraction
const kanbanData = convertToKanbanFormat(extensionJobData);

// Validate before submission
const validation = validateKanbanJobData(kanbanData);
if (validation.isValid) {
  // Submit to kanban board
  const result = await submitJobToKanban(kanbanData, apiUrl, userId);
}
```

## 📊 API Endpoint

The extension sends data to:
```
POST http://localhost:8080/api/ext-jobs
```

### Headers
```javascript
{
  "Content-Type": "application/json",
  "X-User-Id": "user-id-here"
}
```

### Request Body Example
```javascript
{
  "organization": "Tech Corp",
  "position": "Senior Software Engineer",
  "salary": "$120,000 - $150,000",
  "salary_type": "annual",
  "salary_min": 120000,
  "salary_max": 150000,
  "source": "indeed",
  "job_site": "Indeed",
  "location": "San Francisco, CA",
  "type": "Full Time",
  "environment": "Hybrid"
}
```

### Response Example
```javascript
{
  "success": true,
  "job": {
    "id": "uuid-here",
    "user_id": "user-id-here",
    "organization": "Tech Corp",
    "position": "Senior Software Engineer",
    "salary": "$120,000 - $150,000",
    "salary_type": "annual",
    "salary_min": 120000,
    "salary_max": 150000,
    "source": "indeed",
    "job_site": "Indeed",
    "location": "San Francisco, CA",
    "type": "Full Time",
    "environment": "Hybrid",
    "stage": "Saved",
    "date_saved": "2025-01-10T20:51:01.820189+00:00",
    "created_at": "2025-01-10T20:51:01.820189+00:00",
    "updated_at": "2025-01-10T20:51:01.820189+00:00"
  },
  "message": "Job data saved successfully",
  "usageInfo": {
    "currentMonth": 15,
    "monthlyLimit": 150,
    "remainingUses": 135
  },
  "authMethod": "header"
}
```

## 🛠️ Helper Functions

### Salary Parsing
- `parseSalaryType(salaryText)`: Detects if salary is annual, hourly, monthly, or contract
- `parseSalaryMin(salaryText)`: Extracts minimum salary as integer
- `parseSalaryMax(salaryText)`: Extracts maximum salary as integer

### Job Source Detection
- `detectJobSource(url)`: Detects job source from URL (indeed, linkedin, etc.)
- `getJobSiteName(source)`: Gets display name for job site

### Data Conversion
- `convertToKanbanFormat(jobData)`: Converts extension job data to kanban format
- `validateKanbanJobData(jobData)`: Validates kanban job data before submission

## 🔄 Integration Workflow

1. **Extract Job Data**: Use existing job extractors to get job information
2. **Convert Format**: Use `convertToKanbanFormat()` to convert to kanban schema
3. **Validate Data**: Use `validateKanbanJobData()` to ensure data is valid
4. **Submit to API**: Use `submitJobToKanban()` to send data to webapp
5. **Handle Response**: Process the API response and update UI accordingly

## 🧪 Testing

The implementation includes comprehensive examples in `src/examples/kanbanIntegrationExample.ts`:
- Basic job submission
- Manual job creation
- Batch job submission
- Error handling and retry logic
- React component integration
- Schema testing with different data types

## 🔧 Configuration

The API base URL can be configured in the API service:
```typescript
const apiService = new ApiService({
  baseUrl: 'http://localhost:8080/api', // Your webapp API URL
  timeout: 10000,
  debugMode: false
});
```

## 📝 Notes

- The schema is backward compatible with existing extension functionality
- All optional fields default to `null` if not provided
- The extension automatically detects job source and site from URLs
- Salary parsing handles various formats (ranges, hourly, annual, etc.)
- Validation ensures data integrity before submission
- Error handling includes retry logic and user feedback

## 🚀 Next Steps

1. Test the implementation with your webapp
2. Update any UI components to use the new schema
3. Add any additional validation rules as needed
4. Monitor API responses for any schema adjustments
5. Consider adding more job sites to the detection logic

This implementation ensures your extension sends job data in the exact format your kanban board webapp expects! 🎯
