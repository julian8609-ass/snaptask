import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseServiceConfigured } from '../../lib/supabase-safe';

// Lazy server-side Supabase client factory (prevents build-time errors)
let cachedSupabaseServer: any = null;
let cachedSupabaseServerIsFallback = false;

export function getSupabaseServer() {
  const configured = isSupabaseServiceConfigured();
  if (cachedSupabaseServer && !(cachedSupabaseServerIsFallback && configured)) {
    return cachedSupabaseServer;
  }

  if (!configured) {
    console.warn(
      'Supabase server client not configured (invalid or missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
    );
    cachedSupabaseServer = getSupabaseClient();
    cachedSupabaseServerIsFallback = true;
    return cachedSupabaseServer;
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  try {
    cachedSupabaseServer = createClient(supabaseUrl, supabaseServiceKey);
    cachedSupabaseServerIsFallback = false;
  } catch (error) {
    console.error('Failed to create Supabase server client:', error);
    cachedSupabaseServer = getSupabaseClient();
    cachedSupabaseServerIsFallback = true;
  }
  return cachedSupabaseServer;
}

// Lazy proxy so importing this module never runs `createClient` at module-eval time
// (avoids 500 on /api/reminders when env is wrong or Turbopack serves a stale chunk).
let lazyDbClient: ReturnType<typeof getSupabaseClient> | null = null;
function resolveDbClient() {
  if (!lazyDbClient) lazyDbClient = getSupabaseClient();
  return lazyDbClient;
}

export const supabase = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    const client = resolveDbClient() as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(client) : value;
  },
}) as ReturnType<typeof getSupabaseClient>;

export default supabase;
