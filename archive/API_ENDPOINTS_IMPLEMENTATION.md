# JOT Snatcher API Endpoints Implementation Guide

This guide shows you how to implement the required API endpoints in your Supabase webapp for the JOT Snatcher browser extension.

## 🎯 Required Endpoints

The extension needs these 4 endpoints:
- `GET /api/ext-health` - Health check
- `GET /api/ext-status` - Connection status & user data
- `POST /api/ext-jobs` - Submit job data
- `GET /api/ext-usage` - Get usage statistics

## 🚀 Implementation Options

### Option 1: Supabase Edge Functions (Recommended)
Create serverless functions that run on Supabase's edge network.

### Option 2: Next.js API Routes
If using Next.js, create API route handlers.

### Option 3: Express.js Routes
If using Express.js, add these routes to your existing server.

---

## 📁 Option 1: Supabase Edge Functions

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Initialize Edge Functions
```bash
supabase functions new ext-health
supabase functions new ext-status
supabase functions new ext-jobs
supabase functions new ext-usage
```

### Step 3: Implement Each Function

#### `/api/ext-health` - Health Check
**File: `supabase/functions/ext-health/index.ts`**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'jot-snatcher-extension-api'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Health check failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

#### `/api/ext-status` - Connection Status
**File: `supabase/functions/ext-status/index.ts`**
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user ID from headers
    const userId = req.headers.get('x-user-id')
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user's recent job data
    const { data: jobs, error: jobsError } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
    }

    // Get usage statistics
    const { data: usage, error: usageError } = await supabaseClient
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (usageError) {
      console.error('Error fetching usage:', usageError)
    }

    return new Response(
      JSON.stringify({
        connected: true,
        jobData: jobs || [],
        usageData: usage || {
          totalJobs: 0,
          jobsThisWeek: 0,
          lastActivity: null
        },
        userId: userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Status check error:', error)
    return new Response(
      JSON.stringify({ 
        connected: false, 
        error: 'Status check failed',
        jobData: null,
        usageData: null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

#### `/api/ext-jobs` - Submit Job Data
**File: `supabase/functions/ext-jobs/index.ts`**
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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const jobData = await req.json()
    
    // Validate required fields
    if (!jobData.title || !jobData.company) {
      return new Response(
        JSON.stringify({ error: 'Title and company are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Prepare job data for database
    const jobRecord = {
      user_id: userId,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location || null,
      description: jobData.description || null,
      url: jobData.url || null,
      salary: jobData.salary || null,
      status: jobData.status || 'interested',
      source: jobData.source || 'extension',
      applied_date: jobData.applied_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert job into database
    const { data, error } = await supabaseClient
      .from('jobs')
      .insert([jobRecord])
      .select()
      .single()

    if (error) {
      console.error('Error inserting job:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save job',
          details: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update usage statistics
    await supabaseClient
      .from('usage_stats')
      .upsert({
        user_id: userId,
        total_jobs: supabaseClient.rpc('increment_total_jobs', { user_id: userId }),
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        jobId: data.id,
        message: 'Job saved successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    console.error('Job submission error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Job submission failed',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

#### `/api/ext-usage` - Usage Statistics
**File: `supabase/functions/ext-usage/index.ts`**
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const userId = req.headers.get('x-user-id')
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get total jobs count
    const { count: totalJobs, error: totalError } = await supabaseClient
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (totalError) {
      console.error('Error counting total jobs:', totalError)
    }

    // Get jobs this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { count: jobsThisWeek, error: weekError } = await supabaseClient
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (weekError) {
      console.error('Error counting weekly jobs:', weekError)
    }

    // Get last activity
    const { data: lastJob, error: lastError } = await supabaseClient
      .from('jobs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastError) {
      console.error('Error fetching last activity:', lastError)
    }

    return new Response(
      JSON.stringify({
        totalJobs: totalJobs || 0,
        jobsThisWeek: jobsThisWeek || 0,
        lastActivity: lastJob?.created_at || null,
        userId: userId,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Usage stats error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch usage statistics',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

### Step 4: Deploy Functions
```bash
supabase functions deploy ext-health
supabase functions deploy ext-status
supabase functions deploy ext-jobs
supabase functions deploy ext-usage
```

### Step 5: Update Extension Configuration
Your extension will now work with these URLs:
- `https://your-project.supabase.co/functions/v1/ext-health`
- `https://your-project.supabase.co/functions/v1/ext-status`
- `https://your-project.supabase.co/functions/v1/ext-jobs`
- `https://your-project.supabase.co/functions/v1/ext-usage`

---

## 📁 Option 2: Next.js API Routes

If you're using Next.js, create these files in your `pages/api/` directory:

### `/api/ext-health.js`
```javascript
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jot-snatcher-extension-api'
  })
}
```

### `/api/ext-status.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = req.headers['x-user-id']
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    // Get user's recent jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
    }

    // Get usage statistics
    const { data: usage, error: usageError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (usageError) {
      console.error('Error fetching usage:', usageError)
    }

    res.status(200).json({
      connected: true,
      jobData: jobs || [],
      usageData: usage || {
        totalJobs: 0,
        jobsThisWeek: 0,
        lastActivity: null
      },
      userId: userId
    })
  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({
      connected: false,
      error: 'Status check failed',
      jobData: null,
      usageData: null
    })
  }
}
```

### `/api/ext-jobs.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = req.headers['x-user-id']
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    const jobData = req.body
    
    // Validate required fields
    if (!jobData.title || !jobData.company) {
      return res.status(400).json({ error: 'Title and company are required' })
    }

    // Prepare job data
    const jobRecord = {
      user_id: userId,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location || null,
      description: jobData.description || null,
      url: jobData.url || null,
      salary: jobData.salary || null,
      status: jobData.status || 'interested',
      source: jobData.source || 'extension',
      applied_date: jobData.applied_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Insert job
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobRecord])
      .select()
      .single()

    if (error) {
      console.error('Error inserting job:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to save job',
        details: error.message
      })
    }

    res.status(201).json({
      success: true,
      jobId: data.id,
      message: 'Job saved successfully'
    })
  } catch (error) {
    console.error('Job submission error:', error)
    res.status(500).json({
      success: false,
      error: 'Job submission failed',
      details: error.message
    })
  }
}
```

### `/api/ext-usage.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const userId = req.headers['x-user-id']
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    // Get total jobs count
    const { count: totalJobs, error: totalError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (totalError) {
      console.error('Error counting total jobs:', totalError)
    }

    // Get jobs this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { count: jobsThisWeek, error: weekError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneWeekAgo.toISOString())

    if (weekError) {
      console.error('Error counting weekly jobs:', weekError)
    }

    // Get last activity
    const { data: lastJob, error: lastError } = await supabase
      .from('jobs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (lastError) {
      console.error('Error fetching last activity:', lastError)
    }

    res.status(200).json({
      totalJobs: totalJobs || 0,
      jobsThisWeek: jobsThisWeek || 0,
      lastActivity: lastJob?.created_at || null,
      userId: userId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Usage stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      details: error.message
    })
  }
}
```

---

## 🗄️ Database Schema

Make sure your Supabase database has these tables:

### `jobs` table
```sql
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  description TEXT,
  url TEXT,
  salary TEXT,
  status TEXT DEFAULT 'interested',
  source TEXT DEFAULT 'extension',
  applied_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
```

### `usage_stats` table
```sql
CREATE TABLE usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  total_jobs INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX idx_usage_stats_user_id ON usage_stats(user_id);
```

---

## 🧪 Testing Your Endpoints

### Test with curl:
```bash
# Health check
curl -X GET http://localhost:3000/api/ext-health

# Status check (replace with your user ID)
curl -X GET http://localhost:3000/api/ext-status \
  -H "x-user-id: test-user-123"

# Submit job
curl -X POST http://localhost:3000/api/ext-jobs \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-user-123" \
  -d '{"title":"Software Engineer","company":"Tech Corp","location":"Remote"}'

# Usage stats
curl -X GET http://localhost:3000/api/ext-usage \
  -H "x-user-id: test-user-123"
```

---

## 🔧 Extension Configuration

Once your endpoints are working, update your extension's API configuration:

1. **Open extension options**
2. **Go to API Configuration tab**
3. **Set Base URL** to your webapp URL:
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`
4. **Test connection** to verify it works

---

## 🚀 Next Steps

1. **Choose your implementation method** (Edge Functions recommended)
2. **Set up the database tables** in Supabase
3. **Implement the endpoints** using the code above
4. **Test the endpoints** with curl or Postman
5. **Update extension configuration** to point to your webapp
6. **Test the full integration** with the extension

The extension will now be able to communicate with your Supabase webapp and store real job data!
