import { applyStrategies } from './applyConfig';
import { extractJsonLd } from './jsonld';
import { mergePartial, missingFields, requiredFilled, toJobData, type FieldSource, type PartialJob } from './merge';
import { isEmptyValue } from './text';
import { extractGreenhouseJob, isGreenhouseJobPage } from '@/sites/greenhouse-resilient';
import { extractHiringCafeJob, isHiringCafeJobPage } from '@/sites/hiring-cafe-resilient';
import { extractIndeedJob, indeedJobKey, isIndeedJobPage, waitForSelectedJob } from '@/sites/indeed-resilient';
import { extractLinkedInJob, isLinkedInJobPage, waitForLinkedInJob } from '@/sites/linkedin-resilient';
import { extractMonsterJob, isMonsterJobPage } from '@/sites/monster-resilient';
import { extractZipRecruiterJob, isZipJobPage } from '@/sites/ziprecruiter-resilient';
import { GreenhouseExtractor } from '@/sites/greenhouse';
import { HiringCafeExtractor } from '@/sites/hiring-cafe';
import { IndeedExtractor } from '@/sites/indeed';
import { LinkedInExtractor } from '@/sites/linkedin';
import { MonsterExtractor } from '@/sites/monster';
import { TheLaddersExtractor } from '@/sites/theladders';
import { WorkdayExtractor } from '@/sites/workday';
import { ZipRecruiterExtractor } from '@/sites/ziprecruiter';
import { JobData } from '@/types';
import { SiteExtractorConfig } from './configSchema';

const DEADLINE_MS = 3000;

export interface PipelineResult {
  jobData: JobData;
  fieldSources: Record<string, FieldSource>;
  layersUsed: string[];
  missing: string[];
  durationMs: number;
  siteKey: string;
  generic: boolean;
  hostname: string;
  pathPattern: string;
}

function siteKeyFromUrl(url: string): { siteKey: string; generic: boolean } {
  const host = new URL(url).hostname;
  if (host.endsWith('linkedin.com')) return { siteKey: 'linkedin', generic: false };
  if (host.endsWith('indeed.com')) return { siteKey: 'indeed', generic: false };
  if (host.endsWith('monster.com')) return { siteKey: 'monster', generic: false };
  if (host.endsWith('ziprecruiter.com')) return { siteKey: 'ziprecruiter', generic: false };
  if (host.endsWith('greenhouse.io')) return { siteKey: 'greenhouse', generic: false };
  if (host.endsWith('hiringcafe.com') || host.endsWith('hiring.cafe')) return { siteKey: 'hiring-cafe', generic: false };
  if (host.includes('myworkdayjobs.com') || host.endsWith('workday.com')) return { siteKey: 'workday', generic: false };
  if (host.endsWith('theladders.com')) return { siteKey: 'theladders', generic: false };
  return { siteKey: 'generic', generic: true };
}

function pathPattern(url: string): { hostname: string; pathPattern: string } {
  const parsed = new URL(url);
  return {
    hostname: parsed.hostname,
    pathPattern: parsed.pathname.replace(/\/\d+/g, '/:id').replace(/[a-f0-9]{8,}/gi, ':id'),
  };
}

function fromExtractor(data: JobData | null): PartialJob {
  if (!data) return {};
  const partial: PartialJob = {
    organization: data.organization,
    position: data.position,
    link: data.job_posting_url || data.link,
    salary: data.salary,
    salary_type: data.salary_type,
    salary_min: data.salary_min,
    salary_max: data.salary_max,
    location: data.location,
    type: data.type,
    environment: data.environment,
    clearance: data.clearance,
    description: data.description,
    date_posted: data.date_posted,
    ageOfPosting: data.ageOfPosting,
    numApplicants: data.numApplicants,
    jobId: data.jobId,
    source: data.source,
    job_site: data.job_site,
  };
  (Object.keys(partial) as (keyof PartialJob)[]).forEach((key) => {
    if (isEmptyValue(partial[key])) delete partial[key];
  });
  return partial;
}

async function legacyExtract(siteKey: string): Promise<PartialJob> {
  const extractors: Record<string, { extractJobData: () => JobData | null | Promise<JobData | null> }> = {
    linkedin: new LinkedInExtractor(),
    indeed: new IndeedExtractor(),
    monster: new MonsterExtractor(),
    ziprecruiter: new ZipRecruiterExtractor(),
    greenhouse: new GreenhouseExtractor(),
    'hiring-cafe': new HiringCafeExtractor(),
    workday: new WorkdayExtractor(),
    theladders: new TheLaddersExtractor(),
  };
  const extractor = extractors[siteKey];
  if (!extractor) return {};
  const result = extractor.extractJobData();
  return fromExtractor(result instanceof Promise ? await result : result);
}

async function builtin(siteKey: string): Promise<PartialJob> {
  if (siteKey === 'linkedin' && isLinkedInJobPage()) {
    const job = await waitForLinkedInJob(2000);
    if (!job) return {};
    return {
      position: job.position,
      organization: job.organization,
      location: job.location,
      salary: job.salary,
      salary_type: job.salaryType === 'hourly' ? 'hourly' : job.salaryType === 'monthly' ? 'monthly' : job.salary ? 'annual' : null,
      type: job.jobType,
      environment: job.environment,
      description: job.description,
      ageOfPosting: job.postingAge,
      date_posted: job.postingAge,
      numApplicants: job.applicants,
      jobId: job.jobId,
      link: job.jobUrl,
      source: 'linkedin',
      job_site: 'LinkedIn',
    };
  }
  if (siteKey === 'indeed' && isIndeedJobPage()) {
    return waitForSelectedJob(indeedJobKey, extractIndeedJob, 2000);
  }
  if (siteKey === 'monster' && isMonsterJobPage()) return extractMonsterJob();
  if (siteKey === 'ziprecruiter' && isZipJobPage()) return extractZipRecruiterJob();
  if (siteKey === 'greenhouse' && isGreenhouseJobPage()) return extractGreenhouseJob();
  if (siteKey === 'hiring-cafe' && isHiringCafeJobPage()) return extractHiringCafeJob();
  return legacyExtract(siteKey);
}

function configToPartial(values: Record<string, string | null>, siteKey: string): PartialJob {
  return {
    organization: values.organization,
    position: values.position,
    location: values.location,
    salary: values.salary,
    type: values.type,
    environment: values.environment,
    clearance: values.clearance,
    description: values.description,
    ageOfPosting: values.ageOfPosting,
    date_posted: values.date_posted || values.ageOfPosting,
    source: siteKey,
  };
}

async function aiFallback(siteKey: string, pageUrl: string): Promise<PartialJob> {
  const root = document.querySelector('main') || document.body;
  const text = ((root as HTMLElement).innerText || '').slice(0, 15000);
  const response = await chrome.runtime.sendMessage({
    type: 'EXTRACT_WITH_AI',
    text,
    url: pageUrl,
    siteKey,
  });
  const data = response?.data?.job || response?.data;
  if (!response?.success || !data) return {};
  return data as PartialJob;
}

export async function runExtractionPipeline(): Promise<PipelineResult> {
  const started = Date.now();
  const pageUrl = location.href;
  const { siteKey, generic } = siteKeyFromUrl(pageUrl);
  const locationBits = pathPattern(pageUrl);
  const sources: Record<string, FieldSource> = {};
  const layersUsed: string[] = [];
  let job: PartialJob = { source: siteKey, job_site: generic ? locationBits.hostname : undefined };
  const deadline = started + DEADLINE_MS;

  const jsonld = extractJsonLd();
  job = mergePartial(job, jsonld, 'jsonld', sources);
  layersUsed.push('jsonld');

  if (!generic && Date.now() < deadline) {
    const configResponse = await chrome.runtime.sendMessage({ type: 'GET_EXTRACTOR_CONFIG', siteKey });
    const config = (configResponse?.data || null) as SiteExtractorConfig | null;
    job = mergePartial(job, configToPartial(applyStrategies(config, pageUrl), siteKey), 'config', sources);
    layersUsed.push('config');
  }

  if (!generic && (!requiredFilled(job) || isEmptyValue(job.environment)) && Date.now() < deadline) {
    job = mergePartial(job, await builtin(siteKey), 'builtin', sources);
    layersUsed.push('builtin');
  }

  if (!requiredFilled(job) && Date.now() < deadline) {
    job = mergePartial(job, await aiFallback(siteKey, pageUrl), 'ai', sources);
    layersUsed.push('ai');
  }

  const missing = missingFields(job);
  const result: PipelineResult = {
    jobData: toJobData(job, pageUrl),
    fieldSources: sources,
    layersUsed,
    missing,
    durationMs: Date.now() - started,
    siteKey,
    generic,
    hostname: locationBits.hostname,
    pathPattern: locationBits.pathPattern,
  };

  chrome.runtime.sendMessage({
    type: 'LOG_EXTRACTION_EVENT',
    event: {
      site_key: siteKey,
      hostname: locationBits.hostname,
      path_pattern: locationBits.pathPattern,
      extension_version: chrome.runtime.getManifest().version,
      layers_used: layersUsed,
      missing_fields: missing,
      field_sources: sources,
      duration_ms: result.durationMs,
    },
  }).catch(() => undefined);

  return result;
}
