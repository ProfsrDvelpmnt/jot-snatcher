import { getExtractorConfig } from '@/extract/remoteConfig';
import {
  getValidSession,
  htmlToPlainText,
  initSession,
  loadAuthSnapshot,
  normalizeSession,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  supabase,
  type AuthSnapshot,
} from './session';

let authSnapshot: AuthSnapshot = {
  isAuthenticated: false,
  requiresLogin: true,
  sessionExpired: false,
  usageData: null,
  lastUpdated: 0,
};

async function refreshAuth(forceUsage = false): Promise<AuthSnapshot> {
  const session = await getValidSession();
  const expired = !session && authSnapshot.isAuthenticated;
  if (!forceUsage && authSnapshot.isAuthenticated === !!session && authSnapshot.usageData && session) {
    authSnapshot = { ...authSnapshot, sessionExpired: false, lastUpdated: Date.now() };
    return authSnapshot;
  }
  authSnapshot = await loadAuthSnapshot(session, expired);
  return authSnapshot;
}

async function broadcastAuth(): Promise<void> {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(async (tab) => {
    if (!tab.id) return;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'AUTH_STATE_UPDATE', authState: authSnapshot });
    } catch {
      // Tabs without the content script ignore this.
    }
  }));
}

async function ensurePageScript(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/i.test(tab.url)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] });
    } catch {
      // The page did not allow the floating panel.
    }
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ theme: 'light' });
});

initSession().then(async (snapshot) => {
  authSnapshot = snapshot;
  await broadcastAuth();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const respond = (payload: unknown) => {
    try { sendResponse(payload); } catch { /* channel closed */ }
  };

  switch (message.type) {
    case 'GET_AUTH_STATE':
      respond({ success: true, data: authSnapshot });
      return false;

    case 'CHECK_CONNECTION':
    case 'GET_USAGE_DATA':
      (async () => {
        if (message.type === 'CHECK_CONNECTION') void ensurePageScript();
        const snapshot = await refreshAuth(true);
        authSnapshot = snapshot;
        if (message.type === 'GET_USAGE_DATA') {
          if (!snapshot.isAuthenticated) {
            respond({ success: false, error: snapshot.sessionExpired ? 'Your session expired. Sign in again.' : 'User not authenticated', sessionExpired: snapshot.sessionExpired });
            return;
          }
          respond({ success: true, data: snapshot.usageData });
          return;
        }
        respond({
          success: true,
          data: {
            connected: snapshot.isAuthenticated,
            usageData: snapshot.usageData,
            isAuthenticated: snapshot.isAuthenticated,
            requiresLogin: snapshot.requiresLogin,
            sessionExpired: snapshot.sessionExpired,
            userId: snapshot.userId,
            userName: snapshot.userName,
            userEmail: snapshot.userEmail,
            subscriptionInfo: snapshot.subscriptionInfo,
            error: snapshot.sessionExpired ? 'Your session expired. Sign in again.' : null,
          },
        });
      })();
      return true;

    case 'SIGN_IN':
      (async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: message.email,
          password: message.password,
        });
        if (error || !data.session) {
          respond({ success: false, error: error?.message || 'Login failed' });
          return;
        }
        authSnapshot = await loadAuthSnapshot(data.session, false);
        await broadcastAuth();
        respond({ success: true, data: authSnapshot });
      })();
      return true;

    case 'SIGN_OUT':
      (async () => {
        await supabase.auth.signOut();
        authSnapshot = await loadAuthSnapshot(null, false);
        await broadcastAuth();
        respond({ success: true });
      })();
      return true;

    case 'SYNC_WEBAPP_AUTH':
    case 'WEBAPP_AUTH_RECEIVED':
      (async () => {
        const normalized = normalizeSession(message.authData?.session || message.authData);
        if (!normalized) {
          respond({ success: false, error: 'No auth data provided' });
          return;
        }
        const { error } = await supabase.auth.setSession(normalized);
        if (error) {
          respond({ success: false, error: error.message });
          return;
        }
        authSnapshot = await refreshAuth(true);
        await broadcastAuth();
        respond({ success: true });
      })();
      return true;

    case 'SUBMIT_JOB':
      (async () => {
        const session = await getValidSession();
        if (!session) {
          authSnapshot = await loadAuthSnapshot(null, true);
          await broadcastAuth();
          respond({ success: false, error: 'Your session expired. Sign in again.', sessionExpired: true });
          return;
        }
        authSnapshot = await loadAuthSnapshot(session, false);
        const token = session.access_token;
        const job = message.jobData || {};
        const month = new Date().toISOString().slice(0, 7);
        const description = htmlToPlainText(job.description);
        const headers = {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        };

        const submission = await fetch(`${SUPABASE_URL}/rest/v1/extension_job_submissions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: session.user.id,
            organization: job.organization || 'Unknown Company',
            position: job.position || 'Unknown Position',
            location: job.location || null,
            salary: job.salary || null,
            job_type: job.type || null,
            environment: job.environment || null,
            job_url: job.link || null,
            extension_version: chrome.runtime.getManifest().version,
            submission_source: 'chrome_extension',
            usage_month: month,
          }),
        });

        if (!submission.ok) {
          const errorText = await submission.text();
          respond({ success: false, error: `Failed to submit job: ${submission.status} ${errorText}` });
          return;
        }

        const normalizedType = ['Full Time', 'Part Time', 'Contract', 'Seasonal'].includes(job.type) ? job.type : 'Full Time';
        const environmentText = job.environment || '';
        const normalizedEnv = /\bhybrid\b/i.test(environmentText)
          ? 'Hybrid'
          : /\bon-?\s*site\b|\bonsite\b|\bin-?\s*person\b|\bin-?\s*office\b|^field$/i.test(environmentText)
            ? 'In-Person'
            : /\bremote\b|\bwork from home\b|\bwfh\b/i.test(environmentText)
              ? 'Remote'
              : 'Remote';
        const clearanceOptions = ['Unclassified', 'Classified', 'Secret', 'Top Secret', 'TS/SCI'];
        const clearance = clearanceOptions.includes(job.clearance) ? job.clearance : null;

        await fetch(`${SUPABASE_URL}/rest/v1/jobs`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            user_id: session.user.id,
            position: job.position || 'Unknown Position',
            organization: job.organization || 'Unknown Company',
            location: job.location || null,
            link: job.link || null,
            salary: job.salary || null,
            description,
            type: normalizedType,
            environment: normalizedEnv,
            clearance,
            stage: 'Saved',
            job_source: 'extension',
            source: job.source || 'chrome_extension',
            date_posted: job.date_posted || null,
            date_saved: job.date_saved || new Date().toISOString(),
          }),
        });

        await fetch(`${SUPABASE_URL}/functions/v1/add-job-from-extension`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            organization: job.organization || 'Unknown Company',
            position: job.position || 'Unknown Position',
            location: job.location || null,
            salary: job.salary || null,
            type: normalizedType,
            environment: normalizedEnv,
            link: job.link || null,
            description,
            source: 'extension',
            user_id: session.user.id,
          }),
        });

        authSnapshot = await loadAuthSnapshot(session, false);
        await broadcastAuth();
        respond({ success: true });
      })();
      return true;

    case 'EXTRACT_JOB_DATA':
      (async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          respond({ success: false, error: 'No active tab found' });
          return;
        }
        const ask = async () => chrome.tabs.sendMessage(tab.id!, { type: 'EXTRACT_JOB_DATA', generic: message.generic });
        try {
          respond(await ask());
        } catch {
          try {
            await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content-script.js'] });
            respond(await ask());
          } catch (error) {
            respond({ success: false, error: error instanceof Error ? error.message : 'Failed to extract job data' });
          }
        }
      })();
      return true;

    case 'GET_EXTRACTOR_CONFIG':
      (async () => {
        respond({ success: true, data: await getExtractorConfig(message.siteKey) });
      })();
      return true;

    case 'EXTRACT_WITH_AI':
      (async () => {
        const session = await getValidSession();
        if (!session) {
          respond({ success: false, error: 'Your session expired. Sign in again.', sessionExpired: true });
          return;
        }
        const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-job`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: String(message.text || '').slice(0, 15000),
            url: message.url,
            siteKey: message.siteKey,
          }),
        });
        if (!response.ok) {
          respond({ success: false, error: `AI extract failed: ${response.status}` });
          return;
        }
        respond({ success: true, data: await response.json() });
      })();
      return true;

    case 'LOG_EXTRACTION_EVENT':
      (async () => {
        const session = await getValidSession();
        if (!session) {
          respond({ success: false });
          return;
        }
        await fetch(`${SUPABASE_URL}/rest/v1/extraction_events`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(message.event),
        });
        respond({ success: true });
      })();
      return true;

    default:
      respond({ success: false, error: 'Unknown message type' });
      return false;
  }
});
