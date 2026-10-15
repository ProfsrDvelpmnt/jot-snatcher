import { PartialJob } from '@/extract/merge';
import { clean, isSearchResultsHeading, normalizeEnvironment, rejectShareText, visibleText } from '@/extract/text';

const RX = {
  salary: /\$\s?[\d,.]+\s?[KkMm]?(?:\s?[-–]\s?\$\s?[\d,.]+\s?[KkMm]?)?(?:\s*(?:\/|per)\s*(?:yr|year|hr|hour))?/i,
  jobType: /\b(Full-time|Part-time|Contract|Temporary|Internship)\b/i,
  env: /\b(Remote|Hybrid|On-site|In-person)\b/i,
  age: /\b(?:posted\s+)?(\d+\s+(?:minute|hour|day|week|month)s?\s+ago|today|yesterday)\b/i,
};

export function isZipJobPage(url = location.href): boolean {
  const parsed = new URL(url);
  return parsed.hostname.endsWith('ziprecruiter.com') && /\/jobs|\/job\b/.test(parsed.pathname);
}

function headings(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('h1, h2, h3'))
    .map((el) => visibleText(el))
    .filter((text): text is string => !!text);
}

function titleIn(root: Element): string | null {
  const preferred = root.querySelector('h1[data-test="job-title"], h2[aria-label], [data-testid="job-title"]');
  const preferredText = visibleText(preferred);
  if (preferredText && !isSearchResultsHeading(preferredText) && !/^job description$/i.test(preferredText)) {
    return preferredText;
  }
  return headings(root).find((text) => !isSearchResultsHeading(text) && !/^job description$/i.test(text)) || null;
}

function includesResultsHeading(root: Element): boolean {
  return headings(root).some((text) => isSearchResultsHeading(text));
}

function findDetailPane(): Element | null {
  const seeded = document.querySelector('[data-testid="job-details-scroll-container"], [data-test="job-description"]');
  if (seeded) {
    let node: Element | null = seeded;
    let found: Element = seeded;
    for (let i = 0; i < 8 && node && node !== document.body; i += 1) {
      if (includesResultsHeading(node)) break;
      if (titleIn(node)) found = node;
      node = node.parentElement;
    }
    return found;
  }

  const applyControls = Array.from(document.querySelectorAll('button, a')).filter((el) =>
    /^quick apply$/i.test((el.textContent || '').trim())
  );
  for (const control of applyControls) {
    let node: Element | null = control.parentElement;
    for (let i = 0; i < 10 && node && node !== document.body; i += 1) {
      const text = (node as HTMLElement).innerText || '';
      if (/job description/i.test(text) && titleIn(node) && !includesResultsHeading(node)) return node;
      node = node.parentElement;
    }
  }
  return null;
}

function organizationFrom(pane: Element): string | null {
  const seeMore = Array.from(pane.querySelectorAll('a')).find((anchor) => /see more jobs at/i.test(anchor.textContent || ''));
  if (seeMore) {
    const name = clean((seeMore.textContent || '').replace(/see more jobs at/i, ''));
    if (rejectShareText(name)) return name;
  }
  const companyLink = Array.from(pane.querySelectorAll('a[href]')).find((anchor) => {
    const href = (anchor as HTMLAnchorElement).href;
    const label = visibleText(anchor);
    return /\/co\/|\/c\/|company/i.test(href) && !!rejectShareText(label) && !/see more jobs at/i.test(label || '');
  });
  return rejectShareText(visibleText(companyLink || null))
    || rejectShareText(visibleText(pane.querySelector('a[aria-label]')));
}

function descriptionFrom(pane: Element): string | null {
  const text = (pane as HTMLElement).innerText || '';
  const index = text.search(/\bjob description\b/i);
  const sliced = (index >= 0 ? text.slice(index) : text).trim();
  if (!sliced || isSearchResultsHeading(sliced.split('\n')[0] || '')) return null;
  return sliced;
}

function jobLink(pane: Element): string | null {
  const link = Array.from(pane.querySelectorAll('a[href]')).find((anchor) => {
    const href = (anchor as HTMLAnchorElement).href;
    return /ziprecruiter\.com\/.+(?:\/jobs\/|\/job\/)/.test(href) && !/jobs-search/.test(href);
  }) as HTMLAnchorElement | undefined;
  if (link) return link.href.split('?')[0];
  if (/\/jobs\/|\/job\//.test(location.pathname) && !/jobs-search/.test(location.pathname)) {
    return location.href.split('?')[0];
  }
  return null;
}

export function extractZipRecruiterJob(): PartialJob {
  const pane = findDetailPane();
  if (!pane) {
    return { source: 'ziprecruiter', job_site: 'ZipRecruiter' };
  }
  const text = (pane as HTMLElement).innerText || '';
  const title = titleIn(pane);
  return {
    position: title && !isSearchResultsHeading(title) ? title : null,
    organization: organizationFrom(pane),
    location: clean(text.match(/[A-Z][\w .'-]+,\s?[A-Z]{2}\b/)?.[0]),
    salary: text.match(RX.salary)?.[0] || null,
    type: text.match(RX.jobType)?.[1] || null,
    environment: normalizeEnvironment(text.match(RX.env)?.[1] || null),
    ageOfPosting: text.match(RX.age)?.[0] || null,
    date_posted: text.match(RX.age)?.[0] || null,
    description: descriptionFrom(pane),
    link: jobLink(pane),
    source: 'ziprecruiter',
    job_site: 'ZipRecruiter',
  };
}
