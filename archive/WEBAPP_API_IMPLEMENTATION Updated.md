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
  "organization": "Tech Corp",
  "position": "Senior Software Engineer",
  "link": "https://indeed.com/viewjob?jk=abc123",
  "salary": "$80,000 - $120,000",
  "salary_type": "annual",
  "salary_min": 80000,
  "salary_max": 120000,
  "location": "San Francisco, CA",
  "type": "Full Time",
  "environment": "Remote",
  "stage": "Saved",
  "source": "indeed",
  "job_site": "Indeed",
  "date_saved": "2024-01-15T10:30:00Z",
  "date_posted": "2024-01-13T10:30:00Z",
  "job_posting_url": "https://indeed.com/viewjob?jk=abc123",
  "resume_url": null,
  "contact_message_url": null,
  "interview_status": null,
  "date_applying": null,
  "date_applied": null,
  "date_contacted": null,
  "date_interviewing": null,
  "date_offer": null,
  "date_negotiating": null,
  "date_hired": null,
  "date_archived": null
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user_1234567890_abc123def",
    "organization": "Tech Corp",
    "position": "Senior Software Engineer",
    "link": "https://indeed.com/viewjob?jk=abc123",
    "salary": "$80,000 - $120,000",
    "salary_type": "annual",
    "salary_min": 80000,
    "salary_max": 120000,
    "location": "San Francisco, CA",
    "type": "Full Time",
    "environment": "Remote",
    "stage": "Saved",
    "source": "indeed",
    "job_site": "Indeed",
    "date_saved": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "message": "Job data saved successfully",
  "usageInfo": {
    "currentMonth": 5,
    "monthlyLimit": 100,
    "remainingUses": 95
  }
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
  "currentMonth": 5,
  "monthlyLimit": 100,
  "remainingUses": 95,
  "userId": "user_1234567890_abc123def",
  "tier": "professional",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## Data Schema Mapping

### Extension Data → Webapp Schema

The extension should send data in this format to match the webapp's job schema:

```javascript
// Extension sends:
{
  "organization": "Tech Corp",           // → jobs.organization
  "position": "Senior Software Engineer", // → jobs.position
  "link": "https://indeed.com/viewjob",  // → jobs.link
  "salary": "$80,000 - $120,000",        // → jobs.salary
  "salary_type": "annual",               // → jobs.salary_type
  "salary_min": 80000,                   // → jobs.salary_min
  "salary_max": 120000,                  // → jobs.salary_max
  "location": "San Francisco, CA",       // → jobs.location
  "type": "Full Time",                   // → jobs.type
  "environment": "Remote",               // → jobs.environment
  "stage": "Saved",                      // → jobs.stage (default: "Saved")
  "source": "indeed",                    // → jobs.source
  "job_site": "Indeed",                  // → jobs.job_site
  "date_saved": "2024-01-15T10:30:00Z", // → jobs.date_saved
  "date_posted": "2024-01-13T10:30:00Z" // → jobs.date_posted
}

// Webapp stores in jobs table:
{
  "id": "uuid-generated",
  "user_id": "user-uuid",
  "organization": "Tech Corp",
  "position": "Senior Software Engineer",
  "link": "https://indeed.com/viewjob",
  "salary": "$80,000 - $120,000",
  "salary_type": "annual",
  "salary_min": 80000,
  "salary_max": 120000,
  "location": "San Francisco, CA",
  "type": "Full Time",
  "environment": "Remote",
  "stage": "Saved",
  "source": "indeed",
  "job_site": "Indeed",
  "date_saved": "2024-01-15T10:30:00Z",
  "date_posted": "2024-01-13T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Salary Format Support

The webapp supports multiple salary formats:

```javascript
// Annual Salary
{
  "salary": "$80,000 - $120,000",
  "salary_type": "annual",
  "salary_min": 80000,
  "salary_max": 120000
}

// Hourly Salary
{
  "salary": "$45 - $65 per hour",
  "salary_type": "hourly", 
  "salary_min": 45,
  "salary_max": 65
}

// Monthly Salary
{
  "salary": "$6,000 - $8,000 per month",
  "salary_type": "monthly",
  "salary_min": 6000,
  "salary_max": 8000
}

// Contract/Project-based
{
  "salary": "$5,000 - $10,000 per project",
  "salary_type": "contract",
  "salary_min": 5000,
  "salary_max": 10000
}
```

### Job Site Sources

The webapp tracks where jobs were collected from:

```javascript
// Common job site sources
"source": "indeed"           // → "Indeed"
"source": "linkedin"         // → "LinkedIn" 
"source": "glassdoor"        // → "Glassdoor"
"source": "ziprecruiter"     // → "ZipRecruiter"
"source": "company_website"  // → "Company Website"
"source": "monster"          // → "Monster"
"source": "careerbuilder"    // → "CareerBuilder"
"source": "dice"             // → "Dice"
"source": "angel_list"       // → "AngelList"
"source": "remote_ok"        // → "Remote OK"
"source": "weworkremotely"   // → "We Work Remotely"
"source": "other"            // → "Other"
```

### Usage Tracking

The webapp tracks extension usage in the `extension_job_submissions` table:

```javascript
// Usage record created for each job submission:
{
  "id": "uuid-generated",
  "user_id": "user-uuid",
  "job_id": "job-uuid",
  "organization": "Tech Corp",
  "position": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "salary": "$80,000 - $120,000",
  "job_type": "Full Time",
  "environment": "Remote",
  "job_url": "https://indeed.com/viewjob",
  "device_info": { "userAgent": "...", "platform": "..." },
  "browser_info": { "browser": "Chrome", "version": "..." },
  "extension_version": "1.0.0",
  "submission_source": "chrome_extension",
  "usage_month": "2024-01",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## Sample Implementation (Node.js/Express)

```javascript
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// In-memory storage (replace with your database)
const jobs = new Map();
const extensionUsage = new Map();

// Helper function to get user usage
function getUserUsage(userId, month) {
  const key = `${userId}-${month}`;
  if (!extensionUsage.has(key)) {
    extensionUsage.set(key, []);
  }
  return extensionUsage.get(key);
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

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const userUsage = getUserUsage(userId, currentMonth);
  
  // Tier-based limits (in real implementation, get from user profile)
  const monthlyLimit = 100; // Default limit
  const currentUsage = userUsage.length;
  const remainingUses = Math.max(0, monthlyLimit - currentUsage);

  res.json({
    connected: true,
    jobData: null,
    usageData: {
      currentMonth: currentUsage,
      monthlyLimit: monthlyLimit,
      remainingUses: remainingUses,
      userId: userId,
      tier: 'professional'
    }
  });
});

// 3. Submit Job Data
app.post('/api/ext-jobs', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const userUsage = getUserUsage(userId, currentMonth);
  
  // Check monthly limit
  const monthlyLimit = 100; // Default limit
  if (userUsage.length >= monthlyLimit) {
    return res.status(429).json({ 
      error: 'Monthly job limit exceeded',
      currentMonth: userUsage.length,
      monthlyLimit: monthlyLimit,
      remainingUses: 0
    });
  }

  const jobData = req.body;
  const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store job data (matching webapp schema)
  const job = {
    id: jobId,
    user_id: userId,
    organization: jobData.organization,
    position: jobData.position,
    link: jobData.link,
    salary: jobData.salary,
    salary_type: jobData.salary_type,
    salary_min: jobData.salary_min,
    salary_max: jobData.salary_max,
    location: jobData.location,
    type: jobData.type,
    environment: jobData.environment,
    stage: jobData.stage || 'Saved',
    source: jobData.source,
    job_site: jobData.job_site,
    date_saved: jobData.date_saved || new Date().toISOString(),
    date_posted: jobData.date_posted,
    job_posting_url: jobData.job_posting_url,
    resume_url: jobData.resume_url,
    contact_message_url: jobData.contact_message_url,
    interview_status: jobData.interview_status,
    date_applying: jobData.date_applying,
    date_applied: jobData.date_applied,
    date_contacted: jobData.date_contacted,
    date_interviewing: jobData.date_interviewing,
    date_offer: jobData.date_offer,
    date_negotiating: jobData.date_negotiating,
    date_hired: jobData.date_hired,
    date_archived: jobData.date_archived,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  jobs.set(jobId, job);

  // Record extension usage
  const usageRecord = {
    id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    job_id: jobId,
    organization: jobData.organization,
    position: jobData.position,
    location: jobData.location,
    salary: jobData.salary,
    job_type: jobData.type,
    environment: jobData.environment,
    job_url: jobData.link,
    device_info: { userAgent: 'Chrome Extension', platform: 'browser' },
    browser_info: { browser: 'Chrome', version: 'Extension' },
    extension_version: '1.0.0',
    submission_source: 'chrome_extension',
    usage_month: currentMonth,
    created_at: new Date().toISOString()
  };
  
  userUsage.push(usageRecord);

  res.json({
    success: true,
    job: job,
    message: 'Job data saved successfully',
    usageInfo: {
      currentMonth: userUsage.length,
      monthlyLimit: monthlyLimit,
      remainingUses: monthlyLimit - userUsage.length
    }
  });
});

// 4. Get Usage Data
app.get('/api/ext-usage', (req, res) => {
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const userUsage = getUserUsage(userId, currentMonth);
  
  const monthlyLimit = 100; // Default limit
  const currentUsage = userUsage.length;
  const remainingUses = Math.max(0, monthlyLimit - currentUsage);

  res.json({
    currentMonth: currentUsage,
    monthlyLimit: monthlyLimit,
    remainingUses: remainingUses,
    userId: userId,
    tier: 'professional',
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
-- Jobs table (actual Supabase schema)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  link TEXT,
  salary VARCHAR(255),
  salary_type VARCHAR(20), -- 'annual', 'hourly', 'monthly', 'contract'
  salary_min INTEGER, -- Minimum salary in base currency units
  salary_max INTEGER, -- Maximum salary in base currency units
  location VARCHAR(255),
  type VARCHAR(255), -- 'Full Time', 'Part Time', 'Contract', 'Seasonal'
  environment VARCHAR(255), -- 'Remote', 'Hybrid', 'In-Person'
  stage VARCHAR(255), -- 'Saved', 'Applying', 'Applied', 'Contacted', 'Interviewing', 'Offer'
  source VARCHAR(50), -- 'indeed', 'linkedin', 'glassdoor', 'ziprecruiter', 'company_website'
  job_site VARCHAR(100), -- 'Indeed', 'LinkedIn', 'Glassdoor', 'ZipRecruiter', 'Company Website'
  interview_status VARCHAR(255),
  date_saved TIMESTAMP WITH TIME ZONE,
  date_posted TIMESTAMP WITH TIME ZONE,
  date_applying TIMESTAMP WITH TIME ZONE,
  date_applied TIMESTAMP WITH TIME ZONE,
  date_contacted TIMESTAMP WITH TIME ZONE,
  date_interviewing TIMESTAMP WITH TIME ZONE,
  date_offer TIMESTAMP WITH TIME ZONE,
  date_negotiating TIMESTAMP WITH TIME ZONE,
  date_hired TIMESTAMP WITH TIME ZONE,
  date_archived TIMESTAMP WITH TIME ZONE,
  resume_url TEXT,
  job_posting_url TEXT,
  contact_message_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extension job submissions table (for usage tracking)
CREATE TABLE extension_job_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  organization VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  salary VARCHAR(255),
  job_type VARCHAR(255),
  environment VARCHAR(255),
  job_url TEXT,
  device_info JSONB,
  browser_info JSONB,
  ip_address VARCHAR(45),
  extension_version VARCHAR(50),
  submission_source VARCHAR(50),
  usage_month VARCHAR(7), -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_extension_job_submissions_user_id ON extension_job_submissions(user_id);
CREATE INDEX idx_extension_job_submissions_usage_month ON extension_job_submissions(usage_month);
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

    // Get user's current usage from extension_job_submissions
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data: usageData, error: usageError } = await supabaseClient
      .from('extension_job_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('usage_month', currentMonth)

    if (usageError) throw usageError

    // Determine user tier and limits (based on email or user metadata)
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Set tier-based limits
    const tierLimits = {
      'free': 5,
      'basic': 20,
      'professional': 150,
      'executive': 400
    }
    
    const userTier = userProfile?.subscription_tier || 'free'
    const monthlyLimit = tierLimits[userTier] || 5
    const currentUsage = usageData?.length || 0
    const remainingUses = Math.max(0, monthlyLimit - currentUsage)

    return new Response(
      JSON.stringify({
        connected: true,
        jobData: null,
        usageData: {
          currentMonth: currentUsage,
          monthlyLimit: monthlyLimit,
          remainingUses: remainingUses,
          userId: userId,
          tier: userTier
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

    // Check user's monthly limit
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data: usageData, error: usageError } = await supabaseClient
      .from('extension_job_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('usage_month', currentMonth)

    if (usageError) throw usageError

    // Get user tier and limits
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const tierLimits = {
      'free': 5,
      'basic': 20,
      'professional': 150,
      'executive': 400
    }
    
    const userTier = userProfile?.subscription_tier || 'free'
    const monthlyLimit = tierLimits[userTier] || 5
    const currentUsage = usageData?.length || 0

    if (currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly job limit exceeded',
          currentMonth: currentUsage,
          monthlyLimit: monthlyLimit,
          remainingUses: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      )
    }

    // Insert job data
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: userId,
        organization: jobData.organization,
        position: jobData.position,
        link: jobData.link,
        salary: jobData.salary,
        salary_type: jobData.salary_type,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        location: jobData.location,
        type: jobData.type,
        environment: jobData.environment,
        stage: jobData.stage || 'Saved',
        source: jobData.source,
        job_site: jobData.job_site,
        date_saved: jobData.date_saved || new Date().toISOString(),
        date_posted: jobData.date_posted,
        job_posting_url: jobData.job_posting_url,
        resume_url: jobData.resume_url,
        contact_message_url: jobData.contact_message_url,
        interview_status: jobData.interview_status,
        date_applying: jobData.date_applying,
        date_applied: jobData.date_applied,
        date_contacted: jobData.date_contacted,
        date_interviewing: jobData.date_interviewing,
        date_offer: jobData.date_offer,
        date_negotiating: jobData.date_negotiating,
        date_hired: jobData.date_hired,
        date_archived: jobData.date_archived
      })
      .select()
      .single()

    if (jobError) throw jobError

    // Record extension usage
    const { error: usageRecordError } = await supabaseClient
      .from('extension_job_submissions')
      .insert({
        user_id: userId,
        job_id: job.id,
        organization: jobData.organization,
        position: jobData.position,
        location: jobData.location,
        salary: jobData.salary,
        job_type: jobData.type,
        environment: jobData.environment,
        job_url: jobData.link,
        device_info: {
          userAgent: 'Chrome Extension',
          platform: 'browser',
          timestamp: new Date().toISOString()
        },
        browser_info: {
          browser: 'Chrome',
          version: 'Extension',
          timestamp: new Date().toISOString()
        },
        extension_version: '1.0.0',
        submission_source: 'chrome_extension',
        usage_month: currentMonth
      })

    if (usageRecordError) throw usageRecordError

    return new Response(
      JSON.stringify({
        success: true,
        job: job,
        message: 'Job data saved successfully',
        usageInfo: {
          currentMonth: currentUsage + 1,
          monthlyLimit: monthlyLimit,
          remainingUses: monthlyLimit - (currentUsage + 1)
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

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    
    const { data: usageData, error: usageError } = await supabaseClient
      .from('extension_job_submissions')
      .select('id')
      .eq('user_id', userId)
      .eq('usage_month', currentMonth)

    if (usageError) throw usageError

    // Get user tier and limits
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    const tierLimits = {
      'free': 5,
      'basic': 20,
      'professional': 150,
      'executive': 400
    }
    
    const userTier = userProfile?.subscription_tier || 'free'
    const monthlyLimit = tierLimits[userTier] || 5
    const currentUsage = usageData?.length || 0
    const remainingUses = Math.max(0, monthlyLimit - currentUsage)

    return new Response(
      JSON.stringify({
        currentMonth: currentUsage,
        monthlyLimit: monthlyLimit,
        remainingUses: remainingUses,
        userId: userId,
        tier: userTier,
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

## Webapp Implementation Status

### ✅ **Already Implemented in Your Webapp**

Your Savvy Career Hub webapp already has the following extension integration features:

1. **Direct Supabase Integration** (`src/features/extension/extensionApi.ts`)
   - `addJobFromExtension()` - Adds jobs directly to Supabase
   - `handleExtensionJobSubmission()` - Handles job submission with usage tracking
   - `getUserTokenForExtension()` - Gets authentication tokens
   - `checkForDuplicateJobs()` - Prevents duplicate submissions

2. **Usage Tracking** (`src/features/extension/extensionUsageService.ts`)
   - `recordExtensionUsage()` - Records extension usage in `extension_job_submissions` table
   - `checkExtensionUsageLimit()` - Checks monthly usage limits
   - Tier-based limits: Free (5), Basic (20), Professional (150), Executive (400)

3. **API Integration System** (New - `src/services/extensionApiService.ts`)
   - HTTP API endpoints for extension communication
   - `submitJob()`, `checkJobExists()`, `getUsage()`, `getConnectionStatus()`
   - Fallback to direct Supabase integration

### 🔄 **Extension Data Flow**

```
Extension → HTTP API → Extension API Service → Supabase
     ↓
Extension → Direct Supabase (existing fallback)
```

### 📋 **Required Extension Updates**

To work with your webapp, the extension should:

1. **Send data in the correct format** (see Data Schema Mapping above)
2. **Use the correct field names** (organization, position, link, etc.)
3. **Handle the response format** (success, job object, usageInfo)
4. **Implement proper error handling** for rate limits and validation
5. **Parse salary information** to extract structured data
6. **Detect job site source** from the URL or page content

### 💰 **Salary Parsing Examples**

The extension should parse salary information and extract structured data:

```javascript
// Parse salary text and extract structured data
function parseSalary(salaryText) {
  if (!salaryText) return { salary: null, salary_type: null, salary_min: null, salary_max: null };
  
  // Remove common currency symbols and text
  const cleanText = salaryText.replace(/[$,\s]/g, '').toLowerCase();
  
  // Annual salary patterns
  if (cleanText.includes('per year') || cleanText.includes('annually') || 
      cleanText.match(/\d+k?\s*-\s*\d+k?/) && !cleanText.includes('hour')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        salary: salaryText,
        salary_type: 'annual',
        salary_min: parseInt(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1),
        salary_max: parseInt(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1)
      };
    }
  }
  
  // Hourly salary patterns
  if (cleanText.includes('per hour') || cleanText.includes('hourly')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        salary: salaryText,
        salary_type: 'hourly',
        salary_min: parseInt(numbers[0]),
        salary_max: parseInt(numbers[1])
      };
    }
  }
  
  // Monthly salary patterns
  if (cleanText.includes('per month') || cleanText.includes('monthly')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        salary: salaryText,
        salary_type: 'monthly',
        salary_min: parseInt(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1),
        salary_max: parseInt(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1)
      };
    }
  }
  
  // Default fallback
  return {
    salary: salaryText,
    salary_type: 'annual',
    salary_min: null,
    salary_max: null
  };
}

// Detect job site source from URL
function detectJobSite(url) {
  const domain = new URL(url).hostname.toLowerCase();
  
  if (domain.includes('indeed')) return { source: 'indeed', job_site: 'Indeed' };
  if (domain.includes('linkedin')) return { source: 'linkedin', job_site: 'LinkedIn' };
  if (domain.includes('glassdoor')) return { source: 'glassdoor', job_site: 'Glassdoor' };
  if (domain.includes('ziprecruiter')) return { source: 'ziprecruiter', job_site: 'ZipRecruiter' };
  if (domain.includes('monster')) return { source: 'monster', job_site: 'Monster' };
  if (domain.includes('careerbuilder')) return { source: 'careerbuilder', job_site: 'CareerBuilder' };
  if (domain.includes('dice')) return { source: 'dice', job_site: 'Dice' };
  if (domain.includes('angel.co') || domain.includes('angelist')) return { source: 'angel_list', job_site: 'AngelList' };
  if (domain.includes('remoteok.io')) return { source: 'remote_ok', job_site: 'Remote OK' };
  if (domain.includes('weworkremotely')) return { source: 'weworkremotely', job_site: 'We Work Remotely' };
  
  return { source: 'other', job_site: 'Other' };
}
```

### 🚀 **Testing the Integration**

1. **Enable API Integration** in feature flags
2. **Test with ExtensionApiTest** component in admin dashboard
3. **Verify data mapping** between extension and webapp schemas
4. **Check usage tracking** in `extension_job_submissions` table

This implementation provides a complete foundation for the JOT Snatcher extension's API integration! The extension will automatically send the correct headers and handle the responses.
