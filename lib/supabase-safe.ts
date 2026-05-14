import { createClient } from '@supabase/supabase-js';

let cachedClient: any = null;
let cachedClientIsDisabled = false;
let supabaseUnavailableUntil = 0;
let supabaseReachableUntil = 0;
const SUPABASE_UNAVAILABLE_TTL_MS = 60_000;
const SUPABASE_REACHABLE_TTL_MS = 30_000;

/** Same rules as @supabase/supabase-js `validateSupabaseUrl` (scheme + parseable URL + hostname). */
export function isSupabaseServiceConfigured(): boolean {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  try {
    const withSlash = url.endsWith('/') ? url : `${url}/`;
    const u = new URL(withSlash);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

export function isSupabaseUnavailableError(error: unknown): boolean {
  const value = error as { code?: unknown; message?: unknown; details?: unknown; cause?: unknown } | null | undefined;
  const haystack = [
    value?.code,
    value?.message,
    value?.details,
    value?.cause instanceof Error ? value.cause.message : value?.cause,
    error instanceof Error ? error.message : undefined,
  ]
    .filter(Boolean)
    .map(String)
    .join(' ');

  return (
    haystack.includes('supabase_not_configured') ||
    haystack.includes('Supabase is not configured') ||
    haystack.includes('fetch failed') ||
    haystack.includes('Failed to fetch') ||
    haystack.includes('ENOTFOUND') ||
    haystack.includes('ECONNRESET') ||
    haystack.includes('ECONNREFUSED') ||
    haystack.includes('ETIMEDOUT') ||
    haystack.includes('network')
  );
}

export function markSupabaseUnavailable() {
  supabaseUnavailableUntil = Date.now() + SUPABASE_UNAVAILABLE_TTL_MS;
}

export function isSupabaseTemporarilyUnavailable(): boolean {
  return Date.now() < supabaseUnavailableUntil;
}

export function shouldUseSupabaseFallback(): boolean {
  return !isSupabaseServiceConfigured() || isSupabaseTemporarilyUnavailable();
}

export async function shouldUseSupabaseFallbackSoon(): Promise<boolean> {
  if (shouldUseSupabaseFallback()) return true;
  if (Date.now() < supabaseReachableUntil) return false;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 750);

  try {
    await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    supabaseReachableUntil = Date.now() + SUPABASE_REACHABLE_TTL_MS;
    return false;
  } catch {
    markSupabaseUnavailable();
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

const NOT_CONFIGURED_MSG =
  'Supabase is not configured. In snaptask/.env set NEXT_PUBLIC_SUPABASE_URL to your project URL (https://<project-ref>.supabase.co) and SUPABASE_SERVICE_ROLE_KEY from Supabase → Project Settings → API.';

function createDisabledSupabaseClient() {
  const err = {
    message: NOT_CONFIGURED_MSG,
    details: '',
    hint: '',
    code: 'supabase_not_configured',
  };
  const emptyList = Promise.resolve({ data: [] as unknown[], error: null });
  const failed = Promise.resolve({ data: null, error: err });
  const noopOk = Promise.resolve({ data: null, error: null });

  function queryChain(listResult: Promise<{ data: unknown; error: unknown }>) {
    const chain: Record<string, unknown> = {};
    const self = chain as any;
    self.eq = () => self;
    self.neq = () => self;
    self.order = () => self;
    self.limit = () => self;
    self.gte = () => self;
    self.lte = () => self;
    self.maybeSingle = () => failed;
    self.single = () => failed;
    self.then = (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      listResult.then(onFulfilled, onRejected);
    self.catch = (onRejected?: (e: unknown) => unknown) => listResult.catch(onRejected);
    return self;
  }

  function thenableSelectResult() {
    return {
      single: () => failed,
      then: (onF?: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => failed.then(onF, onR),
    };
  }

  /** After `.update()` — supports `.eq().select()`, `.eq()` only (await), or chained `.eq()`. */
  function updateAfterEq() {
    const self: any = {};
    self.eq = () => self;
    self.select = (_cols?: string) => thenableSelectResult();
    self.single = () => failed;
    self.then = (onF?: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => noopOk.then(onF, onR);
    return self;
  }

  return {
    from: (_table: string) => ({
      select: (_cols?: string) => queryChain(emptyList),
      insert: (_rows: unknown) => ({
        select: (_cols?: string) => ({
          single: () => failed,
          then: (onF?: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => failed.then(onF, onR),
        }),
        then: (onF?: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => failed.then(onF, onR),
      }),
      update: (_vals: unknown) => ({
        eq: (_c: string, _v: unknown) => updateAfterEq(),
      }),
      delete: () => ({
        eq: (_c: string, _v: unknown) => failed,
      }),
    }),
  };
}

let disabledSingleton: ReturnType<typeof createDisabledSupabaseClient> | null = null;

function getDisabledSupabaseClient() {
  if (!disabledSingleton) disabledSingleton = createDisabledSupabaseClient();
  return disabledSingleton;
}

export function getSupabaseClient() {
  const configured = isSupabaseServiceConfigured();
  if (cachedClient && !(cachedClientIsDisabled && configured)) return cachedClient;

  if (!configured) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[supabase] Missing or invalid NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — using no-op client (empty data, failed writes).',
      );
    }
    cachedClient = getDisabledSupabaseClient();
    cachedClientIsDisabled = true;
    return cachedClient;
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  try {
    cachedClient = createClient(url, key);
    cachedClientIsDisabled = false;
  } catch (e) {
    console.warn('[supabase] createClient failed; using no-op client.', e);
    cachedClient = getDisabledSupabaseClient();
    cachedClientIsDisabled = true;
  }
  return cachedClient;
}
