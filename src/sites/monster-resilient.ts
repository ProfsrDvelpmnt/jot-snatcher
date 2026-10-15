import { PartialJob } from '@/extract/merge';
import { blockText, clean, isSearchResultsHeading, normalizeEnvironment, visibleText } from '@/extract/text';

const GENERIC_TITLE = /^(jobs?|description|skills|about company|numbers & facts|search results)$/i;

export function isMonsterJobPage(url = location.href): boolean {
  const parsed = new URL(url);
  return parsed.hostname.endsWith('monster.com') && (parsed.pathname.includes('/job') || parsed.pathname.includes('/jobs'));
}

function findMonsterPane(): Element | null {
  return document.querySelector('[data-testid="svx-job-view-wrapper"]')
    || document.querySelector('[data-testid^="svx-job-view-header"]');
}

function jobTitle(pane: Element): string | null {
  const title = visibleText(pane.querySelector('[data-testid="jobTitle"]'));
  if (!title || GENERIC_TITLE.test(title) || isSearchResultsHeading(title)) return null;
  return title;
}

function selectedJobLink(): { id: string | null; url: string | null } {
  const pathMatch = location.pathname.match(/\/job-openings\/([^/?#]+)/);
  if (pathMatch) {
    return { id: pathMatch[1], url: `${location.origin}${location.pathname}` };
  }
  const selected = document.querySelector('[data-testid="JobCardButton"][aria-selected="true"]');
  const card = selected?.closest('[data-testid="JobCard"]') || selected;
  const href = (card?.querySelector('a[href*="/job-openings/"]') as HTMLAnchorElement | null)?.href || null;
  const jobId = selected?.getAttribute('data-job-id') || null;
  if (!href) return { id: jobId, url: null };
  try {
    const parsed = new URL(href);
    return { id: jobId || parsed.pathname.split('--').pop() || null, url: `${parsed.origin}${parsed.pathname}` };
  } catch {
    return { id: jobId, url: null };
  }
}

function fieldValue(pane: Element, testId: string): string | null {
  return clean(pane.querySelector(`[data-testid="${testId}"]`)?.textContent || null);
}

function labeledValue(pane: Element, labelText: string): string | null {
  const nodes = Array.from(pane.querySelectorAll('[data-testid$="-label"], dt, th, span, div, p, li, h3, h4'));
  const label = nodes.find((el) => (el.textContent || '').trim().toLowerCase() === labelText.toLowerCase());
  if (!label) return null;
  const sibling = clean(label.nextElementSibling?.textContent || null);
  if (sibling && sibling.toLowerCase() !== labelText.toLowerCase()) return sibling;
  const parentText = clean(label.parentElement?.textContent || null);
  if (!parentText || parentText.length > 80) return null;
  const stripped = clean(parentText.replace(new RegExp(`^${labelText}\\s*:?\\s*`, 'i'), ''));
  return stripped && stripped.toLowerCase() !== labelText.toLowerCase() ? stripped : null;
}

function workArrangement(pane: Element): string | null {
  const direct = fieldValue(pane, 'svx-jobview-work-arrangement-value')
    || fieldValue(pane, 'jobDetailRemoteFlag');
  if (direct) return direct;

  const labeled = labeledValue(pane, 'Work Arrangement');
  if (labeled) return labeled;

  const header = pane.querySelector('[data-testid^="svx-job-view-header"]') || pane;
  const tags = Array.from(header.querySelectorAll('[data-testid="tag"], [data-testid="jobDetailRemoteFlag"]'));
  for (const tag of tags) {
    const text = (tag.textContent || '').trim();
    if (text.length < 40 && normalizeEnvironment(text)) return text;
  }

  const line = ((pane as HTMLElement).innerText || '')
    .split('\n')
    .map((item) => item.trim())
    .find((item) => /^work arrangement\s*:?\s+\S+/i.test(item));
  return line ? clean(line.replace(/^work arrangement\s*:?\s*/i, '')) : null;
}

export function extractMonsterJob(): PartialJob {
  const pane = findMonsterPane();
  if (!pane) return { source: 'monster', job_site: 'Monster' };
  const jobLink = selectedJobLink();
  const description = blockText(pane.querySelector('[data-testid="svx-description-container-inner"]'));
  const location = fieldValue(pane, 'svx-jobview-location-value') || fieldValue(pane, 'jobDetailLocation');
  return {
    jobId: jobLink.id,
    position: jobTitle(pane),
    organization: fieldValue(pane, 'company'),
    location,
    salary: fieldValue(pane, 'svx-jobview-salary-value'),
    type: fieldValue(pane, 'svx-jobview-job-type-value'),
    environment: normalizeEnvironment(workArrangement(pane)),
    ageOfPosting: fieldValue(pane, 'jobDetailDateRecency'),
    date_posted: fieldValue(pane, 'jobDetailDateRecency'),
    description,
    link: jobLink.url,
    source: 'monster',
    job_site: 'Monster',
  };
}
