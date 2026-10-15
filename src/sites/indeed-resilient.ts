import { PartialJob } from '@/extract/merge';
import { clean, normalizeEnvironment, rejectShareText, visibleText } from '@/extract/text';

const RX = {
  salary: /\$\s?[\d,.]+\s?[KkMm]?(?:\s?\/\s?(?:yr|year|hr|hour|mo|month))?(?:\s?[-–]\s?\$\s?[\d,.]+\s?[KkMm]?)?/,
  jobType: /\b(Full-time|Part-time|Contract|Temporary|Internship)\b/i,
  env: /\b(Remote|Hybrid|On-site|In-person)\b/i,
  age: /\b(?:posted\s+)?(\d+\s+(?:minute|hour|day|week|month)s?\s+ago|today|yesterday)\b/i,
};

export function indeedJobKey(url = location.href): string | null {
  const parsed = new URL(url);
  return parsed.searchParams.get('vjk') || parsed.searchParams.get('jk');
}

export function canonicalIndeedUrl(key: string | null, fallback = location.href): string {
  return key ? `https://www.indeed.com/viewjob?jk=${key}` : fallback;
}

export function isIndeedJobPage(url = location.href): boolean {
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith('indeed.com')) return false;
  return parsed.pathname.includes('/viewjob') || parsed.pathname.includes('/jobs') || parsed.searchParams.has('vjk') || parsed.searchParams.has('jk');
}

function findIndeedPane(key: string | null): Element {
  if (key) {
    const marked = document.querySelector(`[data-jk="${key}"], a[href*="jk=${key}"], a[href*="vjk=${key}"]`);
    let node: Element | null = marked;
    while (node && node !== document.body) {
      const heading = node.querySelector('h1, h2');
      if (heading && /apply/i.test((node as HTMLElement).innerText || '') && (visibleText(node)?.length || 0) > 80) {
        return node;
      }
      node = node.parentElement;
    }
  }
  const heading = document.querySelector('h1');
  return heading?.closest('main, article, section') || document.querySelector('main') || document.body;
}

export function extractIndeedJob(): PartialJob {
  const key = indeedJobKey();
  const pane = findIndeedPane(key);
  const text = visibleText(pane) || '';
  const title = visibleText(pane.querySelector('h1, h2'));
  const companyLink = pane.querySelector('a[href*="/cmp/"], [data-testid="inlineHeader-companyName"], [data-testid="company-name"]');
  return {
    jobId: key,
    position: title,
    organization: rejectShareText(visibleText(companyLink)),
    location: clean(text.match(/[A-Z][\w .'-]+,\s?[A-Z]{2}\b/)?.[0]),
    salary: text.match(RX.salary)?.[0] || null,
    type: text.match(RX.jobType)?.[1] || null,
    environment: normalizeEnvironment(text.match(RX.env)?.[1] || null),
    ageOfPosting: text.match(RX.age)?.[0] || null,
    date_posted: text.match(RX.age)?.[0] || null,
    description: visibleText(pane.querySelector('#jobDescriptionText, [id*="jobDescription"]')) || text,
    link: canonicalIndeedUrl(key),
    source: 'indeed',
    job_site: 'Indeed',
  };
}

export function waitForSelectedJob(readKey: () => string | null, extract: () => PartialJob, timeoutMs = 2500): Promise<PartialJob> {
  return new Promise((resolve) => {
    const startKey = readKey();
    const finish = (value: PartialJob) => {
      observer.disconnect();
      clearTimeout(timer);
      resolve(value);
    };
    const tryNow = () => {
      const job = extract();
      if (job.position && job.organization && readKey() === startKey) finish(job);
    };
    const observer = new MutationObserver(tryNow);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => finish(extract()), timeoutMs);
    tryNow();
  });
}
