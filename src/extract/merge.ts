import { JobData } from '@/types';
import { factsFromPosting, isEmptyValue, isSearchResultsHeading, normalizeClearance, normalizeEnvironment, normalizeJobType, parseRelativeDate, preferPostingEnvironment, salaryTypeFromText, stripHtml } from './text';

export type FieldSource = 'jsonld' | 'config' | 'builtin' | 'ai';

export interface PartialJob {
  organization?: string | null;
  position?: string | null;
  link?: string | null;
  salary?: string | null;
  salary_type?: JobData['salary_type'] | null;
  salary_min?: number | null;
  salary_max?: number | null;
  location?: string | null;
  type?: string | null;
  environment?: string | null;
  clearance?: string | null;
  description?: string | null;
  date_posted?: string | null;
  ageOfPosting?: string | null;
  numApplicants?: string | null;
  jobId?: string | null;
  source?: string | null;
  job_site?: string | null;
}

const MERGE_FIELDS: (keyof PartialJob)[] = [
  'organization', 'position', 'link', 'salary', 'salary_type', 'salary_min', 'salary_max',
  'location', 'type', 'environment', 'clearance', 'description', 'date_posted', 'ageOfPosting', 'numApplicants', 'jobId',
  'source', 'job_site',
];

export function mergePartial(base: PartialJob, next: PartialJob, source: FieldSource, sources: Record<string, FieldSource>): PartialJob {
  const merged: PartialJob = { ...base };
  for (const field of MERGE_FIELDS) {
    const incoming = next[field];
    const currentEmpty = isEmptyValue(merged[field]) || (field === 'position' && isSearchResultsHeading(String(merged[field] || '')));
    const incomingUsable = !isEmptyValue(incoming) && !(field === 'position' && isSearchResultsHeading(String(incoming)));
    if (currentEmpty && incomingUsable) {
      (merged as Record<string, unknown>)[field] = incoming;
      sources[field] = source;
    }
  }
  return merged;
}

export function requiredFilled(job: PartialJob): boolean {
  return !isEmptyValue(job.organization) && !isEmptyValue(job.position) && !isSearchResultsHeading(job.position);
}

export function missingFields(job: PartialJob): string[] {
  return MERGE_FIELDS.filter((field) => isEmptyValue(job[field]) && field !== 'source' && field !== 'job_site' && field !== 'salary_type' && field !== 'salary_min' && field !== 'salary_max');
}

function displayOr(value: string | null | undefined, placeholder: string): string {
  return isEmptyValue(value) ? placeholder : String(value);
}

export function toJobData(partial: PartialJob, pageUrl: string): JobData {
  const site = partial.job_site || partial.source || 'Unknown';
  const description = isEmptyValue(partial.description) ? '' : stripHtml(String(partial.description));
  const facts = factsFromPosting(description);
  const salary = isEmptyValue(partial.salary) ? 'Not specified' : String(partial.salary);
  const salaryType = partial.salary_type || salaryTypeFromText(partial.salary ?? null);
  const posted = isEmptyValue(partial.date_posted) ? null : parseRelativeDate(String(partial.date_posted)) || null;
  const age = isEmptyValue(partial.ageOfPosting)
    ? (posted ? 'Unknown' : 'Unknown')
    : String(partial.ageOfPosting);
  return {
    organization: displayOr(partial.organization, 'Manual Entry Required'),
    position: displayOr(partial.position, 'Manual Entry Required'),
    link: isEmptyValue(partial.link) ? pageUrl : String(partial.link),
    salary,
    salary_type: salaryType,
    salaryTypeDisplay: salaryType.charAt(0).toUpperCase() + salaryType.slice(1),
    salary_min: partial.salary_min ?? null,
    salary_max: partial.salary_max ?? null,
    location: displayOr(isEmptyValue(partial.location) ? facts.location : partial.location, 'Not specified'),
    type: displayOr(normalizeJobType(partial.type || null), 'Not specified'),
    environment: displayOr(preferPostingEnvironment(normalizeEnvironment(partial.environment || null), facts.environment), 'Not specified'),
    clearance: displayOr(normalizeClearance(partial.clearance || null) || facts.clearance, 'Not specified'),
    stage: 'Saved',
    source: (partial.source || site).toString().toLowerCase(),
    job_site: site,
    date_saved: new Date().toISOString(),
    date_posted: posted,
    job_posting_url: isEmptyValue(partial.link) ? pageUrl : String(partial.link),
    description,
    jobId: partial.jobId || `JOB-${Date.now()}`,
    companyName: displayOr(partial.organization, 'Manual Entry Required'),
    jobLink: isEmptyValue(partial.link) ? pageUrl : String(partial.link),
    jobTitle: displayOr(partial.position, 'Manual Entry Required'),
    workType: displayOr(normalizeJobType(partial.type || null), 'Not specified'),
    ageOfPosting: isEmptyValue(partial.ageOfPosting) ? 'Unknown' : age,
    numApplicants: displayOr(partial.numApplicants, 'Unknown'),
  };
}
