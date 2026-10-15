export type Strategy =
  | { type: 'css'; selector: string }
  | { type: 'linkHref'; pattern: string }
  | { type: 'labelText'; label: string }
  | { type: 'regexOnText'; pattern: string; flags?: string }
  | { type: 'attr'; selector: string; attr: string };

export interface SiteExtractorConfig {
  urlPatterns: string[];
  detailPaneHint?: Strategy[];
  fields: Record<string, Strategy[]>;
}

const STRATEGY_TYPES = new Set(['css', 'linkHref', 'labelText', 'regexOnText', 'attr']);

function isStrategy(value: unknown): value is Strategy {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: string }).type;
  if (!type || !STRATEGY_TYPES.has(type)) return false;
  const record = value as Record<string, unknown>;
  if (type === 'css' || type === 'linkHref' || type === 'labelText') return typeof record.selector === 'string' || typeof record.pattern === 'string' || typeof record.label === 'string';
  if (type === 'regexOnText') return typeof record.pattern === 'string';
  if (type === 'attr') return typeof record.selector === 'string' && typeof record.attr === 'string';
  return false;
}

export function parseExtractorConfig(value: unknown): SiteExtractorConfig | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.urlPatterns) || !record.urlPatterns.every((item) => typeof item === 'string')) return null;
  if (!record.fields || typeof record.fields !== 'object') return null;
  const fields: Record<string, Strategy[]> = {};
  for (const [key, list] of Object.entries(record.fields as Record<string, unknown>)) {
    if (!Array.isArray(list) || !list.every(isStrategy)) return null;
    fields[key] = list;
  }
  let detailPaneHint: Strategy[] | undefined;
  if (record.detailPaneHint != null) {
    if (!Array.isArray(record.detailPaneHint) || !record.detailPaneHint.every(isStrategy)) return null;
    detailPaneHint = record.detailPaneHint;
  }
  return { urlPatterns: record.urlPatterns as string[], detailPaneHint, fields };
}
