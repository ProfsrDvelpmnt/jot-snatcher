import { SiteExtractorConfig } from './configSchema';
import { clean, rejectShareText } from './text';

export function applyStrategies(config: SiteExtractorConfig | null, url: string, root: ParentNode = document): Record<string, string | null> {
  if (!config) return {};
  const matches = config.urlPatterns.length === 0 || config.urlPatterns.some((pattern) => url.includes(pattern));
  if (!matches) return {};
  const result: Record<string, string | null> = {};
  for (const [field, strategies] of Object.entries(config.fields)) {
    for (const strategy of strategies) {
      let value = runStrategy(strategy, root);
      if (field === 'organization') value = rejectShareText(value);
      if (value) {
        result[field] = clean(value);
        break;
      }
    }
  }
  return result;
}

function runStrategy(strategy: SiteExtractorConfig['fields'][string][number], root: ParentNode): string | null {
  try {
    if (strategy.type === 'css') {
      return root.querySelector(strategy.selector)?.textContent || null;
    }
    if (strategy.type === 'linkHref') {
      const pattern = strategy.pattern.replace(/"/g, '');
      const link = root.querySelector(`a[href*="${pattern}"]`);
      return link?.textContent || null;
    }
    if (strategy.type === 'labelText') {
      const labels = Array.from(root.querySelectorAll('dt, th, span, div, p, h2, h3'));
      const label = labels.find((el) => (el.textContent || '').trim().toLowerCase() === strategy.label.toLowerCase());
      const next = label?.nextElementSibling?.textContent || '';
      return next || null;
    }
    if (strategy.type === 'regexOnText') {
      const text = (root as HTMLElement).innerText || root.textContent || '';
      return text.match(new RegExp(strategy.pattern, strategy.flags || ''))?.[0] || null;
    }
    if (strategy.type === 'attr') {
      return root.querySelector(strategy.selector)?.getAttribute(strategy.attr) || null;
    }
  } catch {
    return null;
  }
  return null;
}
