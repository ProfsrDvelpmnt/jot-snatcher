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
  if (cleanText.includes('per year') || cleanText.includes('a year') || cleanText.includes('annually') || 
      cleanText.includes('yearly') || cleanText.includes('/yr') ||
      (cleanText.match(/\d+(?:\.\d+)?k?\s*-\s*\d+(?:\.\d+)?k?/) && !cleanText.includes('hour') && !cleanText.includes('month'))) {
    const numbers = cleanText.match(/(\d+(?:\.\d+)?)/g);
    if (numbers && numbers.length >= 2) {
      const min = parseFloat(numbers[0]) * (numbers[0].length <= 3 ? 1000 : 1);
      const max = parseFloat(numbers[1]) * (numbers[1].length <= 3 ? 1000 : 1);
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
  
  // Try to extract range from common patterns (including decimals)
  const rangeMatch = cleanText.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    
    // Determine if this is likely hourly or annual based on the values
    let salaryType: 'annual' | 'hourly' | 'monthly' | 'contract' = 'annual';
    
    // If the range is small (under 200), it's likely hourly
    if (max < 200) {
      salaryType = 'hourly';
    }
    // If the range is very large (over 100,000), it's likely annual
    else if (min > 100000) {
      salaryType = 'annual';
    }
    // If the range is medium (200-100,000), check for common hourly patterns
    else if (min >= 10 && max <= 100) {
      salaryType = 'hourly';
    }
    // If the range is very small (under 50), it's definitely hourly
    else if (max < 50) {
      salaryType = 'hourly';
    }
    
    return {
      salary: originalText,
      salary_type: salaryType,
      salary_min: salaryType === 'hourly' ? min : min * (min.toString().length <= 3 ? 1000 : 1),
      salary_max: salaryType === 'hourly' ? max : max * (max.toString().length <= 3 ? 1000 : 1)
    };
  }
  
  // Single number patterns (including decimals)
  const singleNumberMatch = cleanText.match(/(\d+(?:\.\d+)?)/);
  if (singleNumberMatch) {
    const value = parseFloat(singleNumberMatch[1]);
    
    // Determine if this is likely hourly or annual based on the value
    let salaryType: 'annual' | 'hourly' | 'monthly' | 'contract' = 'annual';
    
    // If the value is small (under 200), it's likely hourly
    if (value < 200) {
      salaryType = 'hourly';
    }
    // If the value is very large (over 100,000), it's likely annual
    else if (value > 100000) {
      salaryType = 'annual';
    }
    // If the value is medium (200-100,000), check for common hourly patterns
    else if (value >= 10 && value <= 100) {
      salaryType = 'hourly';
    }
    
    const adjustedValue = salaryType === 'hourly' ? value : value * (value.toString().length <= 3 ? 1000 : 1);
    
    return {
      salary: originalText,
      salary_type: salaryType,
      salary_min: adjustedValue,
      salary_max: adjustedValue
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
