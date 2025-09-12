// Example: How to use the Kanban Schema for Job Submission
// This file demonstrates the complete workflow for submitting jobs to the kanban board

import { 
  convertToKanbanFormat, 
  submitExtensionJobToKanban, 
  validateKanbanJobData,
  KanbanJobData,
  KanbanApiResponse
} from '../utils/kanbanSchema';
import { JobData } from '../types';

/**
 * Example 1: Basic job submission using extension job data
 */
export async function exampleBasicJobSubmission() {
  // Sample job data extracted by the extension
  const extensionJobData: JobData = {
    organization: 'Tech Corp',
    position: 'Senior Software Engineer',
    link: 'https://indeed.com/viewjob?jk=123456',
    salary: '$120,000 - $150,000',
    salary_type: 'annual',
    salary_min: 120000,
    salary_max: 150000,
    location: 'San Francisco, CA',
    type: 'Full Time',
    environment: 'Hybrid',
    stage: 'Saved',
    source: 'indeed',
    job_site: 'Indeed',
    date_saved: new Date().toISOString(),
    date_posted: null,
    // ... other fields
  };

  // Convert to kanban format
  const kanbanJobData = convertToKanbanFormat(extensionJobData);
  console.log('Converted job data:', kanbanJobData);

  // Validate before submission
  const validation = validateKanbanJobData(kanbanJobData);
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Submit to kanban board
  const userId = 'your-user-id-here';
  const result = await submitExtensionJobToKanban(extensionJobData, 'http://localhost:8080/api', userId);
  
  if (result.success) {
    console.log('✅ Job submitted successfully!');
    console.log('Job ID:', result.job?.id);
    console.log('Usage info:', result.usageInfo);
  } else {
    console.error('❌ Submission failed:', result.error);
  }
}

/**
 * Example 2: Manual job data creation and submission
 */
export async function exampleManualJobCreation() {
  // Create job data manually
  const kanbanJobData: KanbanJobData = {
    organization: 'Startup Inc',
    position: 'Frontend Developer',
    salary: '$80,000 - $100,000',
    salary_type: 'annual',
    salary_min: 80000,
    salary_max: 100000,
    source: 'linkedin',
    job_site: 'LinkedIn',
    location: 'Remote',
    type: 'Full Time',
    environment: 'Remote'
  };

  // Validate
  const validation = validateKanbanJobData(kanbanJobData);
  if (!validation.isValid) {
    console.error('Validation errors:', validation.errors);
    return;
  }

  // Submit directly
  const userId = 'your-user-id-here';
  const result = await submitExtensionJobToKanban(kanbanJobData, 'http://localhost:8080/api', userId);
  
  console.log('Submission result:', result);
}

/**
 * Example 3: Batch job submission
 */
export async function exampleBatchJobSubmission() {
  const jobs: JobData[] = [
    {
      organization: 'Company A',
      position: 'Backend Developer',
      link: 'https://indeed.com/viewjob?jk=111',
      salary: '$90,000 - $110,000',
      salary_type: 'annual',
      salary_min: 90000,
      salary_max: 110000,
      location: 'New York, NY',
      type: 'Full Time',
      environment: 'In-Person',
      stage: 'Saved',
      source: 'indeed',
      job_site: 'Indeed',
      date_saved: new Date().toISOString(),
      date_posted: null
    },
    {
      organization: 'Company B',
      position: 'DevOps Engineer',
      link: 'https://linkedin.com/jobs/view/222',
      salary: '$100,000 - $130,000',
      salary_type: 'annual',
      salary_min: 100000,
      salary_max: 130000,
      location: 'Seattle, WA',
      type: 'Full Time',
      environment: 'Hybrid',
      stage: 'Saved',
      source: 'linkedin',
      job_site: 'LinkedIn',
      date_saved: new Date().toISOString(),
      date_posted: null
    }
  ];

  const userId = 'your-user-id-here';
  const results: KanbanApiResponse[] = [];

  for (const job of jobs) {
    const result = await submitExtensionJobToKanban(job, 'http://localhost:8080/api', userId);
    results.push(result);
    
    // Add delay between submissions to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Check results
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Batch submission complete: ${successful} successful, ${failed} failed`);
}

/**
 * Example 4: Error handling and retry logic
 */
export async function exampleWithErrorHandling() {
  const extensionJobData: JobData = {
    organization: 'Error Test Corp',
    position: 'Test Engineer',
    link: 'https://example.com/job/123',
    salary: '$60,000 - $80,000',
    salary_type: 'annual',
    salary_min: 60000,
    salary_max: 80000,
    location: 'Test City',
    type: 'Full Time',
    environment: 'Remote',
    stage: 'Saved',
    source: 'company_website',
    job_site: 'Company Website',
    date_saved: new Date().toISOString(),
    date_posted: null
  };

  const userId = 'your-user-id-here';
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await submitExtensionJobToKanban(extensionJobData, 'http://localhost:8080/api', userId);
      
      if (result.success) {
        console.log('✅ Job submitted successfully on attempt', attempt + 1);
        return result;
      } else {
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1} threw error:`, error);
    }

    attempt++;
    
    if (attempt < maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('❌ All retry attempts failed');
  return null;
}

/**
 * Example 5: Using the kanban schema in a React component
 */
export function exampleReactComponent() {
  return `
// In your React component
import { submitExtensionJobToKanban } from '../utils/kanbanSchema';

const JobSubmissionComponent = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmitJob = async (jobData) => {
    setIsSubmitting(true);
    try {
      const result = await submitExtensionJobToKanban(
        jobData, 
        'http://localhost:8080/api', 
        userId
      );
      setResult(result);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {isSubmitting && <p>Submitting job...</p>}
      {result && (
        <div>
          {result.success ? (
            <p>✅ Job submitted successfully!</p>
          ) : (
            <p>❌ Submission failed: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
  `;
}

/**
 * Example 6: Testing the schema with different data types
 */
export function exampleSchemaTesting() {
  const testCases = [
    {
      name: 'Indeed job with salary range',
      data: {
        organization: 'Tech Company',
        position: 'Software Engineer',
        salary: '$80,000 - $120,000 per year',
        link: 'https://indeed.com/viewjob?jk=123'
      }
    },
    {
      name: 'LinkedIn job with hourly rate',
      data: {
        organization: 'Consulting Firm',
        position: 'Contract Developer',
        salary: '$50 - $75 per hour',
        link: 'https://linkedin.com/jobs/view/456'
      }
    },
    {
      name: 'Company website job',
      data: {
        organization: 'Startup Inc',
        position: 'Full Stack Developer',
        salary: null,
        link: 'https://startup.com/careers/job-789'
      }
    }
  ];

  testCases.forEach(testCase => {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    const kanbanData = convertToKanbanFormat(testCase.data);
    console.log('Converted data:', kanbanData);
    
    const validation = validateKanbanJobData(kanbanData);
    console.log('Validation:', validation);
  });
}

// Export all examples for easy testing
export const examples = {
  basic: exampleBasicJobSubmission,
  manual: exampleManualJobCreation,
  batch: exampleBatchJobSubmission,
  errorHandling: exampleWithErrorHandling,
  reactComponent: exampleReactComponent,
  schemaTesting: exampleSchemaTesting
};
