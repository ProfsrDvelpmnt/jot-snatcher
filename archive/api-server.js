// Simple API server for JOT Snatcher Extension
// Run with: node api-server.js

import express from 'express';
import cors from 'cors';
const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'chrome-extension://*'],
  credentials: true
}));
app.use(express.json());

// Mock data storage (in production, use a real database)
let mockJobs = [];
let mockUsage = {
  currentMonth: 0,
  monthlyLimit: 100,
  remainingUses: 100,
  userId: null,
  tier: 'free',
  lastUpdated: new Date().toISOString()
};

// Health check endpoint
app.get('/api/ext-health', (req, res) => {
  console.log('🔍 Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    server: 'JOT Snatcher API Server'
  });
});

// Connection status endpoint
app.get('/api/ext-status', (req, res) => {
  const userId = req.headers['x-user-id'] || 'unknown';
  console.log('🔍 Status check requested for user:', userId);
  
  res.json({
    connected: true,
    jobData: null,
    usageData: {
      ...mockUsage,
      userId: userId,
      lastUpdated: new Date().toISOString()
    }
  });
});

// Usage data endpoint
app.get('/api/ext-usage', (req, res) => {
  const userId = req.headers['x-user-id'] || 'unknown';
  console.log('🔍 Usage data requested for user:', userId);
  
  res.json({
    ...mockUsage,
    userId: userId,
    lastUpdated: new Date().toISOString()
  });
});

// Job submission endpoint
app.post('/api/ext-jobs', (req, res) => {
  const userId = req.headers['x-user-id'] || 'unknown';
  const jobData = req.body;
  
  console.log('📝 Job submission received for user:', userId);
  console.log('Job data:', jobData);
  
  // Generate job ID
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store job data
  const jobWithId = {
    ...jobData,
    id: jobId,
    userId: userId,
    submittedAt: new Date().toISOString()
  };
  
  mockJobs.push(jobWithId);
  
  // Update usage data
  mockUsage.currentMonth += 1;
  mockUsage.remainingUses = Math.max(0, mockUsage.monthlyLimit - mockUsage.currentMonth);
  mockUsage.lastUpdated = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Job data received successfully',
    jobId: jobId,
    usageData: {
      ...mockUsage,
      userId: userId
    }
  });
});

// Get all jobs (for debugging)
app.get('/api/ext-jobs', (req, res) => {
  const userId = req.headers['x-user-id'] || 'unknown';
  console.log('🔍 Jobs list requested for user:', userId);
  
  const userJobs = mockJobs.filter(job => job.userId === userId);
  res.json({
    jobs: userJobs,
    total: userJobs.length,
    usageData: {
      ...mockUsage,
      userId: userId
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 JOT Snatcher API Server running on port', PORT);
  console.log('📡 Available endpoints:');
  console.log('   GET  /api/ext-health');
  console.log('   GET  /api/ext-status');
  console.log('   GET  /api/ext-usage');
  console.log('   POST /api/ext-jobs');
  console.log('   GET  /api/ext-jobs (list all jobs)');
  console.log('🔗 CORS enabled for: http://127.0.0.1:8080');
});
