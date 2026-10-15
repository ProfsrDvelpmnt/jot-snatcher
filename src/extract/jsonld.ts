import { PartialJob } from './merge';
import { factsFromPosting, normalizeEnvironment, normalizeJobType, preferPostingEnvironment, stripHtml } from './text';

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function typeName(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  const type = (value as { '@type'?: string | string[] })['@type'];
  return asArray(type).map((item) => String(item));
}

function isJobPosting(value: unknown): boolean {
  return typeName(value).some((type) => type === 'JobPosting' || type.endsWith('/JobPosting'));
}

function collectObjects(node: unknown, found: unknown[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach((item) => collectObjects(item, found));
    return;
  }
  if (typeof node !== 'object') return;
  if (isJobPosting(node)) found.push(node);
  const graph = (node as { '@graph'?: unknown })['@graph'];
  if (graph) collectObjects(graph, found);
}

function locationText(job: Record<string, unknown>): string | null {
  const places = asArray(job.jobLocation as unknown);
  const parts: string[] = [];
  for (const place of places) {
    if (!place || typeof place !== 'object') continue;
    const address = (place as { address?: Record<string, unknown> }).address || place as Record<string, unknown>;
    const locality = address.addressLocality;
    const region = address.addressRegion;
    const country = address.addressCountry;
    const countryName = typeof country === 'object' && country ? (country as { name?: string }).name : country;
    const piece = [locality, region, countryName].filter((part) => typeof part === 'string' && part).join(', ');
    if (piece) parts.push(piece);
  }
  return parts[0] || null;
}

function salaryText(job: Record<string, unknown>): { salary: string | null; salaryType: PartialJob['salary_type']; min: number | null; max: number | null } {
  const base = job.baseSalary as { value?: Record<string, unknown>; currency?: string } | undefined;
  const value = base?.value || {};
  const min = typeof value.minValue === 'number' ? value.minValue : null;
  const max = typeof value.maxValue === 'number' ? value.maxValue : null;
  const currency = base?.currency || value.currency || '';
  const unit = String(value.unitText || '');
  if (min == null && max == null) return { salary: null, salaryType: null, min: null, max: null };
  const range = min != null && max != null && min !== max ? `${currency} ${min} - ${max}` : `${currency} ${min ?? max}`;
  const suffix = /hour/i.test(unit) ? '/hr' : /month/i.test(unit) ? '/mo' : /year|annum/i.test(unit) ? '/yr' : '';
  const salaryType = /hour/i.test(unit) ? 'hourly' : /month/i.test(unit) ? 'monthly' : 'annual';
  return { salary: `${range}${suffix}`.trim(), salaryType, min, max };
}

function mapJob(job: Record<string, unknown>): PartialJob {
  const hiring = job.hiringOrganization as { name?: string } | undefined;
  const salary = salaryText(job);
  const employment = asArray(job.employmentType as string | string[]).map((item) => normalizeJobType(String(item))).find(Boolean) || null;
  const description = stripHtml(typeof job.description === 'string' ? job.description : null);
  const facts = factsFromPosting(description);
  const schemaEnvironment = job.jobLocationType === 'TELECOMMUTE' ? 'Remote' : normalizeEnvironment(String(job.jobLocationType || ''));
  return {
    position: typeof job.title === 'string' ? job.title : null,
    organization: hiring?.name || null,
    location: locationText(job) || facts.location,
    salary: salary.salary,
    salary_type: salary.salaryType,
    salary_min: salary.min,
    salary_max: salary.max,
    type: employment,
    environment: preferPostingEnvironment(schemaEnvironment, facts.environment),
    clearance: facts.clearance,
    description,
    ageOfPosting: typeof job.datePosted === 'string' ? job.datePosted : null,
    date_posted: typeof job.datePosted === 'string' ? job.datePosted : null,
  };
}

export function extractJsonLd(doc: Document = document): PartialJob {
  const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  const jobs: unknown[] = [];
  for (const script of scripts) {
    try {
      collectObjects(JSON.parse(script.textContent || ''), jobs);
    } catch {
      // Skip invalid blocks.
    }
  }
  const first = jobs.find((job) => job && typeof job === 'object') as Record<string, unknown> | undefined;
  return first ? mapJob(first) : {};
}
