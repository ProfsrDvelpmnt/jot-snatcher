// Single Supabase session owner for the extension service worker.
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://aeoyohqyhawxulisdvqj.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlb3lvaHF5aGF3eHVsaXNkdnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTQ1MzQsImV4cCI6MjA2NzU3MDUzNH0.ATT386zUTNcUN9AbBZIvgk-3LPBD25Ygk_tv-meOHEU';
export const SESSION_KEY = 'sb-aeoyohqyhawxulisdvqj-auth-token';

export const TIER_LIMITS: Record<string, number> = {
  free: 5,
  basic: 20,
  professional: 150,
  premium: 150,
  executive: 400,
};

export interface UsageSnapshot {
  currentMonth: number;
  monthlyLimit: number;
  remainingUses: number;
  userId: string;
  tier: string;
  lastUpdated: string;
  currentUsage: number;
}

export interface AuthSnapshot {
  isAuthenticated: boolean;
  requiresLogin: boolean;
  sessionExpired: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  subscriptionInfo?: {
    tier: string;
    monthlyLimit: number;
    remainingUses: number;
    currentUsage: number;
    isActive: boolean;
  };
  usageData: UsageSnapshot | null;
  lastUpdated: number;
}

const chromeStorage = {
  getItem: (key: string) =>
    new Promise<string | null>((resolve) => {
      chrome.storage.local.get([key], (result) => resolve(result[key] ?? null));
    }),
  setItem: (key: string, value: string) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => resolve());
    }),
  removeItem: (key: string) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.remove([key], () => resolve());
    }),
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chromeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export function normalizeSession(raw: unknown): { access_token: string; refresh_token: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const candidates = [record.currentSession, record.session, record];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') continue;
    const session = candidate as Record<string, unknown>;
    if (typeof session.access_token === 'string' && typeof session.refresh_token === 'string') {
      return { access_token: session.access_token, refresh_token: session.refresh_token };
    }
  }
  return null;
}

async function migrateWrappedSession(): Promise<void> {
  const stored = await chromeStorage.getItem(SESSION_KEY);
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed?.access_token && parsed?.refresh_token && parsed?.user) return;
    const normalized = normalizeSession(parsed);
    if (normalized) {
      await supabase.auth.setSession(normalized);
    }
  } catch {
    await chromeStorage.removeItem(SESSION_KEY);
  }
}

export async function adoptWebappSession(): Promise<boolean> {
  const tabs = await chrome.tabs.query({ url: 'https://app.sp-jot.com/*' });
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SYNC_AUTH_TO_EXTENSION' });
      const normalized = normalizeSession(response?.authData);
      if (normalized) {
        const { error } = await supabase.auth.setSession(normalized);
        if (!error) return true;
      }
    } catch {
      // Tab may not have the content script yet.
    }
  }
  return false;
}

export async function getValidSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (!error && data.session?.access_token && data.session.user) {
    return data.session;
  }
  const adopted = await adoptWebappSession();
  if (!adopted) return null;
  const refreshed = await supabase.auth.getSession();
  return refreshed.data.session ?? null;
}

function canonicalPlan(plan: string | null | undefined): keyof typeof TIER_LIMITS | null {
  const key = (plan || '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (!key) return null;
  if (/\b(executive|enterprise)\b/.test(key)) return 'executive';
  if (/\bpremium\b/.test(key)) return 'premium';
  if (/\b(professional|pro)\b/.test(key)) return 'professional';
  if (/\bbasic\b/.test(key)) return 'basic';
  if (/\bfree\b/.test(key)) return 'free';
  return null;
}

function planCandidates(row: Record<string, unknown> | null | undefined): string[] {
  if (!row) return [];
  return ['subscription_tier', 'tier', 'plan', 'plan_name', 'product', 'product_name', 'name']
    .map((key) => row[key])
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

function bestPlan(candidates: Array<string | null | undefined>): { tier: string; monthlyLimit: number } {
  let best: { tier: string; monthlyLimit: number } | null = null;
  for (const candidate of candidates) {
    const key = canonicalPlan(candidate);
    if (!key) continue;
    const monthlyLimit = TIER_LIMITS[key];
    if (!best || monthlyLimit > best.monthlyLimit) {
      best = { tier: key === 'premium' ? 'professional' : key, monthlyLimit };
    }
  }
  return best || { tier: 'free', monthlyLimit: TIER_LIMITS.free };
}

export async function loadAuthSnapshot(session: Session | null, sessionExpired = false): Promise<AuthSnapshot> {
  if (!session?.user) {
    return {
      isAuthenticated: false,
      requiresLogin: true,
      sessionExpired,
      usageData: null,
      lastUpdated: Date.now(),
    };
  }

  const userId = session.user.id;
  const month = new Date().toISOString().slice(0, 7);

  const [profileRes, subscriptionRes, usageRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('extension_usage').select('usage_count').eq('user_id', userId).eq('usage_month', month).maybeSingle(),
  ]);

  const subscriptions = (subscriptionRes.data || []).filter((row) => {
    const status = String((row as { status?: string }).status || 'active');
    return !/cancel|incomplete|expired|unpaid|past_due|inactive/i.test(status);
  });
  const { tier, monthlyLimit } = bestPlan([
    ...planCandidates(profileRes.data as Record<string, unknown> | null),
    ...subscriptions.flatMap((row) => planCandidates(row as Record<string, unknown>)),
  ]);
  const currentUsage = usageRes.data?.usage_count || 0;
  const remainingUses = Math.max(0, monthlyLimit - currentUsage);
  const usageData: UsageSnapshot = {
    currentMonth: currentUsage,
    currentUsage,
    monthlyLimit,
    remainingUses,
    userId,
    tier,
    lastUpdated: new Date().toISOString(),
  };

  return {
    isAuthenticated: true,
    requiresLogin: false,
    sessionExpired: false,
    userId,
    userName: session.user.user_metadata?.first_name || session.user.email || undefined,
    userEmail: session.user.email || undefined,
    subscriptionInfo: {
      tier,
      monthlyLimit,
      remainingUses,
      currentUsage,
      isActive: subscriptions.length > 0 || tier === 'free',
    },
    usageData,
    lastUpdated: Date.now(),
  };
}

export async function initSession(): Promise<AuthSnapshot> {
  await migrateWrappedSession();
  let session = (await supabase.auth.getSession()).data.session;
  if (!session) {
    await adoptWebappSession();
    session = (await supabase.auth.getSession()).data.session;
  }
  return loadAuthSnapshot(session, false);
}

export function htmlToPlainText(value: string | null | undefined): string | null {
  if (!value) return null;
  let text = value;
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  text = text.replace(/<\/(div|p|h1|h2|h3|h4|h5|h6|li|tr)>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
  return text || null;
}
