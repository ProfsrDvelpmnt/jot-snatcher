// Deploy with: supabase functions deploy extract-job
// Secret: ANTHROPIC_API_KEY (never ship this in the extension)
// Optional: AI_FALLBACK_ENABLED=false disables the endpoint.
// Optional: AI_DOUBLE_CHARGE=true records an extra usage row. Default is off,
// so an AI-assisted capture counts once when the job is submitted.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIELDS = [
  "organization",
  "position",
  "location",
  "salary",
  "type",
  "environment",
  "clearance",
  "description",
  "ageOfPosting",
  "numApplicants",
] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (Deno.env.get("AI_FALLBACK_ENABLED") === "false") {
    return json({ job: null, disabled: true });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  const authorization = req.headers.get("Authorization") || "";
  if (!supabaseUrl || !anonKey || !authorization.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { Authorization: authorization, apikey: anonKey },
  });
  if (!userResponse.ok) return json({ error: "Unauthorized" }, 401);
  const user = await userResponse.json();
  const userId = user?.id;
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const rateResponse = await fetch(
    `${supabaseUrl}/rest/v1/extension_ai_requests?select=id&user_id=eq.${userId}&created_at=gte.${since}`,
    { headers: { Authorization: authorization, apikey: anonKey } },
  );
  const recent = rateResponse.ok ? await rateResponse.json() : [];
  if (Array.isArray(recent) && recent.length >= 30) {
    return json({ error: "Rate limit exceeded" }, 429);
  }

  await fetch(`${supabaseUrl}/rest/v1/extension_ai_requests`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      apikey: anonKey,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!anthropicKey) return json({ error: "AI is not configured" }, 503);

  const body = await req.json().catch(() => ({}));
  const text = String(body.text || "").slice(0, 15000);
  if (!text.trim()) return json({ job: emptyJob() });

  const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 900,
      system: "Extract job posting fields from the supplied page text. Return only a JSON object. Every field that is not explicitly stated must be null. Never guess, infer, or fill a typical value. environment must be Remote, Hybrid, or In-Person. A Hybrid or on-site statement in the posting outranks a remote badge. clearance must be Unclassified, Classified, Secret, Top Secret, or TS/SCI. When a posting accepts Secret or Top Secret, use Secret.",
      messages: [{
        role: "user",
        content: `Page URL: ${String(body.url || "")}\nSite: ${String(body.siteKey || "")}\n\n${text}`,
      }],
    }),
  });

  if (!aiResponse.ok) return json({ error: "AI request failed" }, 502);
  const aiBody = await aiResponse.json();
  const raw = aiBody?.content?.find((part: { type?: string }) => part.type === "text")?.text || "";
  const job = sanitize(parseJson(raw));

  if (Deno.env.get("AI_DOUBLE_CHARGE") === "true") {
    const month = new Date().toISOString().slice(0, 7);
    await fetch(`${supabaseUrl}/rest/v1/extension_job_submissions`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        apikey: anonKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        organization: job.organization,
        position: job.position,
        submission_source: "ai_fallback",
        usage_month: month,
      }),
    });
  }

  return json({ job });
});

function emptyJob(): Record<string, string | null> {
  return Object.fromEntries(FIELDS.map((field) => [field, null]));
}

function parseJson(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

function sanitize(value: Record<string, unknown>): Record<string, string | null> {
  const job = emptyJob();
  for (const field of FIELDS) {
    const incoming = value[field];
    job[field] = typeof incoming === "string" && incoming.trim() ? incoming.trim() : null;
  }
  return job;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
