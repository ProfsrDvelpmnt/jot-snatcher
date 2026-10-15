export interface LinkedInJob {
  position: string | null;
  organization: string | null;
  location: string | null;
  salary: string | null;
  salaryType: 'yearly' | 'hourly' | 'monthly' | null;
  jobType: string | null;
  environment: 'Remote' | 'Hybrid' | 'On-site' | null;
  description: string | null;
  postingAge: string | null;
  applicants: string | null;
  jobId: string | null;
  jobUrl: string;
}

export function isLinkedInJobPage(url = location.href): boolean {
  const parsed = new URL(url);
  if (!/(^|\.)linkedin\.com$/.test(parsed.hostname)) return false;
  return parsed.pathname.startsWith('/jobs/view/') || parsed.searchParams.has('currentJobId');
}

export function getJobId(url = location.href): string | null {
  const parsed = new URL(url);
  const fromParam = parsed.searchParams.get('currentJobId');
  if (fromParam) return fromParam;
  const match = parsed.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d+)/);
  return match ? match[1] : null;
}

export function canonicalJobUrl(jobId: string | null, fallback = location.href): string {
  return jobId ? `https://www.linkedin.com/jobs/view/${jobId}/` : fallback;
}

const clean = (value: string | null | undefined) =>
  (value ?? '').replace(/\s+/g, ' ').trim() || null;

const visibleText = (el: Element | null) =>
  el ? clean((el as HTMLElement).innerText ?? el.textContent) : null;

function findDetailPane(titleEl: Element | null): Element {
  let node: Element | null = titleEl;
  while (node && node !== document.body) {
    const text = (node as HTMLElement).innerText ?? '';
    if (/about the job/i.test(text) && node.querySelector('a[href*="/company/"]')) return node;
    node = node.parentElement;
  }
  return document.querySelector('main') ?? document.body;
}

function findTitleEl(jobId: string | null): Element | null {
  if (jobId) {
    const links = Array.from(document.querySelectorAll(`a[href*="/jobs/view/${jobId}"]`));
    const inHeading = links.find((link) => link.closest('h1, h2'));
    if (inHeading) return inHeading;
    const inPane = links.find((link) => /about the job/i.test(findDetailPane(link).textContent ?? ''));
    if (inPane) return inPane;
  }
  return document.querySelector('main h1') ?? document.querySelector('h1');
}

const RX = {
  applicants: /((?:over\s+)?\d[\d,]*\+?)\s+(applicants|people clicked apply)/i,
  age: /\b(reposted\s+)?(\d+\s+(?:minute|hour|day|week|month|year)s?\s+ago|just now|today|yesterday)\b/i,
  salary: /\$\s?[\d,.]+\s?[KkMm]?(?:\s?\/\s?(?:yr|year|hr|hour|mo|month))?(?:\s?[-–]\s?\$\s?[\d,.]+\s?[KkMm]?(?:\s?\/\s?(?:yr|year|hr|hour|mo|month))?)?/,
  jobType: /\b(Full-time|Part-time|Contract|Temporary|Internship|Volunteer)\b/i,
  env: /\b(Remote|Hybrid|On-site)\b/i,
};

function parseSalaryType(value: string | null): LinkedInJob['salaryType'] {
  if (!value) return null;
  if (/\/\s?(hr|hour)/i.test(value)) return 'hourly';
  if (/\/\s?(mo|month)/i.test(value)) return 'monthly';
  return 'yearly';
}

function findLocation(pane: Element, company: string | null): string | null {
  const text = visibleText(pane) ?? '';
  const parts = text.split(/\s·\s|\n/).map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    if (part === company) continue;
    if (RX.age.test(part) || RX.applicants.test(part)) continue;
    if (/^[A-Z][\w .'-]+,\s?[A-Z]{2}\b/.test(part) || /^(United States|Greater .+ Area|.+ Metropolitan Area)$/.test(part)) {
      return part.replace(/\s*\((Remote|Hybrid|On-site)\)\s*$/i, '');
    }
  }
  return null;
}

function findDescription(pane: Element): string | null {
  const heading = Array.from(pane.querySelectorAll('h1, h2, h3')).find((headingEl) =>
    /about the job/i.test(headingEl.textContent ?? '')
  );
  if (!heading) return null;
  let box: Element | null = heading.parentElement;
  while (box && (visibleText(box)?.length ?? 0) < 200 && box !== pane) box = box.parentElement;
  const text = visibleText(box);
  return text ? text.replace(/^about the job\s*/i, '') : null;
}

export function extractLinkedInJob(): LinkedInJob {
  const jobId = getJobId();
  const titleEl = findTitleEl(jobId);
  const pane = findDetailPane(titleEl);
  const paneText = visibleText(pane) ?? '';
  const companyLink = pane.querySelector('a[href*="/company/"]');
  const organization =
    visibleText(companyLink) ||
    clean(companyLink?.getAttribute('aria-label')?.replace(/\s*logo$/i, '')) ||
    clean(companyLink?.querySelector('img')?.getAttribute('alt')?.replace(/\s*logo$/i, ''));
  const salary = paneText.match(RX.salary)?.[0] ?? null;
  const env = paneText.match(RX.env)?.[1] ?? null;

  return {
    position: visibleText(titleEl),
    organization,
    location: findLocation(pane, organization),
    salary,
    salaryType: parseSalaryType(salary),
    jobType: paneText.match(RX.jobType)?.[1] ?? null,
    environment: env ? (/remote/i.test(env) ? 'Remote' : /hybrid/i.test(env) ? 'Hybrid' : 'On-site') : null,
    description: findDescription(pane),
    postingAge: paneText.match(RX.age)?.[0] ?? null,
    applicants: paneText.match(RX.applicants)?.[0] ?? null,
    jobId,
    jobUrl: canonicalJobUrl(jobId),
  };
}

export function waitForLinkedInJob(timeoutMs = 2500): Promise<LinkedInJob | null> {
  return new Promise((resolve) => {
    const done = (value: LinkedInJob | null) => {
      observer.disconnect();
      clearTimeout(timer);
      resolve(value);
    };
    const tryNow = () => {
      const job = extractLinkedInJob();
      if (job.position && job.organization) done(job);
    };
    const observer = new MutationObserver(tryNow);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(() => done(extractLinkedInJob()), timeoutMs);
    tryNow();
  });
}
