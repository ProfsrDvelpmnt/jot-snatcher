import { PartialJob } from '@/extract/merge';
import { visibleText } from '@/extract/text';

export function greenhouseJob(url = location.href): { company: string | null; id: string | null } {
  const match = new URL(url).pathname.match(/^\/([^/]+)\/jobs\/(\d+)/);
  if (!match) return { company: null, id: null };
  const slug = match[1];
  const company = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return { company, id: match[2] };
}

export function isGreenhouseJobPage(url = location.href): boolean {
  return new URL(url).hostname.endsWith('greenhouse.io') && /\/jobs\/\d+/.test(new URL(url).pathname);
}

export function extractGreenhouseJob(): PartialJob {
  const ids = greenhouseJob();
  const main = document.querySelector('main') || document.body;
  return {
    jobId: ids.id,
    position: visibleText(main.querySelector('h1')),
    organization: ids.company,
    description: (main as HTMLElement).innerText || null,
    link: location.href.split('?')[0],
    source: 'greenhouse',
    job_site: 'Greenhouse',
  };
}
