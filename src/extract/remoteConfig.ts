import defaults from '@/config/extractor-defaults.json';
import { parseExtractorConfig, type SiteExtractorConfig } from './configSchema';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/background/session';

export type { SiteExtractorConfig };

const CACHE_KEY = 'extractor_configs_cache';
const TTL_MS = 6 * 60 * 60 * 1000;

interface CacheShape {
  fetchedAt: number;
  configs: Record<string, SiteExtractorConfig>;
}

function bundled(): Record<string, SiteExtractorConfig> {
  const configs: Record<string, SiteExtractorConfig> = {};
  for (const [siteKey, config] of Object.entries(defaults)) {
    const parsed = parseExtractorConfig(config);
    if (parsed) configs[siteKey] = parsed;
  }
  return configs;
}

async function readCache(): Promise<CacheShape | null> {
  const stored = await chrome.storage.local.get(CACHE_KEY);
  return stored[CACHE_KEY] || null;
}

async function fetchRemote(): Promise<Record<string, SiteExtractorConfig> | null> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/extractor_configs?select=site_key,config,enabled&enabled=eq.true`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!response.ok) return null;
  const rows = await response.json() as { site_key: string; config: unknown }[];
  const configs = bundled();
  for (const row of rows) {
    const parsed = parseExtractorConfig(row.config);
    if (parsed) configs[row.site_key] = parsed;
  }
  await chrome.storage.local.set({ [CACHE_KEY]: { fetchedAt: Date.now(), configs } satisfies CacheShape });
  return configs;
}

export async function getExtractorConfig(siteKey: string): Promise<SiteExtractorConfig | null> {
  const cache = await readCache();
  const fallback = bundled()[siteKey] || null;
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache.configs[siteKey] || fallback;
  }
  if (cache) {
    fetchRemote().catch(() => undefined);
    return cache.configs[siteKey] || fallback;
  }
  try {
    const fresh = await fetchRemote();
    return fresh?.[siteKey] || fallback;
  } catch {
    return fallback;
  }
}

