export function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\s]*[•·|–—-]+\s*$/g, '')
    .trim();
  return text || null;
}

const PLACEHOLDERS = /^(manual entry required|not specified|unknown|invalid date|n\/a|none)$/i;

export function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== 'string') return false;
  const text = clean(value);
  return !text || PLACEHOLDERS.test(text);
}

/** Search-page headings, including "Jobs" and "… Jobs in United States". */
export function isSearchResultsHeading(value: string | null | undefined): boolean {
  const text = clean(value);
  if (!text || text.length > 160) return false;
  if (/^jobs?$/i.test(text)) return true;
  return /\bjobs?\s+in\b/i.test(text) || /\d[\d,]*\s+.{0,120}\bjobs?\b/i.test(text);
}

export function visibleText(el: Element | null): string | null {
  if (!el) return null;
  return clean((el as HTMLElement).innerText ?? el.textContent);
}

/** Visible text that keeps paragraph and line breaks. */
export function blockText(el: Element | null): string | null {
  if (!el) return null;
  const text = ((el as HTMLElement).innerText || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text || null;
}

export function stripHtml(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    return value.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() || null;
  }
  const withBreaks = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  const text = doc.body.innerText || doc.body.textContent || '';
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() || null;
}

export function decodeEntities(value: string): string {
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return doc.documentElement.textContent || value;
}

const SHARE_OR_APPLY = /\b(share|facebook|twitter|linkedin|email this|apply now|apply)\b/i;

export function rejectShareText(value: string | null): string | null {
  if (!value || SHARE_OR_APPLY.test(value)) return null;
  return value;
}

export function parseRelativeDate(value: string | null): string | null {
  if (!value) return null;
  const text = value.trim();
  if (/invalid date/i.test(text)) return null;
  const absolute = Date.parse(text);
  if (!Number.isNaN(absolute) && /\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)) {
    return new Date(absolute).toISOString();
  }
  const relative = text.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/i);
  if (relative) {
    const amount = parseInt(relative[1], 10);
    const unit = relative[2].toLowerCase();
    const date = new Date();
    const multipliers: Record<string, number> = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    };
    date.setTime(date.getTime() - amount * multipliers[unit]);
    return date.toISOString();
  }
  if (/\b(just now|today|yesterday)\b/i.test(text)) {
    const date = new Date();
    if (/yesterday/i.test(text)) date.setDate(date.getDate() - 1);
    return date.toISOString();
  }
  return null;
}

export function normalizeJobType(value: string | null): string | null {
  if (!value) return null;
  const map: Record<string, string> = {
    'full-time': 'Full Time',
    'full time': 'Full Time',
    full_time: 'Full Time',
    'part-time': 'Part Time',
    'part time': 'Part Time',
    part_time: 'Part Time',
    contract: 'Contract',
    temporary: 'Seasonal',
    internship: 'Contract',
    volunteer: 'Contract',
  };
  return map[value.toLowerCase()] || value;
}

export function normalizeEnvironment(value: string | null): string | null {
  if (!value) return null;
  const text = value.trim();
  if (/^field$/i.test(text)) return 'In-Person';
  if (/\bhybrid\b/i.test(text)) return 'Hybrid';
  if (/\bon-?\s*site\b|\bonsite\b|\bin-?\s*person\b|\bin-?\s*office\b/i.test(text)) return 'In-Person';
  if (/\bremote\b|\bwork from home\b|\bwfh\b/i.test(text)) return 'Remote';
  return null;
}

const CLEARANCE_RANK = ['Unclassified', 'Classified', 'Secret', 'Top Secret', 'TS/SCI'] as const;

export type ClearanceLevel = (typeof CLEARANCE_RANK)[number];

/** Map a clearance phrase to one of the tracker choices. "Secret or Top Secret" uses the lower level. */
export function normalizeClearance(value: string | null | undefined): ClearanceLevel | null {
  if (!value) return null;
  const text = value.replace(/top[-\s]*secret/gi, 'top secret').toLowerCase();
  const found: ClearanceLevel[] = [];
  if (/t\s*s\s*\/\s*sci|\bts\/sci\b|\btsci\b|top secret\s*\/\s*sci|top secret\s+sci/.test(text)) found.push('TS/SCI');
  if (/top secret/.test(text)) found.push('Top Secret');
  if (/\bsecret\b/.test(text.replace(/top secret/g, ''))) found.push('Secret');
  if (/unclassified/.test(text)) found.push('Unclassified');
  else if (/\bclassified\b/.test(text.replace(/unclassified/g, ''))) found.push('Classified');
  if (!found.length) {
    if (/\b(no clearance|clearance not required|without clearance|none required|not required)\b/.test(text)) return 'Unclassified';
    return null;
  }
  const pick = (preferLow: boolean) => found.reduce((chosen, item) => {
    const better = preferLow
      ? CLEARANCE_RANK.indexOf(item) < CLEARANCE_RANK.indexOf(chosen)
      : CLEARANCE_RANK.indexOf(item) > CLEARANCE_RANK.indexOf(chosen);
    return better ? item : chosen;
  });
  return pick(found.length > 1 && /\bor\b/.test(text));
}

export interface PostingFacts {
  location: string | null;
  environment: string | null;
  clearance: ClearanceLevel | null;
}

/** Read workplace and clearance from labeled lines in the posting, not from site badges. */
export function factsFromPosting(value: string | null | undefined): PostingFacts {
  const empty: PostingFacts = { location: null, environment: null, clearance: null };
  if (!value) return empty;
  const text = value.replace(/\u00a0/g, ' ');
  const locationLine = text.match(/(?:^|\n)\s*(?:location|work location)\s*:\s*([^\n]{1,180})/i)?.[1] || null;
  const arrangementLine = text.match(/(?:^|\n)\s*(?:work arrangement|workplace(?: type)?|work environment|work setting)\s*:\s*([^\n]{1,80})/i)?.[1] || null;
  const clearanceLine = text.match(/(?:^|\n)\s*clearance(?:\s+required)?\s*:\s*([^\n]{1,120})/i)?.[1]
    || text.match(/\b((?:active\s+)?(?:ts\s*\/\s*sci|top[-\s]*secret|secret|unclassified|classified)(?:\s+or\s+(?:top[-\s]*)?secret)?(?:\s+clearance)?)\b/i)?.[1]
    || null;
  const city = locationLine ? clean(locationLine.replace(/\([^)]*\)/g, '')) : null;
  const location = city && !/^(remote|hybrid|on-?\s*site|onsite|in-?\s*person|field)$/i.test(city) ? city : null;
  return {
    location,
    environment: normalizeEnvironment(arrangementLine) || normalizeEnvironment(locationLine),
    clearance: normalizeClearance(clearanceLine),
  };
}

/** A Hybrid or In-Person statement in the posting outranks a site Remote badge. */
export function preferPostingEnvironment(schemaEnvironment: string | null, postingEnvironment: string | null): string | null {
  if (postingEnvironment === 'Hybrid' || postingEnvironment === 'In-Person') return postingEnvironment;
  return postingEnvironment || schemaEnvironment;
}

export function salaryTypeFromText(value: string | null): 'annual' | 'hourly' | 'monthly' | 'contract' {
  if (!value) return 'annual';
  if (/\/\s?(hr|hour)|hourly/i.test(value)) return 'hourly';
  if (/\/\s?(mo|month)|monthly/i.test(value)) return 'monthly';
  if (/contract/i.test(value)) return 'contract';
  return 'annual';
}
