import { PartialJob } from '@/extract/merge';
import { normalizeEnvironment, visibleText } from '@/extract/text';

const WORKPLACE = /^(remote|hybrid|on-?\s*site|onsite|in-?\s*person|in-?\s*office|field)$/i;

function workplace(root: ParentNode): string | null {
  const title = root.querySelector('h1');
  const nodes = Array.from(root.querySelectorAll('span, div, a, li'));
  const candidates = title
    ? nodes.filter((el) => (title.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
    : nodes;
  const badge = candidates.find((el) => {
    if (el.children.length > 0) return false;
    const text = (el.textContent || '').trim();
    return text.length < 24 && WORKPLACE.test(text);
  });
  return badge ? (badge.textContent || '').trim() : null;
}

export function isHiringCafeJobPage(url = location.href): boolean {
  const parsed = new URL(url);
  return /(^|\.)hiringcafe\.com$/.test(parsed.hostname) || parsed.hostname.endsWith('hiring.cafe');
}

export function hiringCafeJobId(url = location.href): string | null {
  const match = new URL(url).pathname.match(/\/job\/([^/?#]+)/);
  if (!match) return null;
  const parts = match[1].split('-');
  return parts[parts.length - 1] || null;
}

function countValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value);
  return null;
}

function signalsFromPage(): string | null {
  const parts: string[] = [];
  const add = (count: number | null, singular: string, plural: string) => {
    if (count == null) return;
    parts.push(`${count} ${count === 1 ? singular : plural}`);
  };

  try {
    const raw = document.querySelector('#__NEXT_DATA__')?.textContent;
    const job = raw ? JSON.parse(raw)?.props?.pageProps?.job : null;
    const info = job?.job_information;
    const marker = [job?.id, job?.objectID, job?.requisition_id].map((value: unknown) => String(value || '')).join(' ');
    const wanted = hiringCafeJobId();
    const sameJob = !wanted || marker.includes(wanted);
    if (info && sameJob) {
      add(countValue(info.num_views), 'view', 'views');
      add(countValue(info.num_saves), 'save', 'saves');
      add(countValue(info.num_applies), 'applicant', 'applicants');
    }
  } catch {
    // The page can render before its data script is readable.
  }

  if (parts.length > 0) return parts.join(' · ');

  const visible = Array.from(document.querySelectorAll('[data-testid^="signal-count"], [data-testid="signal-strip"]'))
    .map((el) => (el as HTMLElement).innerText || '')
    .join(' ');
  const views = visible.match(/(\d[\d,]*)\s+views?\b/i);
  const saves = visible.match(/(\d[\d,]*)\s+saves?\b/i);
  const applies = visible.match(/(\d[\d,]*)\s+(?:applicants?|applications?)\b/i);
  add(views ? Number(views[1].replace(/,/g, '')) : null, 'view', 'views');
  add(saves ? Number(saves[1].replace(/,/g, '')) : null, 'save', 'saves');
  add(applies ? Number(applies[1].replace(/,/g, '')) : null, 'applicant', 'applicants');
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function extractHiringCafeJob(): PartialJob {
  const main = document.querySelector('main') || document.body;
  const text = (main as HTMLElement).innerText || '';
  const title = visibleText(main.querySelector('h1'));
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const company = lines.find((line) => line !== title && line.length > 1 && line.length < 80 && !/apply|save|share/i.test(line)) || null;
  return {
    jobId: hiringCafeJobId(),
    position: title,
    organization: company,
    environment: normalizeEnvironment(workplace(main)),
    numApplicants: signalsFromPage(),
    description: text,
    link: location.href.split('?')[0],
    source: 'hiring-cafe',
    job_site: 'Hiring Cafe',
  };
}
