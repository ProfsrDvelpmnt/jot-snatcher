# Webapp API Implementation Guide for JOT Snatcher Extension

This guide shows you how to implement the required API endpoints in your webapp to work with the JOT Snatcher Chrome extension.

## Required Endpoints

The extension expects these **extension-specific** endpoints in your webapp:

### 1. Health Check
**GET** `/api/ext-health`

Simple health check endpoint to test API connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Connection Status
**GET** `/api/ext-status`

Check connection status and get user's current usage data.

**Headers:**
- `X-User-ID`: User identifier (automatically sent by extension)
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
**POST** `/api/ext-jobs`

Submit collected job data from the extension.

**Headers:**
- `X-User-ID`: User identifier (automatically sent by extension)
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
**GET** `/api/ext-usage`

Get user's current usage statistics.

**Headers:**
- `X-User-ID`: User identifier (automatically sent by extension)
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
app.get('/api/ext-health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// 2. Connection Status
app.get('/api/ext-status', (req, res) => {
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
app.post('/api/ext-jobs', (req, res) => {
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
app.get('/api/ext-usage', (req, res) => {
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});
```

## Supabase Implementation

If you're using Supabase, here's how to implement the endpoints:

### Database Schema

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

### Supabase Edge Functions

Create these edge functions in your Supabase project:

#### `/api/ext-health`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString()
    }),
    { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    }
  )
})
```

#### `/api/ext-status`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get or create user
    let { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create them
      const { data: newUser, error: createError } = await supabaseClient
        .from('users')
        .insert({
          id: userId,
          total_jobs: 0,
          daily_limit: 100,
          remaining_jobs: 100,
          last_reset: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (createError) throw createError
      user = newUser
    } else if (error) {
      throw error
    }

    // Reset daily count if it's a new day
    const today = new Date().toISOString().split('T')[0]
    if (user.last_reset !== today) {
      const { error: updateError } = await supabaseClient
        .from('users')
        .update({
          remaining_jobs: user.daily_limit,
          last_reset: today
        })
        .eq('id', userId)

      if (updateError) throw updateError
      user.remaining_jobs = user.daily_limit
    }

    return new Response(
      JSON.stringify({
        connected: true,
        jobData: null,
        usageData: {
          totalJobs: user.total_jobs,
          dailyLimit: user.daily_limit,
          remainingJobs: user.remaining_jobs,
          userId: userId
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
```

#### `/api/ext-jobs`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const jobData = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Check user's daily limit
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    if (user.remaining_jobs <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily job limit exceeded',
          remainingJobs: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      )
    }

    // Insert job data
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        id: jobData.jobId || `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        company_name: jobData.companyName,
        job_link: jobData.jobLink,
        salary: jobData.salary,
        job_title: jobData.jobTitle,
        location: jobData.location,
        work_type: jobData.workType,
        environment: jobData.environment,
        age_of_posting: jobData.ageOfPosting,
        num_applicants: jobData.numApplicants,
        organization: jobData.organization,
        position: jobData.position,
        description: jobData.description,
        source: jobData.source,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) throw jobError

    // Update user stats
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        total_jobs: user.total_jobs + 1,
        remaining_jobs: user.remaining_jobs - 1
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        message: 'Job data saved successfully'
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
```

#### `/api/ext-usage`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { data: user, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({
        totalJobs: user.total_jobs,
        dailyLimit: user.daily_limit,
        remainingJobs: user.remaining_jobs,
        userId: userId,
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})
```

## CORS Configuration

Make sure your webapp allows CORS requests from the extension. The extension will make requests from `chrome-extension://` origins.

### Express.js CORS
```javascript
const cors = require('cors');

app.use(cors({
  origin: true, // Allow all origins for development
  credentials: true
}));
```

### Supabase CORS
The edge functions above include CORS headers. Make sure your Supabase project allows the extension origins.

## Testing the API

1. **Start your webapp** on `http://127.0.0.1:8080` (or your configured port)
2. **Configure the extension** with your API URL in the options page
3. **Enable debug mode** to see API monitoring
4. **Test the connection** using the extension's test feature
5. **Try collecting job data** on a job site

## Security Considerations

1. **Rate Limiting** - Implement rate limiting to prevent abuse
2. **Input Validation** - Validate all incoming data
3. **Authentication** - Use proper API key or OAuth authentication
4. **CORS** - Configure CORS for your domain
5. **Data Sanitization** - Sanitize job descriptions and other user input

## Environment Variables

```bash
# .env file
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/jot_snatcher
API_KEY_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com
```

This implementation provides a complete foundation for the JOT Snatcher extension's API integration! The extension will automatically send the correct headers and handle the responses.
