// Salary parsing utility for job data
export interface ParsedSalary {
  salary: string;
  salary_type: 'annual' | 'hourly' | 'monthly' | 'contract';
  salary_min: number | null;
  salary_max: number | null;
}

export function parseSalary(salaryText: string | null | undefined): ParsedSalary {
  if (!salaryText || salaryText.trim() === '') {
    return {
      salary: '',
      salary_type: 'annual',
      salary_min: null,
      salary_max: null
    };
  }

  const originalText = salaryText.trim();
  const cleanText = salaryText.replace(/[$,\s]/g, '').toLowerCase();
  
  // Annual salary patterns
  if (cleanText.includes('per year') || cleanText.includes('annually') || 
      cleanText.includes('yearly') || 
      (cleanText.match(/\d+k?\s*-\s*\d+k?/) && !cleanText.includes('hour') && !cleanText.includes('month'))) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1);
      const max = parseInt(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1);
      return {
        salary: originalText,
        salary_type: 'annual',
        salary_min: min,
        salary_max: max
      };
    }
  }
  
  // Hourly salary patterns
  if (cleanText.includes('per hour') || cleanText.includes('hourly') || 
      cleanText.includes('/hr') || cleanText.includes('/hour')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      return {
        salary: originalText,
        salary_type: 'hourly',
        salary_min: parseInt(numbers[0]),
        salary_max: parseInt(numbers[1])
      };
    } else if (numbers && numbers.length === 1) {
      return {
        salary: originalText,
        salary_type: 'hourly',
        salary_min: parseInt(numbers[0]),
        salary_max: parseInt(numbers[0])
      };
    }
  }
  
  // Monthly salary patterns
  if (cleanText.includes('per month') || cleanText.includes('monthly') || 
      cleanText.includes('/month')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1);
      const max = parseInt(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1);
      return {
        salary: originalText,
        salary_type: 'monthly',
        salary_min: min,
        salary_max: max
      };
    }
  }
  
  // Contract/Project-based patterns
  if (cleanText.includes('per project') || cleanText.includes('contract') || 
      cleanText.includes('project-based')) {
    const numbers = cleanText.match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      const min = parseInt(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1);
      const max = parseInt(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1);
      return {
        salary: originalText,
        salary_type: 'contract',
        salary_min: min,
        salary_max: max
      };
    }
  }
  
  // Try to extract range from common patterns
  const rangeMatch = cleanText.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1]) * (rangeMatch[1].length <= 3 ? 1000 : 1);
    const max = parseInt(rangeMatch[2]) * (rangeMatch[2].length <= 3 ? 1000 : 1);
    return {
      salary: originalText,
      salary_type: 'annual', // Default to annual
      salary_min: min,
      salary_max: max
    };
  }
  
  // Single number patterns
  const singleNumberMatch = cleanText.match(/(\d+)/);
  if (singleNumberMatch) {
    const value = parseInt(singleNumberMatch[1]) * (singleNumberMatch[1].length <= 3 ? 1000 : 1);
    return {
      salary: originalText,
      salary_type: 'annual', // Default to annual
      salary_min: value,
      salary_max: value
    };
  }
  
  // Default fallback
  return {
    salary: originalText,
    salary_type: 'annual',
    salary_min: null,
    salary_max: null
  };
}

// Helper function to format work type
export function formatWorkType(workType: string | null | undefined): string {
  if (!workType) return 'Full Time';
  
  const type = workType.toLowerCase().trim();
  
  if (type.includes('full') || type.includes('full-time')) return 'Full Time';
  if (type.includes('part') || type.includes('part-time')) return 'Part Time';
  if (type.includes('contract')) return 'Contract';
  if (type.includes('seasonal')) return 'Seasonal';
  if (type.includes('temporary') || type.includes('temp')) return 'Temporary';
  if (type.includes('intern')) return 'Internship';
  
  return 'Full Time'; // Default
}

// Helper function to format environment
export function formatEnvironment(environment: string | null | undefined): string {
  if (!environment) return 'In-Person';
  
  const env = environment.toLowerCase().trim();
  
  if (env.includes('remote')) return 'Remote';
  if (env.includes('hybrid')) return 'Hybrid';
  if (env.includes('on-site') || env.includes('onsite')) return 'In-Person';
  if (env.includes('in-person') || env.includes('in person')) return 'In-Person';
  
  return 'In-Person'; // Default
}
