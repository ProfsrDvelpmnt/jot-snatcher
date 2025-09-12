# API Implementation Guide for JOT Snatcher

This guide shows you how to implement the required API endpoints for the JOT Snatcher Chrome extension.

## Required Endpoints

### 1. Health Check
**GET** `/api/health`

Simple health check endpoint to test API connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Connection Status
**GET** `/api/status`

Check connection status and get user's current usage data.

**Headers:**
- `X-User-ID`: User identifier
- `Authorization`: Bearer token (if using API key)

**Response:**
```json
{
  "connected": true,
  "jobData": null,
  "usageData": {
    "totalJobs": 15,
    "dailyLimit": 100,
    "remainingJobs": 85,
    "userId": "user_1234567890_abc123def"
  }
}
```

### 3. Submit Job Data
**POST** `/api/jobs`

Submit collected job data from the extension.

**Headers:**
- `X-User-ID`: User identifier
- `Authorization`: Bearer token (if using API key)
- `Content-Type`: application/json

**Request Body:**
```json
{
  "jobId": "JOB-1705312200000-abc123",
  "companyName": "Tech Corp",
  "jobLink": "https://indeed.com/viewjob?jk=abc123",
  "salary": "$80,000 - $120,000",
  "jobTitle": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "workType": "Full-time",
  "environment": "Remote",
  "ageOfPosting": "2 days ago",
  "numApplicants": "45",
  "organization": "Tech Corp",
  "position": "Senior Software Engineer",
  "dateSaved": "2024-01-15T10:30:00Z",
  "description": "<p>We are looking for a Senior Software Engineer...</p>",
  "userId": "user_1234567890_abc123def",
  "source": "indeed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "JOB-1705312200000-abc123",
  "message": "Job data saved successfully"
}
```

### 4. Get Usage Data
**GET** `/api/usage`

Get user's current usage statistics.

**Headers:**
- `X-User-ID`: User identifier
- `Authorization`: Bearer token (if using API key)

**Response:**
```json
{
  "totalJobs": 15,
  "dailyLimit": 100,
  "remainingJobs": 85,
  "userId": "user_1234567890_abc123def",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## Sample Implementation (Node.js/Express)

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// In-memory storage (replace with your database)
const users = new Map();
const jobs = new Map();

// Helper function to get or create user
function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, {
      totalJobs: 0,
      dailyLimit: 100,
      remainingJobs: 100,
      lastReset: new Date().toDateString()
    });
  }
  return users.get(userId);
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 2. Connection Status
app.get('/api/status', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const user = getUser(userId);
  
  // Reset daily count if it's a new day
  const today = new Date().toDateString();
  if (user.lastReset !== today) {
    user.remainingJobs = user.dailyLimit;
    user.lastReset = today;
  }

  res.json({
    connected: true,
    jobData: null,
    usageData: {
      totalJobs: user.totalJobs,
      dailyLimit: user.dailyLimit,
      remainingJobs: user.remainingJobs,
      userId: userId
    }
  });
});

// 3. Submit Job Data
app.post('/api/jobs', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const user = getUser(userId);
  
  // Check daily limit
  if (user.remainingJobs <= 0) {
    return res.status(429).json({ 
      error: 'Daily job limit exceeded',
      remainingJobs: 0
    });
  }

  const jobData = req.body;
  const jobId = jobData.jobId || `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store job data
  jobs.set(jobId, {
    ...jobData,
    jobId,
    userId,
    submittedAt: new Date().toISOString()
  });

  // Update user stats
  user.totalJobs += 1;
  user.remainingJobs -= 1;

  res.json({
    success: true,
    jobId: jobId,
    message: 'Job data saved successfully',
    usageData: {
      totalJobs: user.totalJobs,
      dailyLimit: user.dailyLimit,
      remainingJobs: user.remainingJobs
    }
  });
});

// 4. Get Usage Data
app.get('/api/usage', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const user = getUser(userId);
  
  res.json({
    totalJobs: user.totalJobs,
    dailyLimit: user.dailyLimit,
    remainingJobs: user.remainingJobs,
    userId: userId,
    lastUpdated: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

## Database Schema (SQL)

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  total_jobs INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 100,
  remaining_jobs INTEGER DEFAULT 100,
  last_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jobs table
CREATE TABLE jobs (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  job_link TEXT NOT NULL,
  salary VARCHAR(100),
  job_title VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  work_type VARCHAR(50),
  environment VARCHAR(50),
  age_of_posting VARCHAR(50),
  num_applicants VARCHAR(50),
  organization VARCHAR(255),
  position VARCHAR(255),
  description TEXT,
  source VARCHAR(50),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_submitted_at ON jobs(submitted_at);
```

## Testing the API

1. **Start your API server**
2. **Configure the extension** with your API URL
3. **Test connection** using the "Test Connection" button
4. **Try collecting job data** on a job site

## Security Considerations

1. **Rate Limiting** - Implement rate limiting to prevent abuse
2. **Input Validation** - Validate all incoming data
3. **Authentication** - Use proper API key or OAuth authentication
4. **CORS** - Configure CORS for your domain
5. **Data Sanitization** - Sanitize job descriptions and other user input

## Environment Variables

```bash
# .env file
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/jot_snatcher
API_KEY_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com
```

This implementation provides a complete foundation for the JOT Snatcher extension's API integration!
